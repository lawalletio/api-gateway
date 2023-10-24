import { Response } from 'express';
import http, { ClientRequest } from 'http';

import type { ExtendedRequest } from '@type/request';
import { logger } from './utils';

const log: debug.Debugger = logger.extend('lib:http');
const error: debug.Debugger = log.extend('error');

export function passthrough(
  host: string,
  req: ExtendedRequest,
  res: Response,
): ClientRequest {
  const clientRequest: ClientRequest = http
    .request(
      `${host}${req.url}`,
      {
        headers: req.headers,
        joinDuplicateHeaders: true,
        method: req.method,
        protocol: req.protocol,
      },
      (response) => {
        response.on('data', (data) => res.write(data));
        response.on('end', () => res.status(response.statusCode || 503).end());
      },
    )
    .on('error', (e) => {
      error('Unexpected error: %O', e);
      res.status(500).send();
    });
  if (Object.keys(req.body).length !== 0) {
    clientRequest.write(req.body);
  }
  return clientRequest;
}
