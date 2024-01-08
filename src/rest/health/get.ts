import type { Response } from 'express';
import type { ExtendedRequest } from '@type/request';
import { RestHandler } from '@rest/index';

const handler: RestHandler = async (req: ExtendedRequest, res: Response) => {
  const url: URL = new URL(req.url, `${req.protocol}://${req.headers.host}`);
  res
    .status(200)
    .json({
      status: 'OK',
      request: {
        method: req.method,
        url: {
          path: url.pathname,
          query: url.searchParams,
        },
        protocol: url.protocol,
        http: {
          major: req.httpVersionMajor,
          minor: req.httpVersionMinor,
        },
        host: {
          name: url.hostname,
          port: url.port,
        },
        headers: req.headersDistinct,
        body: req.body,
      },
    })
    .send();
};

export default handler;
