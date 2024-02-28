import { applyDecorators } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse } from "@nestjs/swagger";
import { UserDto } from "src/dto/user-dto";

export function ApiGetUserById() {
	return applyDecorators(
		ApiOkResponse({ description: "Retrieve a user by their userId", type: UserDto }),
		ApiNotFoundResponse({ description: "User with such userId was not found" })
	);
}
