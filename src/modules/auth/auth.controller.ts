import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "../../dto/login.dto";
import { CustomLogger, createLogger } from "src/utils/logger";
import { GoogleLoginDto } from "src/dto/google-login.dto";
import { RegisterDto } from "src/dto/register.dto";

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
    return await this.authService.handleLogin(loginDto);
  }

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.handleRegister(registerDto);
  }
}
