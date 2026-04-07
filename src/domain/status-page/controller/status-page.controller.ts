import { Controller, Get, Res } from '@nestjs/common';
import { StatusPageService, StatusReport } from '../service/status-page.service';
import type { Response } from 'express';

@Controller('status')
export class StatusPageController {
  constructor(private readonly statusPageService: StatusPageService) {}

  @Get()
  async getStatus(@Res() res: Response): Promise<void> {
    const report: StatusReport = await this.statusPageService.getStatus();
    const httpStatus = report.status === 'ok' ? 200 : 503;
    res.status(httpStatus).json(report);
  }
}