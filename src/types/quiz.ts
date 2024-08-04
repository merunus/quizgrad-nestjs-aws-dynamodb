export type TQuizExercise = {
  questions: TQuizQuestion[]
};

export type TQuizQuestion = {
  correctAnswer: TCorrectQuizAnswer;
  options: string[];
};

export type TCorrectQuizAnswer = {
  answer: string;
  imageUrl: string | null;
};
