import { Module } from "@nestjs/common";
import { SetService } from "./set.service";
import { SetController } from "./set.controller";
import { DynamodbModule } from "../dynamodb/dynamodb.module";

@Module({
	imports: [DynamodbModule],
	providers: [SetService],
	controllers: [SetController]
})
export class SetModule {}
