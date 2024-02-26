import { Module } from "@nestjs/common";
import { TokenService } from "./token.service";
import { JwtModule } from "@nestjs/jwt";
import { config } from "dotenv";
config();

@Module({
	imports: [
		JwtModule.register({
			secret: `${process.env.JWT_SECRET}`,
			signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE } // Set to a suitable value for access tokens
		})
	],
	providers: [TokenService],
	exports: [TokenService, JwtModule] // Export JwtModule as well
})
export class TokenModule {}
