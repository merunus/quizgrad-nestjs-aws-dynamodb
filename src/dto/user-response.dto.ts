import { ApiProperty } from "@nestjs/swagger";
import { UserDto } from "./user-dto";

export class UserResponseDto {
	@ApiProperty({ type: UserDto })
	user: UserDto;

	@ApiProperty()
	accessToken: string;

	@ApiProperty()
	refreshToken: string;
}
