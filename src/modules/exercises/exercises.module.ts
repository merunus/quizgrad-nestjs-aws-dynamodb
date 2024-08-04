import { Module } from "@nestjs/common";
import { ExercisesController } from "./exercises.controller";
import { ExercisesService } from "./exercises.service";
import { SetModule } from "../set/set.module";

@Module({
  imports: [SetModule],
  controllers: [ExercisesController],
  providers: [ExercisesService]
})
export class ExercisesModule {}
