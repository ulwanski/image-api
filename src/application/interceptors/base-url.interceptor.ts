import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { ImageResponseDto } from '../dto/image-response.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

@Injectable()
export class BaseUrlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest<Request>();
    const baseUrl: string = `${req.protocol}://${req.get('host')}`;

    return next.handle().pipe(
      map(data => {
        if (data instanceof ImageResponseDto) {
          data.url = `${baseUrl}${data.url}`;
        } else if (data instanceof PaginatedResponseDto) {
          for (const item of data.data) {
            if (item instanceof ImageResponseDto) {
              item.url = `${baseUrl}${item.url}`;
            }
          }
        }
        return data;
      }),
    );
  }
}