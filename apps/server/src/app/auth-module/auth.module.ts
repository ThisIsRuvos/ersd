import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt-strategy';
import { AuthService } from './auth.service';
import * as config from 'config';
import { IServerConfig } from '../server-config';

const serverConfig = <IServerConfig> config.get('server');

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secretOrPrivateKey: serverConfig.authCertificate,
      signOptions: {
        expiresIn: 3600
      }
    })
  ],
  providers: [JwtStrategy, AuthService],
  exports: [PassportModule]
})
export class AuthModule { }
