import { Injectable } from "@nestjs/common";
import { DynamodbService } from "../dynamodb/dynamodb.service";
import { CreateUserDto } from "../../dto/create-user-dto";
import { hashPassword } from "../../utils/hashPassword";
import { v4 as uuid } from "uuid";
import {
	ScanCommand,
	GetCommand,
	UpdateCommandInput,
	UpdateCommand,
	DeleteCommandInput,
	GetCommandInput,
	ScanCommandInput,
	PutCommandInput,
	QueryCommand,
	QueryCommandInput
} from "@aws-sdk/lib-dynamodb";
import { throwHttpException } from "../../utils/throwHttpException";
import { RESPONSE_TYPES } from "../../models/responseTypes";
import { S3storageService } from "../../modules/s3storage/s3storage.service";
import { S3_STORAGE_BASE_URL } from "../../constants/core.constants";
import { GSIIndexes } from "../../models/GSI-indexes";
import { TokenService } from "../token/token.service";
import { s3StorageFolders } from "../../models/s3StorageFolders";
import { CustomLogger, createLogger } from "src/utils/logger";

@Injectable()
export class UserService {
	constructor(
		private readonly dynamodbService: DynamodbService,
		private readonly s3storageService: S3storageService,
		private tokenService: TokenService
	) {
		this.logger = createLogger("Users service", true);
	}

	private logger: CustomLogger;

