type User = {
	email: string;
	username: string;
	passwordHash: string;
	avatarUrl?: string | null;
	createdAt: string;
	userId: string;
};

type GoogleUser = Omit<User, "passwordHash"> & { googleId: number };

type GoogleUserInfo = {
	sub: number;
	name: string;
	given_name: string;
	family_name: string;
	picture: string; // URL
	email: string;
	email_verified: true;
};
