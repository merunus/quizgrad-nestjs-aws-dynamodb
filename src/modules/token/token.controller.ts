import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { TokenService } from "./token.service";
import { RefreshTokenGuard } from "../../guards/refresh-token.guard";
import { RefreshTokenDto } from "src/dto/refresh-token.dto";

@Controller("token")
export class TokenController {
	constructor(private readonly tokenService: TokenService) {}

	@Post("refresh")
	@UseGuards(RefreshTokenGuard)
	async refreshAccessToken(@Body() refreshTokenDto: RefreshTokenDto) {
		return this.tokenService.refreshToken(refreshTokenDto.refreshToken);
	}
}
