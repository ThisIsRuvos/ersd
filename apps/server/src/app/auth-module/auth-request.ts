import {Request} from 'express';

export interface AuthRequest extends Request {
  user: {
    sub: string;
    email: string;
    email_verified: boolean;
    realm_access: {
      roles: string[];
    };
    preferred_username: string;
    name: string;
    given_name: string;
    family_name: string;
  }
}
