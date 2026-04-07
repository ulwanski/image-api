import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({ description: 'Image title', example: 'My photo' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Target width in pixels', example: 800 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  width?: number;

  @ApiPropertyOptional({ description: 'Target height in pixels', example: 600 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  height?: number;
}