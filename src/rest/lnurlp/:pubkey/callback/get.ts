import { Response } from 'express';
import http from 'http';

import type { ExtendedRequest } from '@type/request';
import { logger, requiredEnvVar } from '@lib/utils';

const log: debug.Debugger = logger.extend('rest:lnurlp:pubkey:callback:get');
const error: debug.Debugger = log.extend('error');

const handler = (req: ExtendedRequest, res: Response) => {
  http.get(`${requiredEnvVar('URLX_URI')}${req.url}`, (response) => {
    response.on('data', (data) => res.write(data));
    response.on('end', () => res.status(response.statusCode || 503).end());
  }).on('error', (e) => {
    error('Unexpected error: %O', e);
    res.status(500).send()
  });
};

export default handler;
