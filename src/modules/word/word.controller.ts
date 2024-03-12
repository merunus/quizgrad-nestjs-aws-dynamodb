import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { WordService } from "./word.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";

@Controller("word")
export class WordController {
	constructor(private readonly wordService: WordService) {}

	@Get(":wordId")
	@UseGuards(JwtAuthGuard)
	async getWordById(@Param("wordId") wordId: string) {
		return await this.wordService.getWordById(wordId);
	}
}
