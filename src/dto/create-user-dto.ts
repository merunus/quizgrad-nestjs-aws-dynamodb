import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateUserDto {
	@ApiProperty({
		description: "There should be a valid email",
		example: "test@gmail.com"
	})
	@IsEmail()
	email: string;

	@ApiProperty({
		description: "Min length of the user is 4 characters",
		example: "username"
	})
	@IsString()
	@MinLength(4)
	username: string;

	@ApiProperty({
		description: "Min length of the password is 6 characters",
		example: "secret"
	})
	@IsString()
	@MinLength(6)
	password: string;
}
