type JwtPayload = {
	username: string;
	sub: string; // sub is used for the user's ID
};

type TokenUserPayload = {
	sub: string;
	iat: number;
	exp: number;
	tokenType: "access" | "refresh";
};
