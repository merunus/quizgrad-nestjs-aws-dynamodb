import {
	Body,
	Controller,
	Delete,
	Get,
	Post,
	Query,
	Req,
	UploadedFiles,
	UseGuards,
	UseInterceptors
} from "@nestjs/common";
import { SetService } from "./set.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { multerImageUploadConfig } from "src/utils/multer/multerImageUploadConfig";
import { WordService } from "../word/word.service";

@Controller("set")
export class SetController {
	constructor(
		private setService: SetService,
		private wordService: WordService
	) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getAllSets() {
		return await this.setService.handleGetAllSets();
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getSetById(@Query("setId") setId: string) {
		return await this.setService.handleGetSetById(setId);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	// Use AnyFilesInterceptor to get all the uploaded files from the body
	@UseInterceptors(AnyFilesInterceptor(multerImageUploadConfig))
	async createUserSet(
		@UploadedFiles() files: Array<Express.Multer.File>,
		@Body("setBody") createSetDtoString: string,
		@Req() req
	) {
		const userId = req.user.userId;
		return this.setService.handleCreateUserSet(userId, createSetDtoString, files);
	}

	@Get("words")
	@UseGuards(JwtAuthGuard)
	async getSetWords(@Query("setId") setId: string): Promise<any> {
		const set = await this.setService.handleCheckSetExistence(setId);
		return await this.wordService.getWordsOfSet(set);
	}

	@Delete()
	@UseGuards(JwtAuthGuard)
	async deleteSet(@Query("setId") setId: string, @Req() req) {
		return await this.setService.handleDeleteSet(req.user.userId, setId);
	}
}
