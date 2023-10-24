import { Response } from 'express';

import { passthroughtGet } from '@lib/http';
import { Modules } from '@lib/modules';
import type { ExtendedRequest } from '@type/request';

const handler = (req: ExtendedRequest, res: Response) => {
  passthroughtGet(Modules.urlx.url, req, res);
};

export default handler;
