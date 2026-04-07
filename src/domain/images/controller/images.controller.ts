import 'multer';
import {
  Controller, Get, Post, Param, Query, UploadedFile, UseInterceptors, ParseIntPipe, DefaultValuePipe, HttpCode,
  HttpStatus, Body, Res, BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { BaseUrlInterceptor } from '../../../application/interceptors/base-url.interceptor';
import { ImageService } from '../services/image.service';
import { UploadImageInput } from '../../../application/dto/upload-image.input';
import { UploadImageDto } from '../../../application/dto/upload-image.dto';
import { ImageResponseDto } from '../../../application/dto/image-response.dto';
import { PaginatedResponseDto } from '../../../application/dto/paginated-response.dto';
import { ImageUploadInterceptor } from '../../../application/interceptors/image-upload.interceptor';

@ApiTags('images')
@Controller('images')
@UseInterceptors(BaseUrlInterceptor)
export class ImagesController {
  constructor(private readonly imageService: ImageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ImageUploadInterceptor)
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiResponse({ status: 201, type: ImageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file or parameters' })
  public async upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadImageDto): Promise<ImageResponseDto> {

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const uploadImageInput: UploadImageInput = UploadImageInput.fromRequest(file, dto);
    return this.imageService.store(uploadImageInput);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single image metadata by ID' })
  @ApiResponse({ status: 200, type: ImageResponseDto })
  @ApiResponse({ status: 404, description: 'Image not found' })
  public async findOne(@Param('id', ParseIntPipe) id: number): Promise<ImageResponseDto> {
    return this.imageService.findOne(id);
  }

  @Get(':id/raw')
  @ApiOperation({ summary: 'Get single image by ID' })
  @ApiResponse({ status: 200, schema: { type: 'string', format: 'binary' } })
  @ApiResponse({ status: 404, description: 'Image not found' })
  public async getOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
    const { buffer, mimeType, filename } = await this.imageService.fetch(id);

    res.set({
      'Content-Type': mimeType,
      'Content-Length': buffer.length,
      'Content-Disposition': `inline; filename="${filename}"`,
    });

    res.send(buffer);
  }

  @Get()
  @ApiOperation({ summary: 'List images with optional filtering and pagination' })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  public async findAll(
    @Query('title') title?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ): Promise<PaginatedResponseDto<ImageResponseDto>> {
    return this.imageService.find(page, limit, title);
  }
}