type TDynamoDBKeys = {
  PK: string;
  SK?: string;
  ttl?: number; // time to live
};

type TResetTokenTableElement = TDynamoDBKeys & {
  email: string;
};
