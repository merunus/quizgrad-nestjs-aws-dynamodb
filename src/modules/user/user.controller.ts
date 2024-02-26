import {
	Body,
	Controller,
	Get,
	Post,
	Param,
	UseInterceptors,
	UploadedFile,
	Delete,
	UseGuards
} from "@nestjs/common";
import { CreateUserDto } from "src/dto/create-user-dto";
import { UserService } from "./user.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerUserAvatarImageUploadConfig } from "src/utils/multer/multerUserAvatarImageUploadConfig";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";

@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getAllUsers() {
		return await this.userService.handleGetAllUsers();
	}

	@Get(":userId")
	@UseGuards(JwtAuthGuard)
	async getUserById(@Param("userId") userId: string) {
		return await this.userService.handleGetUserById(userId);
	}

	@Post("/avatar")
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor("avatar", multerUserAvatarImageUploadConfig))
	async uploadUserAvatar(
		@UploadedFile() file: Express.Multer.File,
		@Body("userId") userId: string
	) {
		return await this.userService.handleUserAvatarUpload(file, userId);
	}

	@Post("create")
	@UseGuards(JwtAuthGuard)
	async createUser(@Body() createUserDto: CreateUserDto) {
		return await this.userService.handleCreateUser(createUserDto);
	}

	@Delete(":userId")
	@UseGuards(JwtAuthGuard)
	async deleteUser(@Param("userId") userId: string) {
		return await this.userService.handleDeleteUser(userId);
	}
}
