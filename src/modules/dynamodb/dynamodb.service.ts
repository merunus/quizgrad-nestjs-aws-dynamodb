import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DynamodbService {
	// DynamoDBDocumentClient is a higher-level client that simplifies working with DynamoDB items by abstracting away the complexity of the underlying DynamoDB data types.
	private dynamoDbClient: DynamoDBDocumentClient;

	constructor() {
		const client = new DynamoDBClient({
			region: process.env.AWS_REGION,
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
			}
		});
		// This client simplifies working with DynamoDB by allowing work directly with js objects.
		this.dynamoDbClient = DynamoDBDocumentClient.from(client);
	}

	async listTables(): Promise<string[]> {
		// Command to list all the tables
		const command = new ListTablesCommand({}); // Listing tables doesn't require any params
		try {
			// Send command to db
			const results = await this.dynamoDbClient.send(command);
			// TableNames, an array of table names, from the result.
			return results.TableNames;
		} catch (error) {
			throw error;
		}
	}

	getDynamoDbClient(): DynamoDBDocumentClient {
		return this.dynamoDbClient;
	}
}
