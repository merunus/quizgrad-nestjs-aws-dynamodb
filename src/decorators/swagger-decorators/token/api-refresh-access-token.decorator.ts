import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiBody, ApiResponse } from "@nestjs/swagger";
import { RefreshTokenDto } from "src/dto/refresh-token.dto";
import { RESPONSE_TYPES } from "src/modules/models/responseTypes";

export function ApiRefreshAccessToken() {
	return applyDecorators(
		ApiOperation({ summary: "Refresh access token" }),
		ApiBody({ type: RefreshTokenDto }),
		ApiResponse({ status: RESPONSE_TYPES.OK, description: "Access token refreshed successfully" }),
		ApiResponse({
			status: RESPONSE_TYPES.UNAUTHORIZED,
			description: "Invalid or expired refresh token"
		})
	);
}
