import { Module } from "@nestjs/common";
import { DynamodbService } from "./dynamodb.service";
import { DynamodbController } from "./dynamodb.controller";

@Module({
	providers: [DynamodbService],
	controllers: [DynamodbController],
	exports: [DynamodbService]
})
export class DynamodbModule {}
