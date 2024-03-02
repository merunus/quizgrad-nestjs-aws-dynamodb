import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
	@IsEmail()
	@MinLength(4)
	email: string;
	@MinLength(6)
	@IsString()
	password: string;
}
