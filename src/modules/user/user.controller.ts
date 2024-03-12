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
	Req,
	Query
} from "@nestjs/common";
import { CreateUserDto } from "../../dto/create-user-dto";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerImageUploadConfig } from "src/utils/multer/multerImageUploadConfig";

@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getAllUsers() {
		return await this.userService.handleGetAllUsers();
	}

	@Post("create")
	async createUser(@Body() createUserDto: CreateUserDto) {
		return await this.userService.handleCreateUser(createUserDto);
	}

	@Post("avatar")
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor("avatar", multerImageUploadConfig))
	async uploadUserAvatar(@UploadedFile() file: Express.Multer.File, @Req() req) {
		const userId = req.user.userId;
		return await this.userService.handleUserAvatarUpload(file, userId);
	}

	@Delete("avatar")
	@UseGuards(JwtAuthGuard)
	async deleteUserAvatar(@Req() req) {
		const userId = req.user.userId;
		console.log("Delete user avatar");
		return await this.userService.handleDeleteUserAvatar(userId);
	}

	@Get(":userId")
	@UseGuards(JwtAuthGuard)
	async getUserById(@Param("userId") userId: string) {
		return await this.userService.handleGetUserById(userId);
	}

	@Delete(":userId")
	@UseGuards(JwtAuthGuard)
	async deleteUser(@Param("userId") userId: string) {
		return await this.userService.handleDeleteUser(userId);
	}
}
