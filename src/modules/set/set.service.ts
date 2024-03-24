import { Injectable } from "@nestjs/common";
import {
	BatchWriteCommandInput,
	DeleteCommandInput,
	PutCommandInput,
	QueryCommandInput,
	ScanCommand,
	ScanCommandInput
} from "@aws-sdk/lib-dynamodb";
import { DynamodbService } from "../dynamodb/dynamodb.service";
import { throwHttpException } from "../../utils/throwHttpException";
import { RESPONSE_TYPES } from "../models/responseTypes";
import { plainToInstance } from "class-transformer";
import { CreateSetDto } from "../../dto/create-set-dto";
import { validate } from "class-validator";
import { formatValidationErrors } from "../../utils/formatValidationErrors";
import { UserService } from "../user/user.service";
import { WordService } from "../word/word.service";
import { v4 as uuid } from "uuid";
import { TDynamoDBKeys } from "../../types/dynamodb";
import { GSIIndexes } from "../models/GSI-indexes";

@Injectable()
export class SetService {
	constructor(
		private readonly dynamodbService: DynamodbService,
		private userService: UserService,
		private wordService: WordService
	) {}

	async handleCheckSetExistence(setId: string) {
		const set = await this.handleGetSetById(setId);
		if (!set) throwHttpException(RESPONSE_TYPES.NOT_FOUND, `Set with id ${setId} doesn't exist`);
		return set;
	}

	async handleGetAllSets() {
		try {
			const commandInput: ScanCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				FilterExpression: "begins_with(SK, :pkval)",
				ExpressionAttributeValues: {
					":pkval": "SET#"
				}
			};
			const sets = await this.dynamodbService.sendScanCommand<LearningSet[]>(commandInput);

			const setsWithWords = await Promise.all(
				sets.map(async (set) => {
					const words = await this.wordService.handleGetWordsOfSet(set);
					return words && words.length ? ({ ...set, words } as LearningSet) : set;
				})
			);

			return setsWithWords;
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to get all sets");
		}
	}

	async handleCreateUserSet(
		userId: string,
		createSetDtoString: string,
		files: Array<Express.Multer.File>
	) {
		// Transform stringified set dto
		const createSetDto = plainToInstance(CreateSetDto, JSON.parse(createSetDtoString));

		// Check for errors parsed gto
		const createSetDtoErrors = await validate(createSetDto);
		if (createSetDtoErrors.length) {
			const formattedErrors = formatValidationErrors(createSetDtoErrors);
			throwHttpException(RESPONSE_TYPES.BAD_REQUEST, formattedErrors);
		}

		// Get the user id from the JWT guard by token
		const setCreator = await this.userService.handleGetUserById(userId);
		if (!setCreator) {
			throwHttpException(RESPONSE_TYPES.NOT_FOUND, `User with id ${userId} not found`);
		}
		try {
			const setId = uuid();
			// Save words to the database
			await this.wordService.handleSaveWordsToDatabase(createSetDto.words, files, setId);

			const newSet: LearningSet & TDynamoDBKeys = {
				PK: `USER#${userId}`,
				SK: `SET#${setId}`,
				createdAt: new Date().toISOString(),
				language: createSetDto.language,
				setId,
				title: createSetDto.title
			};

			const command: PutCommandInput = {
				Item: newSet,
				TableName: process.env.DYNAMODB_TABLE_NAME
			};
			// Save set to database
			await this.dynamodbService.sendPutCommand(command);

			return newSet;
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to create set");
		}
	}

	async handleDeleteSet(userId: string, setId: string) {
		const set = await this.handleCheckSetExistence(setId);
		try {
			console.log(userId, setId);
			const deleteSetCommandInput: DeleteCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Key: { PK: `USER#${userId}`, SK: `SET#${setId}` }
			};
			// Delete the set itself
			await this.dynamodbService.sendDeleteCommand(deleteSetCommandInput);

			// Get the words that belongs to the set
			const wordsOfTheDeletedSet: Word[] = await this.wordService.handleGetWordsOfSet(set);
			// Delete words that belongs to the set
			await this.wordService.handleDeleteWordsInBatches(wordsOfTheDeletedSet, setId);

			return "Set and its words were successfully deleted";
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to delete set and its words");
		}
	}

	async handleGetSetById(setId: string) {
		const commandInput: QueryCommandInput = {
			TableName: process.env.DYNAMODB_TABLE_NAME,
			IndexName: GSIIndexes.SetById,
			KeyConditionExpression: "setId = :setId",
			ExpressionAttributeValues: {
				":setId": setId
			}
		};

		try {
			const results = await this.dynamodbService.sendQueryCommand<LearningSet[]>(commandInput);
			if (!results.length)
				throwHttpException(RESPONSE_TYPES.NOT_FOUND, `Set with id ${setId} doesn't exist`);
			const set = results[0];

			const setWords = await this.wordService.handleGetWordsOfSet(set);
			return { ...set, words: setWords } as LearningSet;
		} catch (error) {
			console.error("Error querying set by ID:", error);
			throw error;
		}
	}
}
