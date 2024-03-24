import {
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors
} from "@nestjs/common";
import { WordService } from "./word.service";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerImageUploadConfig } from "../../utils/multer/multerImageUploadConfig";

@Controller("word")
export class WordController {
	constructor(private readonly wordService: WordService) {}

	@Get(":wordId")
	@UseGuards(JwtAuthGuard)
	async getWordById(@Param("wordId") wordId: string) {
		return await this.wordService.handleGetWordById(wordId);
	}

	@Delete(":wordId")
	@UseGuards(JwtAuthGuard)
	async deleteWordById(@Param("wordId") wordId: string) {
		return await this.wordService.handleDeleteWordFromDatabase(wordId);
	}

	@Post("image/:wordId")
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor("wordImage", multerImageUploadConfig))
	async uploadWordImage(
		@UploadedFile() file: Express.Multer.File,
		@Param("wordId") wordId: string
	) {
		return await this.wordService.handleUploadWordImage(file, wordId);
	}
}
