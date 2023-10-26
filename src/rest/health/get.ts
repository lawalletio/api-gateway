import type { Response } from 'express';
import type { ExtendedRequest } from '@type/request';

const handler = async (req: ExtendedRequest, res: Response) => {
  res.status(200).json({ status: 'OK' }).send();
};

export default handler;
