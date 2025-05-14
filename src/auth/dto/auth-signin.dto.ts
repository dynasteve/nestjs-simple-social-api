import { IsNotEmpty, IsString } from 'class-validator';

export class AuthSigninDto {
  @IsNotEmpty()
  @IsString()
  identifier: string; // Email/Username object

  @IsNotEmpty()
  @IsString()
  password: string;
}
