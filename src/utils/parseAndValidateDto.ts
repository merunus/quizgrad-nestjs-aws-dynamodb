import { CreateSetDto } from "src/dto/create-set-dto";
import { CreateUserDto } from "src/dto/create-user-dto";
import { CreateWordDto } from "src/dto/create-word-dto";
import { UpdateSetDto } from "src/dto/update-set-dto";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { ValidatorOptions, validate } from "class-validator";
import { formatValidationErrors } from "./formatValidationErrors";
import { throwHttpException } from "./throwHttpException";
import { RESPONSE_TYPES } from "src/models/responseTypes";

type ExistingDtoTypes = CreateSetDto | CreateUserDto | CreateWordDto | UpdateSetDto;

export const parseAndValidateDto = async <T>(
	dtoJSON: string,
	dtoType: ClassConstructor<ExistingDtoTypes>
): Promise<T> => {
	try {
		// Transform stringified DTO JSON into an instance of the DTO class
		const parsedDto = plainToInstance(dtoType, JSON.parse(dtoJSON));

		// Validate the transformed DTO
		const validationOptions: ValidatorOptions = {
			whitelist: true,
			forbidNonWhitelisted: true
		};
		const errors = await validate(parsedDto, validationOptions);
		if (errors.length > 0) {
			const formattedErrors = formatValidationErrors(errors);
			throwHttpException(RESPONSE_TYPES.BAD_REQUEST, formattedErrors);
		}

		return parsedDto as T;
	} catch (error) {
		throwHttpException(RESPONSE_TYPES.BAD_REQUEST, "Invalid JSON format");
	}
};
