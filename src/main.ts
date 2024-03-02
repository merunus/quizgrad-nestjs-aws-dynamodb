import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { throwHttpException } from "./utils/throwHttpException";
import { RESPONSE_TYPES } from "./modules/models/responseTypes";
import { formatValidationErrors } from "./utils/formatValidationErrors";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: process.env.VERCEL_ORIGIN_URL,
		credentials: true
	});
	app.useGlobalPipes(
		new ValidationPipe({
			exceptionFactory: (errors) => {
				const formattedErrors = formatValidationErrors(errors);
				return throwHttpException(RESPONSE_TYPES.BAD_REQUEST, formattedErrors);
			},
			stopAtFirstError: true,
			whitelist: true, // remove non-defined properties from the requests body,
			forbidNonWhitelisted: true // return error when non-defined properties added to the request body,
		})
	);
	await app.listen(process.env.PORT);
}
bootstrap();
