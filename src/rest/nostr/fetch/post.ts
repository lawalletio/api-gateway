import type { Response } from 'express';
import { logger } from '@lib/utils';
import { NDKFilter, NDKRelay } from '@nostr-dev-kit/ndk';
import { ExtendedRequest } from '@type/request';
import { RestHandler } from '@rest/index';

const log: debug.Debugger = logger.extend('rest:nostr:fetch:post');
const debug: debug.Debugger = log.extend('debug');

export const MAX_LIMIT = 10;
const filterKeysRegExp: RegExp =
  /ids|kinds|authors|since|until|limit|search|#[a-z]/;

/**
 * Validates that the received object is a valid nostr filter
 * @param filter to be validated
 * @returns true if the filter is a valid nostr filter
 */
function isValidFilter(filter: NDKFilter): boolean {
  return Object.keys(filter).every((key) => filterKeysRegExp.test(key));
}

/**
 * POST /nostr/fetch
 *
 * Receives a nostr filter in the body and returns the events that
 * match that filter. If the filter does not have a limit or if it is
 * greater than our MAX_LIMIT we will ignore it and use the MAX_LIMIT
 */
const handler: RestHandler = async (req: ExtendedRequest, res: Response) => {
  const filter: NDKFilter = req.body;
  if (typeof filter !== 'object' || null === filter) {
    log('Received unparsable body %O', req.body);
    res.status(415).send();
    return;
  }
  if (!isValidFilter(filter)) {
    log('Received invalid filter %O', filter);
    res.status(422).send();
    return;
  }

  if (MAX_LIMIT < (filter.limit ?? Infinity)) {
    filter.limit = MAX_LIMIT;
  }

  await new Promise<void>(async (resolve) => {
    const handleNotice = (_relay: NDKRelay, notice: string) => {
      debug('Received notice from relay %O', notice);
      res.status(400).json({ status: 'ERROR', reason: notice });
      resolve();
    };
    req.context.readNDK.pool.once('notice', handleNotice);
    await req.context.readNDK
      .fetchEvents(filter)
      .then((events) => {
        debug('Received events %O', events);
        res.status(200).json(Array.from(events).map((e) => e.rawEvent()));
      })
      .catch((e) => {
        debug('Unexpected error %O', e);
        res.status(500).send();
      });
    req.context.readNDK.pool.off('notice', handleNotice);
    resolve();
  });
};

export default handler;
