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
 * Check if an event is a valid lawallet transaction.
 *
 * Return true if the event has exactly 2 "p" tags, the first one is
 * the ledger pubkey and the second is a valid pubkey, the content is a
 * valid JSON that contains tokens and amount and optionally a memo
 * string which is required if the second "p" tag is the URLX module's
 * pubkey.
 */
function validateTransaction(event: NostrEvent): boolean {
  const ptags = event.tags.filter((t) => 'p' === t[0]);
  if (2 !== ptags.length) {
    debug('Invalid number of p-tags for event %s', event.id);
    return false;
  }
  if (Modules.ledger.pubkey !== ptags[0][1]) {
    debug('Internal transaction target MUST be the ledger. %s', event.id);
    return false;
  }
  if (!lowHex32BRegex.test(ptags[1][1])) {
    debug('Invalid p-tag %s for event %s', ptags[1][1], event.id);
    return false;
  }
  let content;
  try {
    content = JSON.parse(event.content);
  } catch {
    debug('Unparsable event content: %s for event %s', event.content, event.id);
    return false;
  }
  let tokens = content.tokens ? Object.keys(content.tokens) : [];
  if (tokens.length < 1) {
    debug('Transaction must at least have one token. %s', event.id);
    return false;
  }
  for (const token of tokens) {
    if (isNaN(content.tokens[token])) {
      debug('Token amount must be a numeric value. %s', event.id);
      return false;
    }
    if (content.tokens[token] <= 0) {
      debug('Token amount must be positive. %s', event.id);
      return false;
    }
  }
  if (
    Modules.urlx.pubkey === ptags[1][1] &&
    !event.tags.some((t) => 'bolt11' === t[0])
  ) {
    debug('Outbound transactions must contain an invoice. %s', event.id);
    return false;
  }
  return true;
}

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
 * Check if an event is a valid lawallet communication.
 *
 * Return true if the event has a valid kind and sub-kind for a
 * lawallet communication and perform validations based on sub-kind.
 * Also Check for NIP-26 compliance.
 */
function validateSchema(event: NostrEvent): boolean {
  if (1112 !== event.kind) {
    debug('Invalid kind %d for event %s', event.kind, event.id);
    return false;
  }
  const subKindTags = event.tags.filter((t) => 't' === t[0]);
  if (1 !== subKindTags.length) {
    debug('Event must have exactly one sub-kind %s', event.id);
    return false;
  }
  if (!validateNip26(event)) {
    debug('Invalid delegation', event.id);
    return false;
  }
  let valid = false;
  switch (subKindTags[0][1]) {
    case 'internal-transaction-start':
      valid = validateTransaction(event);
      break;
    default:
      debug('Invalid sub-kind for %s', event.id);
      break;
  }
  return valid;
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
    !validateSchema(event)
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
