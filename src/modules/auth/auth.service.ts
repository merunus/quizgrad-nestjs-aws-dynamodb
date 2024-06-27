import * as bcrypt from "bcryptjs";
import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { throwHttpException } from "../../utils/throwHttpException";
import { TokenService } from "../token/token.service";
import { RESPONSE_TYPES } from "../../models/responseTypes";
import axios from "axios";
import { GOOGLE_USER_API_URL } from "src/constants/core.constants";
import { GoogleLoginDto } from "src/dto/google-login.dto";
import { isGoogleUser } from "src/guards/isGoogleUser";
import { RegisterDto } from "src/dto/register.dto";
import { v4 as uuid } from "uuid";
import { LoginDto } from "src/dto/login.dto";
import { hashPassword } from "src/utils/hashPassword";
import { PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { DynamodbService } from "../dynamodb/dynamodb.service";

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private dynamodbService: DynamodbService,
		private tokenService: TokenService
	) {}

	generateTokens(userUuid: string) {
		return {
			accessToken: this.tokenService.generateAccessToken(userUuid),
			refreshToken: this.tokenService.generateRefreshToken(userUuid)
		};
	}

	async validateUser(email: string, pass: string): Promise<BaseUser | null> {
		const user = await this.userService.handleGetUserByEmail(email);

		if (!user) {
			throwHttpException(RESPONSE_TYPES.NOT_FOUND, `Failed to find user with email ${email}`);
		}

		const isDefaultUser = !isGoogleUser(user);
		// Check if the user was created using google
		if (user && !isDefaultUser)
			// If so throw an error and tell user to user google authorization
			throwHttpException(
				RESPONSE_TYPES.CONFLICT,
				"It looks like you signed up using Google. Please use Google to log in."
			);

		const isPasswordValid = await bcrypt.compare(pass, (user as User).passwordHash);

		if (!user || !isPasswordValid) {
			throwHttpException(RESPONSE_TYPES.UNAUTHORIZED, "Invalid credentials");
		}

		const { passwordHash, ...authenticatedUser } = user as User;
		return authenticatedUser;
	}

	async handleLogin(loginDto: LoginDto) {
		try {
			const user = await this.validateUser(loginDto.email, loginDto.password);
			if (!user) throwHttpException(RESPONSE_TYPES.UNAUTHORIZED, "Invalid credentials");
			return {
				accessToken: this.tokenService.generateAccessToken(user.userUuid),
				refreshToken: this.tokenService.generateRefreshToken(user.userUuid)
			};
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(
				error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
				`Failed to login : ${error}`
			);
		}
	}

	async handleGoogleAuth({ accessToken }: GoogleLoginDto) {
		try {
			const googleUserInfo: GoogleUserInfo = await this.fetchGoogleUserProfile(accessToken);
			const existingUser = await this.userService.handleGetUserByEmail(googleUserInfo.email);
			// If user is not registered
			if (!existingUser) {
				return this.userService.handleCreateGoogleUser(googleUserInfo);
			}
			// If user already exist with such email
			return this.generateTokens(existingUser.userUuid);
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(
				error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
				`Failed to authenticate with Google : ${error}`
			);
		}
	}

	async fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserInfo> {
		const googleApiUrl = `${GOOGLE_USER_API_URL}?access_token=${accessToken}`;
		try {
			const response = await axios.get(googleApiUrl);
			return response.data; // Contains email, name, picture, etc.
		} catch (error) {
			throwHttpException(
				error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
				`Failed to fetch user google info`
			);
		}
	}

	async handleRegister({ email, password, username }: RegisterDto) {
		// Check if user with such email already exist
		const user = await this.userService.handleGetUserByEmail(email);
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
			// Generate tokens
			const { accessToken, refreshToken } = this.generateTokens(newUser.userUuid);
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
}
