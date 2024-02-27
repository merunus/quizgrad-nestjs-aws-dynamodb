import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { RefreshTokenDto } from 'src/dto/refresh-token.dto';
import { RefreshTokenGuard } from 'src/guards/refresh-token.guard';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshAccessToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.tokenService.refreshToken(refreshTokenDto.refreshToken);
  }
}
