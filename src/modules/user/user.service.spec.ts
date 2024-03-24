import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { DynamodbService } from "../dynamodb/dynamodb.service";
import { TokenService } from "../token/token.service";
import { UserFactory } from "../../factories/userFactory";
import { S3storageService } from "../s3storage/s3storage.service";
import { ConflictException } from "@nestjs/common";

describe("UserService", () => {
	let userService: UserService;
	let dynamodbService: DynamodbService;
	let tokenService: TokenService;
	let s3storageService: S3storageService;

	beforeEach(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			// UserService is being tested, so it's included as a provider
			providers: [
				UserService,
				{ provide: DynamodbService, useValue: { sendPutCommand: jest.fn() } },
				{
					provide: TokenService,
					useValue: { generateAccessToken: jest.fn(), generateRefreshToken: jest.fn() }
				},
				{
					provide: S3storageService,
					useValue: {}
				}
			]
		}).compile();

		userService = moduleRef.get<UserService>(UserService);
		dynamodbService = moduleRef.get<DynamodbService>(DynamodbService);
		tokenService = moduleRef.get<TokenService>(TokenService);
		s3storageService = moduleRef.get<S3storageService>(S3storageService);
	});

	describe("handleCreateUser", () => {
		it("should throw an error if the user already exists", async () => {
			const mockUser = UserFactory.createRandomizedUser();
			const mockUserDto = UserFactory.createRandomizedUserDto();

			// Mock handleGetUserByEmail to simulate finding an existing user
			jest
				.spyOn(userService, "handleGetUserByEmail")
				.mockResolvedValueOnce(Promise.resolve(mockUser));

			await expect(
				userService.handleCreateUser({
					...mockUserDto,
					email: mockUser.email
				})
			).rejects.toThrow(new ConflictException(`User ${mockUser.email} already exist`));
		});
	});
});
