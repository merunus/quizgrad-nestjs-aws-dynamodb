import { Controller, Post, Body, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "../../dto/login.dto";
import { ApiTags } from "@nestjs/swagger";
import { ApiLogin } from "../../decorators/swagger-decorators/auth/api-login.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
	constructor(
		private authService: AuthService,
	) {}

	
	@Post("login")
	@ApiLogin()
	async login(@Body() loginDto: LoginDto) {
		const user = await this.authService.validateUser(loginDto.email, loginDto.password);
		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}
		return this.authService.login(user);
	}
}
