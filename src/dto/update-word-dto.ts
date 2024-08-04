import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateWordDto {
  @IsString()
  @IsNotEmpty()
  word: string;

  @IsString()
  @IsNotEmpty()
  translate: string;

  @IsOptional()
  wordId?: string | undefined;
}
