import { applyDecorators } from "@nestjs/common";
import { ApiConflictResponse, ApiOkResponse } from "@nestjs/swagger";
import { UserResponseDto } from "../../../dto/user-response.dto";

export function ApiCreateUser() {
	return applyDecorators(
		ApiOkResponse({ description: "User successfully created", type: UserResponseDto }),
		ApiConflictResponse({ description: "User with email already exists" })
	);
}
