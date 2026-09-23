import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  siteId: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @MaxLength(3000)
  message: string;
}
