import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;

    const oldSend = res.send;
    let responseBody: any;

    res.send = function (body?: any) {
      responseBody = body;
      return oldSend.call(this, body);
    };

    res.on('finish', () => {
      const { statusCode } = res;
      if (statusCode >= 400) {
        this.logger.error(
          `${method} ${originalUrl} ${statusCode} Response: ${responseBody}`,
        );
      } else {
        this.logger.log(`${method} ${originalUrl} ${statusCode}`);
      }
    });

    next();
  }
}
