import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { RESPONSE_TYPES } from "../../../modules/models/responseTypes";

export function ApiDeleteUser() {
	return applyDecorators(
		ApiResponse({ status: RESPONSE_TYPES.OK, description: "User was successfully deleted" }),
		ApiResponse({ status: RESPONSE_TYPES.NOT_FOUND, description: "User not found" }),
		ApiResponse({ status: RESPONSE_TYPES.SERVER_ERROR, description: "Internal Server Error" })
	);
}
