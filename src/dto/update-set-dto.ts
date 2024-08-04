import { IsString, IsArray, ArrayMinSize, ValidateNested, IsNotEmpty } from "class-validator";
import { CreateWordDto } from "./create-word-dto";
import { Type } from "class-transformer";
import { UpdateWordDto } from "./update-word-dto";

export class UpdateSetDto {
  @IsString()
  @IsNotEmpty()
  setId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsArray()
  @ArrayMinSize(2, { message: "There must be at least 2 words in the set" })
  // Each element in an array or each property of an object should be validated.
  @ValidateNested({ each: true })
  // Each element of the words array should be treated as an instance of Word
  @Type(() => UpdateWordDto)
  words: UpdateWordDto[];
}
