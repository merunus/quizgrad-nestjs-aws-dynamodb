import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { ValidationPipe } from "@nestjs/common";
import { throwHttpException } from "./utils/throwHttpException";
import { RESPONSE_TYPES } from "./modules/models/responseTypes";
import { formatValidationErrors } from "./utils/formatValidationErrors";
import { SwaggerModule } from "@nestjs/swagger";
import { swaggerConfig } from "./swagger/swaggerConfig";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: `http://localhost:${process.env.PORT}`,
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

	// Add swagger
	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup("api", app, document);

	await app.listen(process.env.PORT);
}
bootstrap();
