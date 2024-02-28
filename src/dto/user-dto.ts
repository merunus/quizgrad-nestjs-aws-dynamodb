import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	email: string;

	@ApiProperty()
	username: string;

	@ApiProperty()
	userId: string;
}
