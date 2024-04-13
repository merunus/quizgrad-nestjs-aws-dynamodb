import { Module } from "@nestjs/common";
import { DynamodbModule } from "../dynamodb/dynamodb.module";
import { S3storageModule } from "../s3storage/s3storage.module";
import { WordService } from "./word.service";
import { WordController } from "./word.controller";

@Module({
	imports: [DynamodbModule, S3storageModule],
	controllers: [WordController],
	providers: [WordService],
	exports: [WordService]
})
export class WordModule {}
