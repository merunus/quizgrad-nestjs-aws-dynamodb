import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { UserDto } from 'src/dto/user-dto';

export function ApiGetAllUsers() {
  return applyDecorators(
    ApiOkResponse({ description: 'Retrieve all users', type: [UserDto] })
  );
}