	async handleCreateGoogleUser({ email, name, sub: googleId }: GoogleUserInfo) {
		try {
			const userUuid = uuid();
			const newUser: GoogleUser & TDynamoDBKeys = {
				PK: `USER#${userUuid}`, // Partition key
				SK: `#METADATA#${userUuid}`, // Sort key
				createdAt: new Date().toISOString(),
				email,
				username: name, // User full name from google info
				userUuid,
				googleId // Add google user id
			};
			const commandInput: PutCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Item: newUser
			};
			// Exclude redundant properties from user return
			const { SK, PK, ...userPayload } = newUser;
			// Generate tokens
			const accessToken = this.tokenService.generateAccessToken(userPayload.userUuid);
			const refreshToken = this.tokenService.generateRefreshToken(userPayload.userUuid);

			// Save user to database
			await this.dynamodbService.sendPutCommand(commandInput);
			return {
				accessToken,
				refreshToken
			};
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(
				error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
				`Failed to create google user`
			);
		}
	}

	async handleCreateUser({ email, password, username }: CreateUserDto) {
		// Check if user with such email already exist
		const user = await this.handleGetUserByEmail(email);
		if (user) throwHttpException(RESPONSE_TYPES.NOT_FOUND, `User ${email} already exist`);

		try {
			const userUuid = uuid();
			const newUser: User & TDynamoDBKeys = {
				PK: `USER#${userUuid}`, // Partition key
				SK: `#METADATA#${userUuid}`, // Sort key
				createdAt: new Date().toISOString(),
				email,
				username,
				passwordHash: await hashPassword(password),
				userUuid
			};
			const commandInput: PutCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Item: newUser
			};
			// Exclude redundant properties from user return
			const { SK, PK, passwordHash, ...userPayload } = newUser;
			// Generate tokens
			const accessToken = this.tokenService.generateAccessToken(userPayload.userUuid);
			const refreshToken = this.tokenService.generateRefreshToken(userPayload.userUuid);

			// Save user to database
			await this.dynamodbService.sendPutCommand(commandInput);
			return {
				accessToken,
				refreshToken
			};
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(
				error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
				`Failed to create user`
			);
		}
	}

	async handleGetAllUsers(): Promise<User[]> {
		try {
			const commandInput: ScanCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				// Include an additional condition to filter only items where SK begins with "#METADATA#"
				FilterExpression: "begins_with(PK, :pkval) AND begins_with(SK, :skval)",
				ExpressionAttributeValues: {
					":pkval": "USER#",
					":skval": "#METADATA#"
				}
			};
			const users = await this.dynamodbService.sendScanCommand<User[]>(commandInput);
			// Exclude password hash from items
			const adjustedUsers = users.map((user) => {
				const { passwordHash, ...userWithoutPassword } = user;
				return userWithoutPassword;
			});
			return adjustedUsers as User[];
		} catch (error) {
			throwHttpException(
				error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
				"Failed to get all users"
			);
		}
	}

	async handleGetUserById(userUuid: string): Promise<User> {
		try {
			const commandInput: GetCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Key: {
					PK: `USER#${userUuid}`,
					SK: `#METADATA#${userUuid}`
				}
			};
			const user = await this.dynamodbService.sendGetCommand(commandInput);
			if (!user) throwHttpException(RESPONSE_TYPES.NOT_FOUND, `User with id ${userUuid} not found`);
			// Exclude password hash from item
			const { passwordHash, ...userWithoutPassword } = user;
			return userWithoutPassword as User;
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to find user");
		}
	}

	async handleGetUserByEmail(userEmail: string): Promise<User | GoogleUser> {
		try {
			const commandInput: QueryCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				IndexName: GSIIndexes.UsersByEmail,
				KeyConditionExpression: "email = :userEmail",
				ExpressionAttributeValues: {
					":userEmail": userEmail
				}
			};
			const items = await this.dynamodbService.sendQueryCommand<User[]>(commandInput);
			return items[0] as User | GoogleUser;
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, `Failed to find with email ${userEmail}`);
		}
	}

	async handleUpdateUserAvatarProperty(userUuid: string, avatarUrl: string) {
		try {
			// Update user avatarUrl property in the database
			const commandInput: UpdateCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Key: {
					PK: `USER#${userUuid}`,
					SK: `#METADATA#${userUuid}`
				},
				UpdateExpression: "set avatarUrl = :avatarUrl",
				ExpressionAttributeValues: {
					":avatarUrl": avatarUrl
				},
				ReturnValues: "UPDATED_NEW"
			};
			await this.dynamodbService.sendUpdateCommand(commandInput);
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to update user avatar property");
		}
	}

	async handleUserAvatarUpload(file: Express.Multer.File, userUuid: string) {
		if (!userUuid) throwHttpException(RESPONSE_TYPES.BAD_REQUEST, "User id must be provided");
		if (!file) throwHttpException(RESPONSE_TYPES.BAD_REQUEST, "User avatar must be provided");

		// Check if user with passed id exist
		const targetUser = await this.handleGetUserById(userUuid);
		if (!targetUser)
			throwHttpException(RESPONSE_TYPES.NOT_FOUND, `User with id ${userUuid} not found`);

		try {
			// Construct unique file key
			const fileKey = `${s3StorageFolders.AVATARS}/avatar_${userUuid}}`;

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

			await this.handleUpdateUserAvatarProperty(userUuid, avatarUrl);

			return avatarUrl;
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to upload user avatar");
		}
	}

	async handleDeleteUser(userUuid: string) {
		try {
			const commandInput: DeleteCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Key: {
					PK: `USER#${userUuid}`,
					SK: `#METADATA#${userUuid}`
				}
			};
			await this.dynamodbService.sendDeleteCommand(commandInput);
			return "User was successfully deleted";
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to delete user");
		}
	}

	async handleDeleteUserAvatar(userUuid: string) {
		const user = await this.handleGetUserById(userUuid);
		if (!user) throwHttpException(RESPONSE_TYPES.NOT_FOUND, `User with id ${userUuid} not found`);

		if (!user?.avatarUrl)
			throwHttpException(RESPONSE_TYPES.NOT_FOUND, "User doesn't have an avatar");

		try {
			await this.handleUpdateUserAvatarProperty(userUuid, "");
			await this.s3storageService.removeFileFromStorage(user.avatarUrl, s3StorageFolders.AVATARS);

			return "User avatar was successfully deleted";
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to delete user avatar");
		}
	}
}
