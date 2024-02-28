import { Body, Controller, Get, Post, Param, Delete, UseGuards } from "@nestjs/common";
import { CreateUserDto } from "src/dto/create-user-dto";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { ApiTags } from "@nestjs/swagger";
import { ApiGetUserById } from "src/decorators/swagger-decorators/user/get-user-by-id-api.decorator";
import { ApiGetAllUsers } from "src/decorators/swagger-decorators/user/get-all-users-api.decorator";
import { ApiCreateUser } from "src/decorators/swagger-decorators/user/create-user-api.decorator";
import { ApiDeleteUser } from "src/decorators/swagger-decorators/user/delete-user-api.decorator";

@ApiTags("user")
@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiGetAllUsers()
	async getAllUsers() {
		return await this.userService.handleGetAllUsers();
	}

	@Get(":userId")
	@UseGuards(JwtAuthGuard)
	@ApiGetUserById()
	async getUserById(@Param("userId") userId: string) {
		return await this.userService.handleGetUserById(userId);
	}

	@Post("create")
	@UseGuards(JwtAuthGuard)
	@ApiCreateUser()
	async createUser(@Body() createUserDto: CreateUserDto) {
		return await this.userService.handleCreateUser(createUserDto);
	}

	@Delete(":userId")
	@UseGuards(JwtAuthGuard)
	@ApiDeleteUser()
	async deleteUser(@Param("userId") userId: string) {
		return await this.userService.handleDeleteUser(userId);
	}
}
