import { Injectable } from "@nestjs/common";
import { JsonWebTokenError, JwtService, TokenExpiredError } from "@nestjs/jwt";
import { throwHttpException } from "../../utils/throwHttpException";
import { RESPONSE_TYPES } from "../../models/responseTypes";
import { AxiosError } from "axios";

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  private handleRefreshTokenError(error: AxiosError) {
    if (error instanceof TokenExpiredError) {
      throwHttpException(RESPONSE_TYPES.UNAUTHORIZED, "Refresh token expired");
    } else if (error instanceof JsonWebTokenError) {
      throwHttpException(RESPONSE_TYPES.UNAUTHORIZED, "Invalid refresh token");
    } else {
      throwHttpException(
        error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
        error?.response || "Failed to verify refresh token"
      );
    }
  }

  generateAccessToken(userUuid: string) {
    const payload = { sub: userUuid, tokenType: "access" };
    return this.jwtService.sign(payload, {
      secret: process.env.ACCESS_JWT_SECRET,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE
    });
  }

  generateRefreshToken(userUuid: string) {
    const payload = { sub: userUuid, tokenType: "refresh" };
    return this.jwtService.sign(payload, {
      secret: process.env.REFRESH_JWT_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE
    });
  }

  verifyRefreshToken(token: string): TokenUserPayload {
    try {
      const payload: TokenUserPayload = this.jwtService.verify(token, {
        secret: process.env.REFRESH_JWT_SECRET
      });
      if (!payload?.tokenType || payload.tokenType === "access") {
        throwHttpException(RESPONSE_TYPES.BAD_REQUEST, "Invalid token type");
      }
      return payload;
    } catch (error) {
      this.handleRefreshTokenError(error);
    }
  }

  async refreshAccessToken(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    return {
      accessToken: this.generateAccessToken(payload.sub)
    };
  }
}
