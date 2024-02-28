import { DocumentBuilder } from "@nestjs/swagger";

export const swaggerConfig = new DocumentBuilder()
	.setTitle("Quizgrad API")
	.setDescription("Quizgrad API description")
	.setVersion("1.0")
	.build();
