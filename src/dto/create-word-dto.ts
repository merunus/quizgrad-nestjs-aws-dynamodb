import { IsNotEmpty, IsString } from "class-validator";

export class CreateWordDto {
	@IsString()
	@IsNotEmpty()
	word: string;

	@IsString()
	@IsNotEmpty()
	translate: string;
}
