import { Injectable } from "@nestjs/common";
import { JsonWebTokenError, JwtService, TokenExpiredError } from "@nestjs/jwt";
import { throwHttpException } from "../../utils/throwHttpException";
import { RESPONSE_TYPES } from "../models/responseTypes";

@Injectable()
export class TokenService {
	constructor(private jwtService: JwtService) {}

	private handleRefreshTokenError(error: Error) {
		if (error instanceof TokenExpiredError) {
			throwHttpException(RESPONSE_TYPES.UNAUTHORIZED, "Refresh token expired");
		} else if (error instanceof JsonWebTokenError) {
			throwHttpException(RESPONSE_TYPES.UNAUTHORIZED, "Invalid refresh token");
		}
		throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to verify refresh token");
	}

	generateAccessToken(user: Omit<User, "passwordHash">) {
		const payload = { sub: user.userId };
		return this.jwtService.sign(payload, {
			
		});
	}

	generateRefreshToken(user: Omit<User, "passwordHash">) {
		const payload = { sub: user.userId };
		return this.jwtService.sign(payload, {
			secret: process.env.REFRESH_JWT_SECRET,
			expiresIn: process.env.REFRESH_TOKEN_EXPIRE
		});
	}

	verifyRefreshToken(token: string) {
		try {
			return this.jwtService.verify(token, {
				secret: process.env.REFRESH_JWT_SECRET
			});
		} catch (error) {
			this.handleRefreshTokenError(error);
		}
	}

	async refreshToken(refreshToken: string) {
		const payload = this.verifyRefreshToken(refreshToken);
		return {
			accessToken: this.generateAccessToken(payload)
		};
	}
}
