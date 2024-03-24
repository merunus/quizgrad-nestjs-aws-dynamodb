import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { TokenModule } from "../token/token.module";
import { S3storageModule } from "../s3storage/s3storage.module";
import { DynamodbModule } from "../dynamodb/dynamodb.module";
import { UserFactory } from "../../factories/userFactory";

describe("UserController", () => {
	let userController: UserController;
	let userService: UserService;

	const mockUserService = {
		handleCreateUser: jest.fn().mockImplementation((dto) =>
			Promise.resolve({
				user: { ...dto, userId: crypto.randomUUID() },
				accessToken: "access-token",
				refreshToken: "refresh-token"
			})
		)
	};

	beforeEach(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			imports: [DynamodbModule, S3storageModule, TokenModule],
			providers: [
				{
					provide: UserService,
					useValue: mockUserService
				}
			]
		}).compile();

		userController = moduleRef.get<UserController>(UserController);
		userService = moduleRef.get<UserService>(UserService);
	});

	describe("createUser", () => {
		it("should successfully create a user and return tokens", async () => {
			const createUserDto = UserFactory.createRandomizedUserDto();
			// Mocking a successful user creation response
			mockUserService.handleCreateUser.mockResolvedValue({
				user: { ...createUserDto, userId: crypto.randomUUID() },
				accessToken: "access-token",
				refreshToken: "refresh-token"
			});

			const result = await userController.createUser(createUserDto);

			// Asserting on the mock call
			expect(mockUserService.handleCreateUser).toHaveBeenCalledWith(createUserDto);

			// Assertions about the result
			expect(result).toHaveProperty("user");
			expect(result.user).toEqual(
				expect.objectContaining({
					email: createUserDto.email,
					username: createUserDto.username
				})
			);
			expect(result).toHaveProperty("accessToken");
			expect(result).toHaveProperty("refreshToken");
		});
	});
});
