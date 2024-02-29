import {  Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PassportModule } from "@nestjs/passport";
import { UserModule } from "../user/user.module";
import { TokenModule } from "../token/token.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../../strategies/jwt.strategy";

@Module({
	imports: [UserModule, PassportModule, TokenModule],
	providers: [AuthService, JwtStrategy, JwtModule],
	controllers: [AuthController],
	exports: [AuthService]
})
export class AuthModule {}
