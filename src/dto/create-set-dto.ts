import { IsString, IsArray, ArrayMinSize, ValidateNested, IsNotEmpty } from "class-validator";
import { CreateWordDto } from "./create-word-dto";
import { Type } from "class-transformer";

export class CreateSetDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsNotEmpty()
	language: string;

	@IsArray()
	@ArrayMinSize(2, { message: "There must be at least 2 words in a set" })
	// Each element in an array or each property of an object should be validated.
	@ValidateNested({ each: true })
	// Each element of the words array should be treated as an instance of Word
	@Type(() => CreateWordDto)
	words: CreateWordDto[];
}
