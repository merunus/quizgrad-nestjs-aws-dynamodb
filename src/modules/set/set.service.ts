import { Injectable } from "@nestjs/common";
import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { DynamodbService } from "../dynamodb/dynamodb.service";
import { throwHttpException } from "src/utils/throwHttpException";
import { RESPONSE_TYPES } from "../models/responseTypes";

@Injectable()
export class SetService {
	constructor(private readonly dynamodbService: DynamodbService) {}

	async handleGetAllSets() {
		try {
			const params: ScanCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				FilterExpression: "begins_with(SK, :pkval)",
				ExpressionAttributeValues: {
					":pkval": "SET#"
				}
			};
			const dbClient = this.dynamodbService.getDynamoDbClient();
			const command = new ScanCommand(params);
			const { Items } = await dbClient.send(command);
			return Items;
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to get all sets");
		}
	}
}
