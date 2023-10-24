import { requiredEnvVar } from '@lib/utils';

type Module = {
  pubkey: string;
  url: string;
};

/**
 * Information about trusted modules.
 */
export const Modules: Record<string, Module> = {
  card: {
    pubkey: '',
    url: requiredEnvVar('CARD_URI'),
  },
  ledger: {
    pubkey: requiredEnvVar('LEDGER_PUBLIC_KEY'),
    url: '',
  },
  urlx: {
    pubkey: requiredEnvVar('URLX_PUBLIC_KEY'),
    url: requiredEnvVar('URLX_URI'),
  },
};
