import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { throwHttpException } from "./utils/throwHttpException";
import { RESPONSE_TYPES } from "./models/responseTypes";
import { formatValidationErrors } from "./utils/formatValidationErrors";

export const allowedCorsOrigins = [
	process.env.VERCEL_ORIGIN_URL, // Deployed URL,
	"https://quizgrad-nextjs.vercel.app/" // Nikita's deployed website
];

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: (origin, callback) => {
			const isLocalHost = /^http:\/\/localhost:\d+$/.test(origin);
			if (!origin || allowedCorsOrigins.includes(origin) || isLocalHost) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
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
