import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import * as config from 'config';
import { IServerConfig } from '../server-config';

const serverConfig = <IServerConfig> config.server;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: serverConfig.authCertificate
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
