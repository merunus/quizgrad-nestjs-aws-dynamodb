import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateWordDto {
	@IsString()
	@IsNotEmpty()
	word: string;

	@IsString()
	@IsNotEmpty()
	translate: string;

	@IsOptional()
	imageUrl?: string;
}
