import { Response } from 'express';
import http, { ClientRequest } from 'http';

import type { ExtendedRequest } from '@type/request';
import debug from 'debug';

const log: debug.Debugger = debug('card:lib:http');
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
        protocol: `${req.protocol}:`,
      },
      (response) => {
        res.status(response.statusCode || 503);
        response.on('data', (data) => res.write(data));
        response.on('end', () => res.end());
      },
    )
    .on('error', (e) => {
      error('Unexpected error: %O', e);
      res.status(500).send();
    });
  req.on('data', (data) => clientRequest.write(data));
  req.on('end', () => clientRequest.end());
  return clientRequest;
}
