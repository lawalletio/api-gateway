import { Response } from 'express';
import http from 'http';

import type { ExtendedRequest } from '@type/request';
import { logger } from '@lib/utils';

const log: debug.Debugger = logger.extend('rest:nostr:publish:post');

const handler = (req: ExtendedRequest, res: Response) => {
  http.get(`http://localhost:3001${req.url}`, (response) => {
    response.on('data', (data) => res.write(data));
    response.on('end', () => res.end());
  });
};

export default handler;
