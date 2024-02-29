import { Module } from "@nestjs/common";
import { TokenService } from "./token.service";
import { JwtModule } from "@nestjs/jwt";
import { config } from "dotenv";
import { TokenController } from "./token.controller";
import { RefreshJWTStrategy } from "../../strategies/refresh-jwt-strategy";
import { PassportModule } from "@nestjs/passport";
config();

@Module({
	imports: [
		JwtModule.register({
			secret: `${process.env.JWT_SECRET}`,
			signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE } // Set to a suitable value for access tokens
		}),
		PassportModule
	],
	controllers: [TokenController],
	providers: [TokenService, RefreshJWTStrategy],
	exports: [TokenService, JwtModule] // Export JwtModule as well
})
export class TokenModule {}
