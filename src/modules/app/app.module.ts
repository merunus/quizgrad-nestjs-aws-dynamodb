import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DynamodbModule } from "../db/dynamodb.module";

@Module({
	imports: [
		DynamodbModule,
		ConfigModule.forRoot({
			isGlobal: true
		})
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
