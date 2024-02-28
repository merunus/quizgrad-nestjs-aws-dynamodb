import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenDto {
	@ApiProperty({
		description: "JWT refresh token",
		example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	})
	refreshToken: string;
}
