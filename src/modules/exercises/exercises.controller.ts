import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ExercisesService } from "./exercises.service";
import { JwtAuthGuard } from "src/guards/jwt-auth.guard";

@Controller("exercises")
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get("/quiz")
  @UseGuards(JwtAuthGuard)
  async generateQuizExercise(@Query("setId") setId: string) {
    return await this.exercisesService.handleGenerateQuizExercise(setId);
  }
}
