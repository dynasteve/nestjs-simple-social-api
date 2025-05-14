/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthRegisterDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthSigninDto } from './dto/auth-signin.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: AuthRegisterDto) {
    const { email, password, username } = dto;
    // Generate password hash
    const hash = await argon.hash(password);

    // Save the new user into DB
    try {
      const user = await this.prismaService.user.create({
        data: {
          email,
          password: hash,
          username,
        },
      });

      // Return the saved User Generated JWT
      return this.signTokenGenerate(
        user.id,
        user.email?.toString() ?? '',
        user.username?.toString() ?? '',
      );
    } catch (error) {
      // Error handling for repeat inputs
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta as any)?.target || [];

          if (Array.isArray(target)) {
            const fields = target.join(' and '); // Join if both fields exist
            throw new BadRequestException(`${fields} already exists`);
          }
        }
      }
      return error;
    }
  }

  async signin(dto: AuthSigninDto) {
    const { identifier, password } = dto;

    try {
      // Find user by username or email
      const user = await this.prismaService.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
      });

      // Throw exception if user not found
      if (!user) throw new ForbiddenException('Credentials Invalid');

      // Compare Argon2 Password
      const passwordValid = await argon.verify(user.password, password);

      // If passwordValid is False throw Execption
      if (!passwordValid) throw new ForbiddenException('Incorrect Password');

      // Return the saved User Generated JWT

      return this.signTokenGenerate(
        user.id,
        user.email?.toString() ?? '',
        user.username?.toString() ?? '',
      );
    } catch (error) {
      console.error('Signin error:', error); // Log for debugging
      throw new BadRequestException('Something went wrong');
    }
  }

  async signTokenGenerate(
    userID: string,
    username: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { sub: userID, username, email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
