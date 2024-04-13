import { Module } from "@nestjs/common";
import { SetService } from "./set.service";
import { SetController } from "./set.controller";
import { DynamodbModule } from "../dynamodb/dynamodb.module";
import { UserModule } from "../user/user.module";
import { WordModule } from "../word/word.module";

@Module({
	imports: [DynamodbModule, UserModule, WordModule],
	providers: [SetService],
	controllers: [SetController]
})
export class SetModule {}
