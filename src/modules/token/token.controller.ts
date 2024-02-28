import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { TokenService } from "./token.service";
import { RefreshTokenDto } from "src/dto/refresh-token.dto";
import { RefreshTokenGuard } from "src/guards/refresh-token.guard";
import { ApiTags } from "@nestjs/swagger";
import { ApiRefreshAccessToken } from "src/decorators/swagger-decorators/token/api-refresh-access-token.decorator";

@ApiTags("token")
@Controller("token")
export class TokenController {
	constructor(private readonly tokenService: TokenService) {}

	@Post("refresh")
	@UseGuards(RefreshTokenGuard)
	@ApiRefreshAccessToken()
	async refreshAccessToken(@Body() refreshTokenDto: RefreshTokenDto) {
		return this.tokenService.refreshToken(refreshTokenDto.refreshToken);
	}
}
