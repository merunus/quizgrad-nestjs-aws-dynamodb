type BaseUser = {
	email: string;
	username: string;
	avatarUrl?: string | null;
	createdAt: string;
	userUuid: string;
};

// Default user with password
type User = BaseUser & { passwordHash: string };
// Google user with google id
type GoogleUser = BaseUser & { googleId: number };

type GoogleUserInfo = {
	sub: number;
	name: string;
	given_name: string;
	family_name: string;
	picture: string; // URL
	email: string;
	email_verified: true;
};
