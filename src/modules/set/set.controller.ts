import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { SetService } from "./set.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";

@Controller("set")
export class SetController {
	constructor(private setService: SetService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getAllSets() {
		return await this.setService.handleGetAllSets();
	}

	// @Post()
	// @UseGuards(JwtAuthGuard)
	// // @UseInterceptors(FileFieldsInterceptor([{ name: "wordsImages" }], multerWordsImagesUploadConfig))
	// async createUserSet(
	// 	// @UploadedFiles() files: { wordsImages?: Express.Multer.File[] },
	// 	@Body("createSetDto") createSetDtoString: string,
	// 	@Req() req
	// ) {
	// 	console.log(req.user.dick);
	// 	const userId = req.user.userId;
	// 	console.log(userId);
	// 	// return this.setService.handleCreateUserSet(userId, createSetDtoString, files);
	// }
}
