import { ExtendedRequest } from '@type/request';
import type { Response } from 'express';

export type RestHandler = {
  (req: ExtendedRequest, res: Response): Promise<void>;
};
