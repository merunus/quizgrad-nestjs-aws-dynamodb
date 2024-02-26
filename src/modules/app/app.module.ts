import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DynamodbModule } from "../dynamodb/dynamodb.module";
import { UserModule } from "../user/user.module";
import { S3storageModule } from "src/modules/s3storage/s3storage.module";
import { AuthModule } from "../auth/auth.module";
import { TokenModule } from "../token/token.module";

@Module({
	imports: [
		UserModule,
		DynamodbModule,
		S3storageModule,
		AuthModule,
		TokenModule,
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ".env"
		})
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
