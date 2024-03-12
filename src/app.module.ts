import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { S3storageModule } from "./modules/s3storage/s3storage.module";
import { DynamodbModule } from "./modules/dynamodb/dynamodb.module";
import { UserModule } from "./modules/user/user.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TokenModule } from "./modules/token/token.module";
import { SetModule } from './modules/set/set.module';
import { WordController } from './modules/word/word.controller';
import { WordService } from './modules/word/word.service';
import { WordModule } from './modules/word/word.module';

@Module({
	imports: [
		UserModule,
		DynamodbModule,
		S3storageModule,
		AuthModule,
		TokenModule,
		SetModule,
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ".env"
		}),
		SetModule,
		WordModule
	],
	controllers: [WordController],
	providers: [WordService]
})
export class AppModule {}
