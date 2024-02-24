import { Injectable } from "@nestjs/common";
import { DynamodbService } from "../dynamodb/dynamodb.service";
import { CreateUserDto } from "src/dto/create-user-dto";
import { User } from "src/types/user";
import { hashPassword } from "src/utils/hashPassword";
import { v4 as uuid } from "uuid";
import {
	PutCommand,
	ScanCommand,
	GetCommand,
	UpdateCommandInput,
	UpdateCommand,
	DeleteCommand,
	DeleteCommandInput
} from "@aws-sdk/lib-dynamodb";
import { throwHttpException } from "src/utils/throwHttpException";
import { RESPONSE_TYPES } from "../models/responseTypes";
import { TDynamoDBKeys } from "src/types/dynamodb";
import { S3storageService } from "src/s3storage/s3storage.service";
import { PutObjectCommandInput, PutObjectCommand } from "@aws-sdk/client-s3";

@Injectable()
export class UserService {
	constructor(
		private readonly dynamodbService: DynamodbService,
		private readonly s3storageService: S3storageService
	) {}

	async handleCreateUser({ email, password, username }: CreateUserDto) {
		const userId = uuid();
		const newUser: User & TDynamoDBKeys = {
			PK: `USER#${userId}`, // Partition key
			SK: `#METADATA#${userId}`, // Sort key
			createdAt: new Date().toISOString(),
			email,
			username,
			passwordHash: await hashPassword(password)
		};
		const params = {
			TableName: process.env.DYNAMODB_TABLE_NAME,
			Item: newUser
		};
		try {
			const dbClient = this.dynamodbService.getDynamoDbClient();
			await dbClient.send(new PutCommand(params));
			const { SK, PK, passwordHash, ...userReturn } = newUser;
			return userReturn;
		} catch (error) {
			console.error("DynamoDB Error:", error); // Log the actual error message
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to create user");
		}
	}

	async handleGetAllUsers() {
		try {
			const dbClient = this.dynamodbService.getDynamoDbClient();
			const params = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				FilterExpression: "begins_with(PK, :pkval)", // Get the users by the PK field which starts with USER
				ExpressionAttributeValues: {
					":pkval": "USER#"
				}
			};
			const command = new ScanCommand(params);
			const { Items } = await dbClient.send(command);
			return Items;
		} catch (error) {
			console.error("DynamoDB Error:", error); // Log the actual error message
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to create user");
		}
	}

	async handleGetUserById(userId: string) {
		try {
			const dbClient = this.dynamodbService.getDynamoDbClient();
			const params = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Key: {
					PK: `USER#${userId}`,
					SK: `#METADATA#${userId}`
				}
			};
			const command = new GetCommand(params);
			const { Item } = await dbClient.send(command);
			return Item;
		} catch (error) {
			console.error("DynamoDB Error:", error); // Log the actual error message
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to create user");
		}
	}

	async handleUpdateUserAvatarProperty(userId: string, avatarUrl: string) {
		try {
			// Update user avatarUrl property in the database
			const updateParams: UpdateCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Key: {
					PK: `USER#${userId}`,
					SK: `#METADATA#${userId}`
				},
				UpdateExpression: "set avatarUrl = :avatarUrl",
				ExpressionAttributeValues: {
					":avatarUrl": avatarUrl
				},
				ReturnValues: "UPDATED_NEW"
			};

			const dynamoDbClient = this.dynamodbService.getDynamoDbClient();
			const updateUserAvatarCommand = new UpdateCommand(updateParams);
			await dynamoDbClient.send(updateUserAvatarCommand);
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to update user avatar property");
		}
	}

	async handleUserAvatarUpload(file: Express.Multer.File, userId: string) {
		if (!userId) throwHttpException(RESPONSE_TYPES.BAD_REQUEST, "User id must be provided");
		if (!file) throwHttpException(RESPONSE_TYPES.BAD_REQUEST, "User avatar must be provided");

		const targetUser = await this.handleGetUserById(userId);
		if (!targetUser)
			throwHttpException(RESPONSE_TYPES.NOT_FOUND, `User with id ${userId} not found`);

		try {
			const fileKey = `avatars/${userId}-${Date.now()}`; // Unique file key

			const params: PutObjectCommandInput = {
				Bucket: process.env.S3_BUCKET_NAME,
				Key: fileKey,
				Body: file.buffer,
				ContentType: file.mimetype,
				ACL: "public-read"
			};

			// Save the image in the S3 storage
			const s3Client = this.s3storageService.getS3Client();
			const saveAvatarCommand = new PutObjectCommand(params);
			await s3Client.send(saveAvatarCommand);

			// Construct the URL of the uploaded avatar
			const avatarUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

			await this.handleUpdateUserAvatarProperty(userId, avatarUrl);

			return avatarUrl;
		} catch (error) {
			console.log(error);
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to upload user avatar");
		}
	}

	async handleDeleteUser(userId) {
		try {
			const params: DeleteCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Key: {
					PK: `USER#${userId}`,
					SK: `#METADATA#${userId}`
				}
			};
			const command = new DeleteCommand(params);
			const dynamoDbClient = this.dynamodbService.getDynamoDbClient();
			await dynamoDbClient.send(command);
			return `User was successfully delete`
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to delete user");
		}
	}
}

// How to get access to the uploaded images
// Enabling Public Read Access for Avatar Images in S3 Bucket

// 1. Set Object ACL to 'public-read' on Upload:
// - When uploading an avatar image to S3, include the ACL setting in the upload parameters to make the object publicly readable.
// - Example: ACL: 'public-read'

// 2. Update S3 Bucket Policy for Public Access:
// - Navigate to the S3 bucket in the AWS Management Console.
// - Go to the Permissions tab and click on Bucket Policy.
// - Add the following policy, replacing 'quizgrad-images' with your bucket name, to allow public read access to objects under 'avatars/':

// {
//   "Version": "2012-10-17",
//   "Statement": [{
//     "Sid": "PublicReadForAvatars",
//     "Effect": "Allow",
//     "Principal": "*",
//     "Action": "s3:GetObject",
//     "Resource": "arn:aws:s3:::quizgrad-images/avatars/*"
//   }]
// }

// 3. Enable Object Ownership with ACLs:
// - Still in the S3 bucket settings, find the Object Ownership section under the Permissions tab.
// - Choose "ACLs enabled" to allow ACLs to manage permissions.
// - This step ensures that the 'public-read' ACL and bucket policy effectively grant the intended public access to your avatar images.
