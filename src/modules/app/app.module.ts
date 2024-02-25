import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DynamodbModule } from "../dynamodb/dynamodb.module";
import { UserModule } from "../user/user.module";
import { S3storageModule } from "src/modules/s3storage/s3storage.module";

@Module({
	imports: [
		UserModule,
		DynamodbModule,
		S3storageModule,
		ConfigModule.forRoot({
			isGlobal: true
		})
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
