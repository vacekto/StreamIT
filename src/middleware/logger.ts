import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;

    // Wrap res.send to capture the response body
    const oldSend = res.send;
    let responseBody: any;

    res.send = function (body?: any) {
      responseBody = body; // capture
      return oldSend.call(this, body);
    };

    res.on('finish', () => {
      const { statusCode } = res;
      if (statusCode >= 400) {
        // Log response body only for server errors
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
