export const isGoogleUser = (user: User | GoogleUser): user is GoogleUser =>
	(user as GoogleUser)?.googleId !== undefined;
