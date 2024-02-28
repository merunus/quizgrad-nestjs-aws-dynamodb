import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiConsumes, ApiBody, ApiResponse } from "@nestjs/swagger";
import { RESPONSE_TYPES } from "src/modules/models/responseTypes";

export function ApiUserAvatarUpload() {
	return applyDecorators(
		ApiOperation({ summary: "Upload user avatar" }),
		ApiConsumes("multipart/form-data"),
		ApiBody({
			schema: {
				type: "object",
				properties: {
					userId: { type: "string", description: "The ID of the user" },
					avatar: {
						type: "string",
						format: "binary",
						description: "The avatar image file"
					}
				}
			}
		}),
		ApiResponse({
			status: RESPONSE_TYPES.OK,
			description: "Avatar uploaded successfully",
			type: String
		}),
		ApiResponse({ status: RESPONSE_TYPES.BAD_REQUEST, description: "Bad Request" }),
		ApiResponse({ status: RESPONSE_TYPES.NOT_FOUND, description: "User not found" }),
		ApiResponse({ status: RESPONSE_TYPES.SERVER_ERROR, description: "Internal Server Error" })
	);
}
