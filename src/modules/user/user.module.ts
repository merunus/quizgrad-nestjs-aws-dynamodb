import { Module } from "@nestjs/common";
import { DynamodbModule } from "../dynamodb/dynamodb.module";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { S3storageModule } from "src/s3storage/s3storage.module";

@Module({
	imports: [DynamodbModule, S3storageModule],
	providers: [UserService],
	controllers: [UserController],
	exports: []
})
export class UserModule {}
