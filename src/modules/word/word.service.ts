import { Injectable } from "@nestjs/common";
import { CreateWordDto } from "src/dto/create-word-dto";
import { DynamodbService } from "../dynamodb/dynamodb.service";
import { v4 as uuid } from "uuid";
import { BatchWriteCommandInput, DeleteCommandInput, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { TDynamoDBKeys } from "src/types/dynamodb";
import { s3StorageFolders } from "../models/s3StorageFolders";
import { S3storageService } from "../s3storage/s3storage.service";
import { throwHttpException } from "src/utils/throwHttpException";
import { RESPONSE_TYPES } from "../models/responseTypes";
import {
	DB_BATCH_COMMAND_WRITE_MAX_ITEMS_AMOUNT,
	S3_STORAGE_BASE_URL
} from "src/constants/core.constants";
import { GSIIndexes } from "../models/GSI-indexes";

@Injectable()
export class WordService {
	constructor(
		private readonly dynamodbService: DynamodbService,
		private readonly s3storageService: S3storageService
	) {}

	async handleGetWordsOfSet(set: LearningSet) {
		const commandInput = {
			TableName: process.env.DYNAMODB_TABLE_NAME,
			KeyConditionExpression: "PK = :pk",
			ExpressionAttributeValues: {
				":pk": `SET#${set.setId}`
			}
		};
		try {
			const words = await this.dynamodbService.sendQueryCommand<Word[]>(commandInput);
			return words;
		} catch (error) {
			console.error("Error querying words by setId:", error);
			throw error;
		}
	}

	async handleGetWordById(wordId: string) {
		const commandInput = {
			TableName: process.env.DYNAMODB_TABLE_NAME,
			IndexName: GSIIndexes.WordById,
			KeyConditionExpression: "wordId = :wordId",
			ExpressionAttributeValues: {
				":wordId": wordId
			}
		};

		try {
			const results: Word[] = await this.dynamodbService.sendQueryCommand<Word[]>(commandInput);
			if (!results.length)
				throwHttpException(RESPONSE_TYPES.NOT_FOUND, `Word with id ${wordId} doesn't exist`);
			return results[0] as Word & TDynamoDBKeys;
		} catch (error) {
			console.error("Error querying word by ID:", error);
			throw error;
		}
	}

	private async handleSaveWordImageToS3Storage(file: Express.Multer.File, wordId: string) {
		try {
			const fileKey = `${s3StorageFolders.WORDS_IMAGES}/wordImage_${wordId}`;
			const fileURL = `${S3_STORAGE_BASE_URL}/${fileKey}`;
			await this.s3storageService.saveImageToStorage(fileKey, file);
			return fileURL;
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to save word image to s3 storage");
		}
	}

	private async handleSaveWordToDatabase(newWord: Word) {
		const commandInput: PutCommandInput = {
			TableName: process.env.DYNAMODB_TABLE_NAME,
			Item: newWord
		};
		try {
			await this.dynamodbService.sendPutCommand(commandInput);
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to save word to database");
		}
	}

	private async handleGetWordImageUrlFromUploadedFiles(
		files: Express.Multer.File[],
		wordIndex: number,
		wordId: string
	): Promise<string> {
		// Field name example is wordImage_0
		const wordFile = files.find((file) => file.fieldname.split("_")[1] === wordIndex.toString());
		if (wordFile) return await this.handleSaveWordImageToS3Storage(wordFile, wordId); // Returns a ready word url
		return "";
	}

	async handleSaveWordsToDatabase(
		words: CreateWordDto[],
		files: Array<Express.Multer.File>,
		setId: string
	): Promise<Word[]> {
		if (words.length) {
			// Map each word to a promise using the async function
			const saveWordPromises = words.map(async ({ translate, word }, index) => {
				const wordId = uuid();
				// Get the either ready url image or empty string
				const wordImageUrl = await this.handleGetWordImageUrlFromUploadedFiles(
					files,
					index,
					wordId
				);
				const newWord: Word & TDynamoDBKeys = {
					translate,
					word,
					wordId,
					PK: `SET#${setId}`,
					SK: `WORD#${wordId}`,
					imageUrl: wordImageUrl
				};
				await this.handleSaveWordToDatabase(newWord);
				return newWord;
			});

			// Wait for all promises to resolve and return the results
			return Promise.all(saveWordPromises);
		}
		return [];
	}

	async handleDeleteWordFromDatabase(wordId: string) {
		const wordForDeletion = await this.handleGetWordById(wordId);
		if (!wordForDeletion)
			throwHttpException(RESPONSE_TYPES.NOT_FOUND, `Word with id ${wordId} not found`);

		const commandInput: DeleteCommandInput = {
			TableName: process.env.DYNAMODB_TABLE_NAME,
			Key: {
				PK: wordForDeletion.PK,
				SK: `WORD#${wordId}`
			}
		};
		await this.dynamodbService.sendDeleteCommand(commandInput);

		// Delete the word image if it exist
		await this.handleDeleteWordImageFromS3Storage(wordForDeletion?.imageUrl);

		return `Word with id ${wordId} was successfully deleted`;
	}

	async handleDeleteWordImageFromS3Storage(wordImageUrl: string) {
		if (!wordImageUrl) return;
		await this.s3storageService.removeFileFromStorage(wordImageUrl, s3StorageFolders.WORDS_IMAGES);
	}

	async handleDeleteWordsInBatches(words: Word[], setId: string) {
		try {
			// Divide words into batches of 25 for BatchWriteItem
			const batches: Word[][] = []; // Example [[...], [...]]
			while (words.length) {
				batches.push(words.splice(0, DB_BATCH_COMMAND_WRITE_MAX_ITEMS_AMOUNT));
			}
			// For each batch, create and send BatchWriteItem requests
			for (const batch of batches) {
				const deleteRequests = batch.map((word) => ({
					DeleteRequest: {
						Key: { PK: `SET#${setId}`, SK: `WORD#${word.wordId}` }
					}
				}));
				const batchWriteCommandInput: BatchWriteCommandInput = {
					RequestItems: {
						[process.env.DYNAMODB_TABLE_NAME]: deleteRequests
					}
				};
				await this.dynamodbService.sendBatchWriteCommand(batchWriteCommandInput);
			}
		} catch (error) {
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to delete words batch");
		}
	}

	async handleUploadWordImage(file: Express.Multer.File, wordId: string) {
		try {
			const word = await this.handleGetWordById(wordId);
			if (!word)
				throwHttpException(RESPONSE_TYPES.NOT_FOUND, `Word with id ${wordId} doesn't exist`);

			// If word has an image - delete it and replace with the new one
			if (word.imageUrl) await this.handleDeleteWordImageFromS3Storage(word?.imageUrl);

			// Save the new image and get the url
			const newWordImageURL = await this.handleSaveWordImageToS3Storage(file, wordId);

			// Construct new word
			const newWord: Word = { ...word, imageUrl: newWordImageURL };

			// Save new word to database
			await this.handleSaveWordToDatabase(newWord);

			return "Successfully uploaded an image to the word";
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, "Failed to upload word image");
		}
	}
}
