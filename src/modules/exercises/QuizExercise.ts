import { RESPONSE_TYPES } from "src/models/responseTypes";
import { TCorrectQuizAnswer, TQuizExercise, TQuizQuestion } from "src/types/quiz";
import { shuffleArray } from "src/utils/shaffleArray";
import { throwHttpException } from "src/utils/throwHttpException";

export class QuizExercise {
  private set: LearningSet;

  constructor(set: LearningSet) {
    this.isSetHasEnoughWords(set);

    this.set = set;
  }

  private isSetHasEnoughWords(set: LearningSet) {
    if (!set?.words?.length || set?.words?.length < 4) {
      throwHttpException(
        RESPONSE_TYPES.BAD_REQUEST,
        "Set must have at least 4 words for a quiz exercise"
      );
    }
  }

  generateQuizExercise = (): TQuizExercise => {
    // Generate questions for the quiz
    const questions: TQuizQuestion[] = this.set.words.map((word) => {
      const isTranslation = Math.random() < 0.5; // Randomly decide question type (Either correct answer will be shown as a translation or a word)

      const correctAnswer: TCorrectQuizAnswer = {
        answer: isTranslation ? word.translate : word.word,
        imageUrl: word?.imageUrl || null
      };

      const correctOption = isTranslation ? word.word : word.translate;
      const options = this.generateOptions(correctOption, isTranslation);

      return {
        correctAnswer,
        options
      };
    });

    return {
      questions: shuffleArray(questions) // Shuffle in a random order
    };
  };

  // Helper function to generate 4 options for a question
  generateOptions = (correctOption: string, isTranslation: boolean): string[] => {
    const options = new Set<string>();
    options.add(correctOption);

    while (options.size < 4) {
      const randomWord = this.set.words[Math.floor(Math.random() * this.set.words.length)];
      const option = isTranslation ? randomWord.word : randomWord.translate;
      options.add(option);
    }

    return Array.from(options);
  };
}
