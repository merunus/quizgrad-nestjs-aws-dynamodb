import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DynamodbModule } from "./modules/db/dynamodb.module";

@Module({
	imports: [
		DynamodbModule,
		ConfigModule.forRoot({
			isGlobal: true
		})
	],
	controllers: [],
	providers: []
})
export class AppModule {}
