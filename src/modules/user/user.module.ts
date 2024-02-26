import { Module } from "@nestjs/common";
import { DynamodbModule } from "../dynamodb/dynamodb.module";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { S3storageModule } from "src/modules/s3storage/s3storage.module";
import { TokenModule } from "../token/token.module";

@Module({
	imports: [DynamodbModule, S3storageModule, TokenModule],
	providers: [UserService],
	controllers: [UserController],
	exports: [UserService]
})
export class UserModule {}
