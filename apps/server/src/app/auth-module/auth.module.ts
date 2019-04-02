import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { environment } from '../../environments/environment';
import { JwtStrategy } from './jwt-strategy';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secretOrPrivateKey: environment.authCertificate,
      signOptions: {
        expiresIn: 3600
      }
    })
  ],
  providers: [JwtStrategy, AuthService],
  exports: [PassportModule]
})
export class AuthModule { }
