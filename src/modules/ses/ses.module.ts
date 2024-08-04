import { Module } from "@nestjs/common";
import { SimpleEmailService } from "src/modules/ses/ses.service";

@Module({
  providers: [SimpleEmailService],
  exports: [SimpleEmailService]
})
export class SimpleEmailModule {}
