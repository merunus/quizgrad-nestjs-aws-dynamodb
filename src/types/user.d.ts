export interface User {
	email: string;
	username: string;
	passwordHash: string;
	avatarUrl?: string | null;
	createdAt: string;
}
