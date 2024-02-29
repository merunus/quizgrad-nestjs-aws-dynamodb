import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ExtractJwt, Strategy } from "passport-jwt"; // This is important, in this strategy we are not using the Strategy class from the passport-local package
import { EStrategies } from "../modules/models/strategies";

@Injectable()
export class RefreshJWTStrategy extends PassportStrategy(Strategy, EStrategies.REFRESH_JWT) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"),
			ignoreExpiration: false,
			secretOrKey: `${process.env.REFRESH_JWT_SECRET}`
		});
	}

	async validate(payload: JwtPayload) {
		return { userId: payload.sub };
	}
}
