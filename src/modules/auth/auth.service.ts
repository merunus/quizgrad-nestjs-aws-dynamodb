import * as bcrypt from "bcryptjs";
import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { throwHttpException } from "src/utils/throwHttpException";
import { TokenService } from "../token/token.service";
import { RESPONSE_TYPES } from "../models/responseTypes";

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private tokenService: TokenService
	) {}

	async validateUser(email: string, pass: string): Promise<Omit<User, "passwordHash"> | null> {
		const user = await this.userService.handleGetUserByEmail(email);
		const isPasswordValid = user && (await bcrypt.compare(pass, user.passwordHash));

		if (!user || !isPasswordValid) {
			throwHttpException(RESPONSE_TYPES.UNAUTHORIZED, "Invalid credentials");
		}

		const { passwordHash, ...authenticatedUser } = user;
		return authenticatedUser;
	}

	async login(user: Omit<User, "passwordHash">) {
		return {
			access_token: this.tokenService.generateAccessToken(user),
			refresh_token: this.tokenService.generateRefreshToken(user)
		};
	}
}
