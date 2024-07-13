import { Injectable } from "@nestjs/common";
import {
  DeleteCommandInput,
  PutCommandInput,
  QueryCommandInput,
  ScanCommandInput,
  UpdateCommandInput
} from "@aws-sdk/lib-dynamodb";
import { DynamodbService } from "../dynamodb/dynamodb.service";
import { throwHttpException } from "src/utils/throwHttpException";
import { RESPONSE_TYPES } from "../../models/responseTypes";
import { CreateSetDto } from "src/dto/create-set-dto";
import { UserService } from "../user/user.service";
import { WordService } from "../word/word.service";
import { v4 as uuid } from "uuid";
import { GSIIndexes } from "../../models/GSI-indexes";
import { parseAndValidateDto } from "src/utils/parseAndValidateDto";
import { UpdateSetDto } from "src/dto/update-set-dto";

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
      if (error?.response) throw error;
      throwHttpException(
        error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
        "Failed to get all sets"
      );
    }
  }

  async handleCreateUserSet(
    userUuid: string,
    createSetDtoString: string,
    files: Array<Express.Multer.File>
  ) {
    // Validate dto json
    const createSetDto = await parseAndValidateDto<CreateSetDto>(createSetDtoString, CreateSetDto);
    // Get the user id from the JWT guard by token
    const setCreator = await this.userService.handleGetUserById(userUuid);
    if (!setCreator) {
      throwHttpException(RESPONSE_TYPES.NOT_FOUND, `User with id ${userUuid} not found`);
    }
    try {
      const setId = uuid();
      // Save words to the database
      await this.wordService.handleSaveWordsOfSet(createSetDto.words, files, setId);

      const newSet: LearningSet & TDynamoDBKeys = {
        PK: `USER#${userUuid}`,
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

      const wordsOfTheSet = await this.wordService.handleGetWordsOfSet(newSet);

      return { newSet, words: wordsOfTheSet };
    } catch (error) {
      if (error?.response) throw error;
      throwHttpException(
        error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
        "Failed to create set"
      );
    }
  }

  async handleUpdateUserSet(
    userUuid: string,
    updateSetDtoString: string,
    files: Array<Express.Multer.File>
  ) {
    try {
      // Validate dto json
      const updateSetDto = await parseAndValidateDto<UpdateSetDto>(
        updateSetDtoString,
        UpdateSetDto
      );

      // Check if the set exists and belongs to the user
      const existingSet = await this.handleGetSetById(updateSetDto.setId);
      if (!existingSet)
        throwHttpException(
          RESPONSE_TYPES.NOT_FOUND,
          `Set with id ${updateSetDto.setId} doesn't exist`
        );
      if (existingSet.PK !== `USER#${userUuid}`)
        throwHttpException(
          RESPONSE_TYPES.CONFLICT,
          `You don't have permissions to update this set`
        );

      // Command for set update
      const updateInput: UpdateCommandInput = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
          PK: `USER#${userUuid}`,
          SK: `SET#${updateSetDto.setId}`
        },
        UpdateExpression: "set #title = :title, #language = :language",
        ExpressionAttributeNames: {
          "#title": "title",
          "#language": "language"
        },
        ExpressionAttributeValues: {
          ":title": updateSetDto.title,
          ":language": updateSetDto.language
        },
        ReturnValues: "ALL_NEW"
      };

      // Fetch existing words of the set
      const existingWords = await this.wordService.handleGetWordsOfSet(existingSet);

      // Update the words, save new ones, remove the non-included ones
      await this.wordService.handleUpdateWordsOfSet({
        existingWords,
        files,
        setId: existingSet.setId,
        wordsDto: updateSetDto.words
      });

      // Update the set
      return await this.dynamodbService.sendUpdateCommand(updateInput);
    } catch (error) {
      if (error?.response) throw error;
      throwHttpException(
        error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
        `Failed to update user set and its words: ${error}`
      );
    }
  }

  async handleDeleteSet(userUuid: string, setId: string) {
    const set = await this.handleCheckSetExistence(setId);
    if (set.PK !== `USER#${userUuid}`)
      throwHttpException(RESPONSE_TYPES.CONFLICT, "You don't have permissions to delete this set");
    try {
      const deleteSetCommandInput: DeleteCommandInput = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: { PK: `USER#${userUuid}`, SK: `SET#${setId}` }
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
      throwHttpException(
        error?.response?.status || RESPONSE_TYPES.SERVER_ERROR,
        "Failed to delete set and its words"
      );
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
      return { ...set, words: setWords } as LearningSet & TDynamoDBKeys;
    } catch (error) {
      if (error?.response) throw error;
      throwHttpException(
        RESPONSE_TYPES.SERVER_ERROR,
        `Failed to find set by id ${setId} : ${error}`
      );
    }
  }
}
