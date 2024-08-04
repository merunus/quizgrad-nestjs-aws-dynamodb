export const isGoogleUser = (user: User | GoogleUser | null): user is GoogleUser =>
  (user as GoogleUser)?.googleId !== undefined;
