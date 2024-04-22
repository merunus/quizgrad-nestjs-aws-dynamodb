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

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private tokenService: TokenService
	) {}

	async validateUser(email: string, pass: string): Promise<Omit<User, "passwordHash"> | null> {
		const user = await this.userService.handleGetUserByEmail(email);
		const isDefaultUser = !isGoogleUser(user);

		// Check if the user was created using google
		if (user && !isDefaultUser)
			// If so throw an error and tell user to user google authorization
			throwHttpException(
				RESPONSE_TYPES.CONFLICT,
				"It looks like you signed up using Google. Please use Google to log in."
			);

		const isPasswordValid =
			user && isDefaultUser && (await bcrypt.compare(pass, user.passwordHash));

		if (!user || !isPasswordValid) {
			throwHttpException(RESPONSE_TYPES.UNAUTHORIZED, "Invalid credentials");
		}

		const { passwordHash, ...authenticatedUser } = user as User;
		return authenticatedUser;
	}

	async login(user: Omit<User, "passwordHash">) {
		return {
			accessToken: this.tokenService.generateAccessToken(user),
			refreshToken: this.tokenService.generateRefreshToken(user)
		};
	}

	async handleGoogleAuth({ accessToken }: GoogleLoginDto) {
		try {
			const googleUserInfo: GoogleUserInfo = await this.fetchGoogleUserProfile(accessToken);
			const existingUser = await this.userService.handleGetUserByEmail(googleUserInfo.email);
			// If user is not registered
			if (!existingUser) return this.userService.handleCreateGoogleUser(googleUserInfo);
			// If user already exist with such email
			else return this.login(existingUser);
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(
				RESPONSE_TYPES.SERVER_ERROR,
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
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, `Failed to fetch user google info`);
		}
	}
}
