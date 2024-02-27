import { Controller, Post, Body, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "src/dto/login.dto";

@Controller("auth")
export class AuthController {
	constructor(
		private authService: AuthService,
	) {}

	@Post("login")
	async login(@Body() loginDto: LoginDto) {
		const user = await this.authService.validateUser(loginDto.email, loginDto.password);
		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}
		return this.authService.login(user);
	}
}
