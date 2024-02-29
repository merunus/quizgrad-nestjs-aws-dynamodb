import { Controller, Get } from "@nestjs/common";
import { DynamodbService } from "./dynamodb.service";

@Controller("dynamodb")
export class DynamodbController {
	constructor(private readonly dynamodbService: DynamodbService) {}

	@Get("tables")
	async getTablesList() {
		return this.dynamodbService.listTables();
	}
}
