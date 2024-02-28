import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiBody, ApiResponse } from "@nestjs/swagger";
import { LoginResponseDto } from "src/dto/login-response-dto";
import { LoginDto } from "src/dto/login.dto";
import { RESPONSE_TYPES } from "src/modules/models/responseTypes";

export function ApiLogin() {
	return applyDecorators(
		ApiOperation({ summary: "Login user" }),
		ApiBody({ type: LoginDto }),
		ApiResponse({
			status: RESPONSE_TYPES.OK,
			description: "User logged in successfully",
			type: LoginResponseDto
		}),
		ApiResponse({ status: RESPONSE_TYPES.UNAUTHORIZED, description: "Invalid credentials" })
	);
}
