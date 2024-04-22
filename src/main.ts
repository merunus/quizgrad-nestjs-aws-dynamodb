import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { throwHttpException } from "./utils/throwHttpException";
import { RESPONSE_TYPES } from "./models/responseTypes";
import { formatValidationErrors } from "./utils/formatValidationErrors";

export const allowedCorsOrigins = [
	process.env.VERCEL_ORIGIN_URL, // Deployed URL
	"http://localhost:3000", // Development
	"http://localhost:4444" // Development
];

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: allowedCorsOrigins,
		credentials: true
	});

	app.useGlobalPipes(
		new ValidationPipe({
			exceptionFactory: (errors) => {
				console.log(errors);
				const formattedErrors = formatValidationErrors(errors);
				return throwHttpException(RESPONSE_TYPES.BAD_REQUEST, formattedErrors);
			},
			stopAtFirstError: true,
			forbidNonWhitelisted: true // return error when non-defined properties added to the request body,
		})
	);
	await app.listen(process.env.PORT);
}
bootstrap();
