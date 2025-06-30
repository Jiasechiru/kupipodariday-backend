import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from 'src/users/users.service';
import { HashService } from 'src/auth-utils/hash.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
  ) {}

  auth(user: User) {
    const payload = { sub: user.id };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1d' }),
    };
  }

  async validatePassword(
    username: string,
    password: string,
  ): Promise<User | null> {
    const userWithHash = await this.usersService.getUserByUsername(
      username,
      true,
    );

    if (!userWithHash) {
      return null;
    }

    const isPasswordValid = await this.hashService.compare(
      password,
      userWithHash.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return this.usersService.getUserByUsername(username);
  }
}
