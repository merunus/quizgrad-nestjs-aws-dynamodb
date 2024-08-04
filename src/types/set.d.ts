type LearningSet = {
  title: string;
  language: string;
  createdAt: string;
  setId: string;
  words?: (Word & TDynamoDBKeys)[];
};
