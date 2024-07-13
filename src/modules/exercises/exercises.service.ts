import { Injectable } from "@nestjs/common";
import { SetService } from "../set/set.service";
import { throwHttpException } from "src/utils/throwHttpException";
import { RESPONSE_TYPES } from "src/models/responseTypes";
import { QuizExercise } from "./QuizExercise";

@Injectable()
export class ExercisesService {
  constructor(private readonly setService: SetService) {}

  async handleGenerateQuizExercise(setId: string) {
    const set = await this.setService.handleGetSetById(setId);
    if (!set) throwHttpException(RESPONSE_TYPES.NOT_FOUND, `Set with id ${setId} not found`);

    try {
      const quiz = new QuizExercise(set);
      return quiz.generateQuizExercise();
    } catch (error) {
      if (error?.response) throw error;
      throwHttpException(
        RESPONSE_TYPES.SERVER_ERROR,
        `Failed to generate a quiz exercise, error: ${error}`
      );
    }
  }
}
