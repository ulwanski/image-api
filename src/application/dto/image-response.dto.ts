import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'My photo' })
  title: string | null;

  @ApiProperty({ example: 'http://localhost:8080/images/1/raw' })
  url: string;

  @ApiPropertyOptional({ example: 800 })
  width: number | undefined;

  @ApiPropertyOptional({ example: 600 })
  height: number | undefined;

  @ApiProperty({ example: '2024-04-06T12:00:00.000Z' })
  createdAt: Date;
}