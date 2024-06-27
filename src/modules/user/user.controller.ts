import {
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

	@Post("avatar")
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor("avatar", multerImageUploadConfig))
	async uploadUserAvatar(@UploadedFile() file: Express.Multer.File, @Req() req) {
		const userUuid = req.user.userUuid;
		return await this.userService.handleUserAvatarUpload(file, userUuid);
	}

	@Delete("avatar")
	@UseGuards(JwtAuthGuard)
	async deleteUserAvatar(@Req() req) {
		const userUuid = req.user.userUuid;
		return await this.userService.handleDeleteUserAvatar(userUuid);
	}

	@Get("me")
	@UseGuards(JwtAuthGuard)
	async getMyUser(@Req() req) {
		console.log(req.user);
		const userUuid = req.user.userUuid;
		return await this.userService.handleGetUserById(userUuid);
	}

	@Get(":userUuid")
	@UseGuards(JwtAuthGuard)
	async getUserById(@Param("userUuid") userUuid: string) {
		return await this.userService.handleGetUserById(userUuid);
	}

	@Delete(":userUuid")
	@UseGuards(JwtAuthGuard)
	async deleteUser(@Param("userUuid") userUuid: string) {
		return await this.userService.handleDeleteUser(userUuid);
	}
}
