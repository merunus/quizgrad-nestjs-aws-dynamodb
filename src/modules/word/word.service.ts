import { Injectable } from "@nestjs/common";
import { CreateWordDto } from "src/dto/create-word-dto";
import { DynamodbService } from "../dynamodb/dynamodb.service";
import { v4 as uuid } from "uuid";
import {
	BatchWriteCommandInput,
	DeleteCommandInput,
	PutCommandInput,
	UpdateCommandInput
} from "@aws-sdk/lib-dynamodb";
import { s3StorageFolders } from "../models/s3StorageFolders";
import { S3storageService } from "../s3storage/s3storage.service";
import { throwHttpException } from "src/utils/throwHttpException";
import { RESPONSE_TYPES } from "../models/responseTypes";
import {
	DB_BATCH_COMMAND_WRITE_MAX_ITEMS_AMOUNT,
	S3_STORAGE_BASE_URL
} from "src/constants/core.constants";
import { GSIIndexes } from "../models/GSI-indexes";
import { UpdateWordDto } from "src/dto/update-word-dto";

@Injectable()
export class WordService {
	constructor(
		private readonly dynamodbService: DynamodbService,
		private readonly s3storageService: S3storageService
	) {}

	private findWordFileByIndex(files: Express.Multer.File[], index: number) {
		// Field name example is wordImage_0
		return files.find((file) => file.fieldname.split("_")[1] === index.toString());
	}

	async handleGetWordsOfSet(set: LearningSet): Promise<(Word & TDynamoDBKeys)[]> {
		const commandInput = {
			TableName: process.env.DYNAMODB_TABLE_NAME,
			KeyConditionExpression: "PK = :pk",
			ExpressionAttributeValues: {
				":pk": `SET#${set.setId}`
			}
		};
		try {
			const words = await this.dynamodbService.sendQueryCommand<Word[]>(commandInput);
			return words as (Word & TDynamoDBKeys)[];
		} catch (error) {
			console.error(`Error querying words by setId: ${error}`);
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
			console.error(`Error querying word by ID: ${error}`);
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
			throwHttpException(
				RESPONSE_TYPES.SERVER_ERROR,
				`Failed to save word image to s3 storage: ${error}`
			);
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
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, `Failed to save word to database : ${error}`);
		}
	}

	async handleUpdateWordInDatabase({
		updateWordDto,
		passedWord,
		file,
		shouldRemoveExistingImageIfEmpty
	}: {
		updateWordDto: UpdateWordDto;
		passedWord?: Word & TDynamoDBKeys;
		file?: Express.Multer.File | undefined;
		shouldRemoveExistingImageIfEmpty?: boolean;
	}) {
		try {
			let existingWord: (Word & TDynamoDBKeys) | null = null;
			// Use either passed word or fetch it
			if (passedWord) existingWord = passedWord;
			else existingWord = await this.handleGetWordById(updateWordDto.wordId);

			// Remove the existing image if the flag is passed
			if (!file && shouldRemoveExistingImageIfEmpty && existingWord.imageUrl)
				await this.handleDeleteWordImageFromS3Storage(existingWord.imageUrl);

			// Save the new image and get the url
			const newWordImageURL = file
				? await this.handleSaveWordImageToS3Storage(file, updateWordDto.wordId)
				: "";

			// Command for word update
			const updateInput: UpdateCommandInput = {
				TableName: process.env.DYNAMODB_TABLE_NAME,
				Key: {
					PK: existingWord.PK,
					SK: existingWord.SK
				},
				UpdateExpression: "set #word = :word, #translate = :translate, #imageUrl = :imageUrl",
				ExpressionAttributeNames: {
					"#word": "word",
					"#translate": "translate",
					"#imageUrl": "imageUrl"
				},
				ExpressionAttributeValues: {
					":word": updateWordDto.word,
					":translate": updateWordDto.translate,
					":imageUrl": newWordImageURL
				},
				ReturnValues: "ALL_NEW"
			};

			return await this.dynamodbService.sendUpdateCommand(updateInput);
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, `Failed to update word : ${error}`);
		}
	}

	private async handleGetWordImageUrlFromUploadedFiles(
		files: Express.Multer.File[],
		wordIndex: number,
		wordId: string
	): Promise<string> {
		const wordFile = this.findWordFileByIndex(files, wordIndex);
		if (wordFile) return await this.handleSaveWordImageToS3Storage(wordFile, wordId); // Returns a ready word url
		return "";
	}

	async handleSaveWordsOfSet(
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

	async handleUpdateWordsOfSet({
		existingWords,
		files,
		setId,
		wordsDto
	}: {
		existingWords: (Word & TDynamoDBKeys)[];
		wordsDto: UpdateWordDto[];
		files: Array<Express.Multer.File>;
		setId: string;
	}) {
		try {
			// Delete the words that exist, but not included in dto
			const wordsForDelete = existingWords.filter(
				(existingWord) => !wordsDto.some((wordDto) => wordDto.wordId === existingWord.wordId)
			);
			await this.handleDeleteWordsInBatches(wordsForDelete, setId);

			for (let i = 0; i < wordsDto.length; i++) {
				const wordDto = wordsDto[i];
				const existingWord = existingWords.find(
					(existingWord) => existingWord.wordId === wordDto?.wordId
				);
				// Update the existing word
				if (existingWord) {
					const wordFile = this.findWordFileByIndex(files, i);
					// Update the word
					await this.handleUpdateWordInDatabase({
						updateWordDto: wordDto,
						file: wordFile,
						passedWord: existingWord,
						shouldRemoveExistingImageIfEmpty: true
					});
				}
				// Create new one
				else {
					const wordId = uuid();
					// Get the either ready url image or empty string
					const wordImageUrl = await this.handleGetWordImageUrlFromUploadedFiles(files, i, wordId);
					const newWord: Word & TDynamoDBKeys = {
						translate: wordDto.translate,
						word: wordDto.word,
						wordId,
						PK: `SET#${setId}`,
						SK: `WORD#${wordId}`,
						imageUrl: wordImageUrl
					};

					await this.handleSaveWordToDatabase(newWord);
				}
			}
		} catch (error) {
			if (error?.response) throw error;
			throwHttpException(RESPONSE_TYPES.SERVER_ERROR, `Failed to update words of set : ${error}`);
		}
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
			const batches: Word[][] = [];
			while (words.length) {
				batches.push(words.splice(0, DB_BATCH_COMMAND_WRITE_MAX_ITEMS_AMOUNT));
			}

			for (const batch of batches) {
				// Prepare delete requests for BatchWriteItem
				const deleteRequests = batch.map((word) => ({
					DeleteRequest: {
						Key: { PK: `SET#${setId}`, SK: `WORD#${word.wordId}` }
					}
				}));

				// Prepare list of images to delete if they exist
				const imagesToDelete = batch.filter((word) => word.imageUrl).map((word) => word.imageUrl);

				// Perform batch delete of words
				const batchWriteCommandInput: BatchWriteCommandInput = {
					RequestItems: {
						[process.env.DYNAMODB_TABLE_NAME]: deleteRequests
					}
				};
				await this.dynamodbService.sendBatchWriteCommand(batchWriteCommandInput);

				// Delete images from S3, if any
				for (const imageUrl of imagesToDelete) {
					await this.handleDeleteWordImageFromS3Storage(imageUrl);
				}
			}
		} catch (error) {
			if (error?.response) throw error;
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
