import {
	Body,
	Controller,
	Get,
	Post,
	Param,
	Delete,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	Req
} from "@nestjs/common";
import { CreateUserDto } from "../../dto/create-user-dto";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerUserAvatarImageUploadConfig } from "src/utils/multer/multerUserAvatarImageUploadConfig";

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

	@Post("create")
	async createUser(@Body() createUserDto: CreateUserDto) {
		return await this.userService.handleCreateUser(createUserDto);
	}

	@Delete(":userId")
	@UseGuards(JwtAuthGuard)
	async deleteUser(@Param("userId") userId: string) {
		return await this.userService.handleDeleteUser(userId);
	}

	@Post("avatar")
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor("avatar", multerUserAvatarImageUploadConfig))
	async uploadUserAvatar(@UploadedFile() file: Express.Multer.File, @Req() req) {
		const userId = req.user.userId;
		return await this.userService.handleUserAvatarUpload(file, userId);
	}
}
