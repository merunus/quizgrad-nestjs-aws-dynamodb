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
// Users:
// PK: USER#<UserId>
// SK: #METADATA#<UserId>
// Sets (owned by users):
// PK: USER#<UserId> (to group sets by their owner)
// SK: SET#<SetId>
// Words (belonging to sets):
// PK: SET#<SetId> (to group words by their set)
// SK: WORD#<WordId>
