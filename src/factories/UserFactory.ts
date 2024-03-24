import * as crypto from "crypto";
import { CreateUserDto } from "../dto/create-user-dto";

export class UserFactory {
	public static createRandomizedUser(): User {
		return {
			email: `test-${crypto.randomBytes(3).toString("base64")}@test.com`,
			passwordHash: crypto.randomBytes(10).toString("base64"),
			createdAt: new Date().toLocaleDateString(),
			userId: crypto.randomUUID(),
			username: "test-user"
		};
	}

	public static createRandomizedUserDto(): CreateUserDto {
		return {
			email: `test-${crypto.randomBytes(3).toString("base64")}@test.com`,
			password: crypto.randomBytes(10).toString("base64"),
			username: "test-user"
		};
	}
}
