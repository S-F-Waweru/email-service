import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    example: 'deliva',
    description: 'Configured website identifier',
  })
  @IsString()
  @MaxLength(50)
  siteId: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: '+254 700 000 000' })
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'Acme Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  company?: string;

  @ApiPropertyOptional({ example: 'Partnership enquiry' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ example: 'I would like to learn more about your services.' })
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  message: string;
}
