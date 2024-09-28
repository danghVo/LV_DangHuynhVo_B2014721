import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class SignInDto {
  @IsString()
  @IsEmail(
    {},
    {
      message: 'Sai định dạng email',
    },
  )
  email: string;

  @IsString()
  password: string;
}
