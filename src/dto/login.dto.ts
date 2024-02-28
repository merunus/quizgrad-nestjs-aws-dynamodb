import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
	@ApiProperty({
		description: "User email, must be at at least 4 characters",
		example: "test@gmail.com"
	})
	@IsEmail()
	@MinLength(4)
	email: string;

	@ApiProperty({
		description: "User password, must be at least 6 characters",
		example: "secret"
	})
	@MinLength(6)
	@IsString()
	password: string;
}
