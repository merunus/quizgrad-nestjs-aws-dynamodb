import {
	BadRequestException,
	NotFoundException,
	UnauthorizedException,
	ForbiddenException,
	ConflictException,
	InternalServerErrorException,
	HttpException
} from "@nestjs/common";
import { RESPONSE_TYPES } from "src/modules/models/responseTypes";

export function throwHttpException(type: RESPONSE_TYPES, objectOrError?: any) {
	switch (type) {
		case RESPONSE_TYPES.NO_CONTENT:
			throw new HttpException(objectOrError, RESPONSE_TYPES.NO_CONTENT);
		case RESPONSE_TYPES.BAD_REQUEST:
			throw new BadRequestException([objectOrError]);
		case RESPONSE_TYPES.UNAUTHORIZED:
			throw new UnauthorizedException(objectOrError);
		case RESPONSE_TYPES.FORBIDDEN:
			throw new ForbiddenException(objectOrError);
		case RESPONSE_TYPES.NOT_FOUND:
			throw new NotFoundException(objectOrError);
		case RESPONSE_TYPES.CONFLICT:
			throw new ConflictException(objectOrError);
		case RESPONSE_TYPES.SERVER_ERROR:
			throw new InternalServerErrorException(objectOrError);
		default:
			throw new HttpException("Unexpected error", RESPONSE_TYPES.SERVER_ERROR);
	}
}
