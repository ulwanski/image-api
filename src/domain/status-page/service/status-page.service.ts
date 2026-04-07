import { HttpAdapterHost } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { DatabaseHealthService } from '../../../infrastructure/database/database-health.service';

export type ServiceStatus = 'ok' | 'error';

export interface StatusReport {
  status: 'ok' | 'degraded';
  services: {
    database: {
      status: ServiceStatus;
      pool?: { total: number; idle: number; waiting: number };
      error?: string;
    };
    http: {
      status: ServiceStatus;
      listening: boolean;
    };
  };
}

@Injectable()
export class StatusPageService {
  constructor(
    private readonly dbHealth: DatabaseHealthService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async getStatus(): Promise<StatusReport> {
    const [dbHealthy, httpListening] = await Promise.all([
      this.dbHealth.isHealthy(),
      Promise.resolve(this.httpAdapterHost.listening),
    ]);

    const database: StatusReport['services']['database'] = dbHealthy
      ? { status: 'ok', pool: this.dbHealth.getPoolStats() }
      : { status: 'error', error: 'Database connection failed' };

    const http: StatusReport['services']['http'] = {
      status: httpListening ? 'ok' : 'error',
      listening: httpListening,
    };

    const serviceStatus: boolean = dbHealthy && httpListening;

    return {
      status: serviceStatus ? 'ok' : 'degraded',
      services: { database, http },
    };
  }
}