import type { Response } from 'express';
import type { ExtendedRequest } from '@type/request';
import {
  nip19,
  nip26,
  validateEvent,
  verifySignature,
  Event,
} from 'nostr-tools';

import { NostrEvent } from '@nostr-dev-kit/ndk';
import { isEmpty, logger } from '@lib/utils';
import { Modules } from '@lib/modules';

const log: debug.Debugger = logger.extend('rest:nostr:publish:post');
const debug: debug.Debugger = log.extend('debug');
const lowHex32BRegex: RegExp = /^[0-9a-f]{64}$/;
const acceptRegex: RegExp = /application\/(nostr\+)?json|\*\/\*/;

/**
 * Check NIP-26 compliance
 *
 * If the event contains a delegation tag, check that the delegatee is
 * the one that created the event, that we are inside the time limit
 * and that the signature is valid.
 */
function validateNip26(event: NostrEvent) {
  if (event.tags.some((t) => 'delegation' === t[0])) {
    return nip26.getDelegator(event as Event<number>) !== null;
  }
  return true;
}

/**
 * Publish a valid event in NOSTR
 *
 * Perform sanity checks, validate if a signed nostr event was received
 * and publish it if it's a valid lawallet communication.
 */
const handler = (req: ExtendedRequest, res: Response) => {
  const event: NostrEvent = req.body;
  if (isEmpty(event)) {
    log('Received unparsable body %O', req.body);
    res.status(415).send();
    return;
  }
  const acceptHeader = req.header('Accept') || '*/*';
  if (!acceptRegex.test(acceptHeader)) {
    res.status(406).send('application/json\napplication/nostr+json');
  }
  if (
    !validateEvent(event) ||
    !verifySignature(event as Event<number>) ||
    !validateNip26(event)
  ) {
    log('Received invalid nostr event %O', event);
    res.status(422).send();
    return;
  }
  req.context.outbox
    .publish(event)
    .then(() => {
      res
        .status(202)
        .header(
          'Location',
          `nostr:${nip19.neventEncode(event as Event<number>)}`,
        )
        .send();
    })
    .catch((cause) => {
      switch (cause) {
        case 'Did not publish to any relay':
          res.status(400).send();
          break;
        default:
          res.status(500).send();
      }
    });
};

export default handler;
