import { Injectable } from "@nestjs/common";
import { DynamodbService } from "../dynamodb/dynamodb.service";
import { CreateUserDto } from "../../dto/create-user-dto";
import { hashPassword } from "../../utils/hashPassword";
import { v4 as uuid } from "uuid";
import {
	PutCommand,
	ScanCommand,
	GetCommand,
	UpdateCommandInput,
	UpdateCommand,
	DeleteCommand,
	DeleteCommandInput,
	GetCommandInput,
	ScanCommandInput,
	PutCommandInput,
	QueryCommand,
	QueryCommandInput
} from "@aws-sdk/lib-dynamodb";
import { throwHttpException } from "../../utils/throwHttpException";
import { RESPONSE_TYPES } from "../models/responseTypes";
import { TDynamoDBKeys } from "../../types/dynamodb";
import { S3storageService } from "../../modules/s3storage/s3storage.service";
import { PutObjectCommandInput, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3_STORAGE_BASE_URL } from "../../constants/core.constants";
import { GSIIndexes } from "../models/GSI-indexes";
import { TokenService } from "../token/token.service";
import { s3StorageFolders } from "../models/s3StorageFolders";

@Injectable()
export class UserService {
	constructor(
		private readonly dynamodbService: DynamodbService,
		private readonly s3storageService: S3storageService,
		private tokenService: TokenService
	) {}

	async handleCreateUser({ email, password, username }: CreateUserDto) {
		const isUserExist = await this.handleGetUserByEmail(email);
		if (isUserExist)
			throwHttpException(RESPONSE_TYPES.CONFLICT, `User with email ${email} already exist`);
		try {
			const userId = uuid();
			const newUser: User & TDynamoDBKeys = {
				PK: `USER#${userId}`, // Partition key
				SK: `#METADATA#${userId}`, // Sort key
				createdAt: new Date().toISOString(),
				email,
				username,
				passwordHash: await hashPassword(password),
				userId
			};
			const params: PutCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Item: newUser
			};
			// Exclude redundant properties from user return
			const { SK, PK, passwordHash, ...userPayload } = newUser;

			// Generate tokens
			const accessToken = this.tokenService.generateAccessToken(userPayload);
			const refreshToken = this.tokenService.generateRefreshToken(userPayload);

			const dbClient = this.dynamodbService.getDynamoDbClient();
			// Save user to database
			await dbClient.send(new PutCommand(params));

			return {
				user: userPayload,
				accessToken,
				refreshToken
			};
		} catch (error) {
			console.error("DynamoDB Error:", error); // Log the actual error message
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to create user");
		}
	}

	async handleGetAllUsers(): Promise<User[]> {
		try {
			const dbClient = this.dynamodbService.getDynamoDbClient();
			const params: ScanCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				FilterExpression: "begins_with(PK, :pkval)", // Get the users by the PK field which starts with USER
				ExpressionAttributeValues: {
					":pkval": "USER#"
				}
			};
			const command = new ScanCommand(params);
			const { Items } = await dbClient.send(command);
			return Items as User[];
		} catch (error) {
			console.error("DynamoDB Error:", error); // Log the actual error message
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to get all users");
		}
	}

	async handleGetUserById(userId: string): Promise<User> {
		try {
			const dbClient = this.dynamodbService.getDynamoDbClient();
			const params: GetCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Key: {
					PK: `USER#${userId}`,
					SK: `#METADATA#${userId}`
				}
			};
			const command = new GetCommand(params);
			const { Item } = await dbClient.send(command);
			if (!Item) throwHttpException(RESPONSE_TYPES.NOT_FOUND, `User with id ${userId} not found`);
			return Item as User;
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to find user");
		}
	}

	async handleGetUserByEmail(userEmail: string): Promise<User> {
		try {
			const dbClient = this.dynamodbService.getDynamoDbClient();
			const params: QueryCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				IndexName: GSIIndexes.UsersByEmail,
				KeyConditionExpression: "email = :userEmail",
				ExpressionAttributeValues: {
					":userEmail": userEmail
				}
			};
			const command = new QueryCommand(params);
			const { Items } = await dbClient.send(command);
			return Items[0] as User;
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, `Failed to find with email ${userEmail}`);
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

		// Check if user with passed id exist
		const targetUser = await this.handleGetUserById(userId);
		if (!targetUser)
			throwHttpException(RESPONSE_TYPES.NOT_FOUND, `User with id ${userId} not found`);

		try {
			// Construct unique file key
			const fileKey = `${s3StorageFolders.AVATARS}/${userId}-${Date.now()}`;

			// Save image to s3 storage
			await this.s3storageService.saveImageToStorage(fileKey, file);

			// If user already has avatar remove the old one
			if (targetUser?.avatarUrl) {
				await this.s3storageService.removeFileFromStorage(
					targetUser.avatarUrl,
					s3StorageFolders.AVATARS
				);
			}

			// Construct the URL of the uploaded avatar
			const avatarUrl = `${S3_STORAGE_BASE_URL}/${fileKey}`;

			await this.handleUpdateUserAvatarProperty(userId, avatarUrl);

			return avatarUrl;
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to upload user avatar");
		}
	}

	async handleDeleteUser(userId: string) {
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
			return "User was successfully deleted";
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to delete user");
		}
	}
}
