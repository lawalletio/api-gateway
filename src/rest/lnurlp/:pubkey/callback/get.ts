import { Response } from 'express';

import { passthrough } from '@lib/http';
import { Modules } from '@lib/modules';
import type { ExtendedRequest } from '@type/request';

const handler = (req: ExtendedRequest, res: Response) => {
  passthrough(Modules.urlx.url, req, res);
};

export default handler;
