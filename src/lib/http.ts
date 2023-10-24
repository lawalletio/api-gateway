import { Response } from 'express';
import http, { ClientRequest } from 'http';

import type { ExtendedRequest } from '@type/request';
import { logger } from './utils';

const log: debug.Debugger = logger.extend('lib:http');
const error: debug.Debugger = log.extend('error');

export function passthroughtGet(
  host: string,
  req: ExtendedRequest,
  res: Response,
): ClientRequest {
  return http
    .get(`${host}${req.url}`, (response) => {
      response.on('data', (data) => res.write(data));
      response.on('end', () => res.status(response.statusCode || 503).end());
    })
    .on('error', (e) => {
      error('Unexpected error: %O', e);
      res.status(500).send();
    });
}
