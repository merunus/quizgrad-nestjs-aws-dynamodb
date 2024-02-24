import { Module } from "@nestjs/common";
import { S3storageService } from "./s3storage.service";

@Module({
	providers: [S3storageService],
	exports: [S3storageService]
})
export class S3storageModule {}
