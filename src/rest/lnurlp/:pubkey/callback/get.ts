import { Response } from 'express';
import http from 'http';

import type { ExtendedRequest } from '@type/request';
import { requiredEnvVar } from '@lib/utils';

const handler = (req: ExtendedRequest, res: Response) => {
  http.get(`${requiredEnvVar('URLX_URI')}${req.url}`, (response) => {
    response.on('data', (data) => res.write(data));
    response.on('end', () => res.end());
  });
};

export default handler;
