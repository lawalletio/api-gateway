import { Request } from 'express';
import { Outbox } from '@services/outbox';
import NDK from '@nostr-dev-kit/ndk';

export interface Context {
  outbox: Outbox;
  readNDK: NDK;
}

export interface ExtendedRequest extends Request {
  context: Context;
}
