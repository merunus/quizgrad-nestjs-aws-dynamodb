import {
	Body,
	Controller,
	Get,
	Post,
	Param,
	UseInterceptors,
	UploadedFile,
	Delete
} from "@nestjs/common";
import { CreateUserDto } from "src/dto/create-user-dto";
import { UserService } from "./user.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerUserAvatarImageUploadConfig } from "src/utils/multer/multerUserAvatarImageUploadConfig";

@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	async getAllUsers() {
		return await this.userService.handleGetAllUsers();
	}

	@Get(":userId")
	async getUserById(@Param("userId") userId: string) {
		return await this.userService.handleGetUserById(userId);
	}

	@Post("/avatar")
	@UseInterceptors(FileInterceptor("avatar", multerUserAvatarImageUploadConfig))
	async uploadUserAvatar(
		@UploadedFile() file: Express.Multer.File,
		@Body("userId") userId: string
	) {
		return await this.userService.handleUserAvatarUpload(file, userId);
	}

	@Post("create")
	async createUser(@Body() createUserDto: CreateUserDto) {
		return await this.userService.handleCreateUser(createUserDto);
	}

	@Delete(":userId")
	async deleteUser(@Param("userId") userId: string) {
		return await this.userService.handleDeleteUser(userId);
	}
}
