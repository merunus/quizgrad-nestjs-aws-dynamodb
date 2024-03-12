import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import {
	BatchWriteCommand,
	BatchWriteCommandInput,
	DeleteCommand,
	DeleteCommandInput,
	DynamoDBDocumentClient,
	PutCommand,
	PutCommandInput,
	QueryCommand,
	QueryCommandInput,
	ScanCommand,
	ScanCommandInput
} from "@aws-sdk/lib-dynamodb";
import { Injectable } from "@nestjs/common";
import { throwHttpException } from "src/utils/throwHttpException";
import { RESPONSE_TYPES } from "../models/responseTypes";

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
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, `Failed to list all the tables: ${error}`);
		}
	}

	getDynamoDbClient(): DynamoDBDocumentClient {
		return this.dynamoDbClient;
	}

	async sendPutCommand(commandInput: PutCommandInput) {
		try {
			await this.dynamoDbClient.send(new PutCommand(commandInput));
		} catch (error) {
			throwHttpException(
				RESPONSE_TYPES.SERVER_ERROR,
				`Failed to put element to the dynamodb table: ${error}`
			);
		}
	}

	async sendDeleteCommand(commandInput: DeleteCommandInput) {
		try {
			const response = await this.dynamoDbClient.send(new DeleteCommand(commandInput));
			return response
		} catch (error) {
			throwHttpException(
				RESPONSE_TYPES.SERVER_ERROR,
				`Failed to delete item from database table: ${error}`
			);
		}
	}

	async sendQueryCommand<T>(commandInput: QueryCommandInput): Promise<T> {
		try {
			const { Items } = await this.dynamoDbClient.send(new QueryCommand(commandInput));
			return Items as T;
		} catch (error) {
			throwHttpException(
				RESPONSE_TYPES.SERVER_ERROR,
				`Failed to query item from database table: ${error}`
			);
		}
	}

	async sendScanCommand<T>(commandInput: ScanCommandInput): Promise<T> {
		try {
			const { Items } = await this.dynamoDbClient.send(new ScanCommand(commandInput));
			return Items as T;
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, `Failed to scan database table: ${error}`);
		}
	}

	async sendBatchWriteCommand(commandInput: BatchWriteCommandInput) {
		try {
			const response = await this.dynamoDbClient.send(new BatchWriteCommand(commandInput));
			return response
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed during batch write operation");
		}
	}
}
