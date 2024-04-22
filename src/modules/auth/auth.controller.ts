"use client";
import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "../../dto/login.dto";
import { CustomLogger, createLogger } from "src/utils/logger";
import { GoogleLoginDto } from "src/dto/google-login.dto";
import { throwHttpException } from "src/utils/throwHttpException";
import { RESPONSE_TYPES } from "src/models/responseTypes";

@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {
		this.logger = createLogger("Auth");
	}
	private logger: CustomLogger;

	@Post("google")
	async googleAuth(@Body() googleLoginDto: GoogleLoginDto) {
		return this.authService.handleGoogleAuth(googleLoginDto);
	}

	@Post("login")
	async login(@Body() loginDto: LoginDto) {
		const user = await this.authService.validateUser(loginDto.email, loginDto.password);
		if (!user) throwHttpException(RESPONSE_TYPES.UNAUTHORIZED, "Invalid credentials");
		return this.authService.login(user);
	}
}
