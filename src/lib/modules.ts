import { requiredEnvVar } from '@lib/utils';

export type Module = {
  pubkey: string;
  url: string;
  routeMethods: Record<string, string[]>;
};

/**
 * Information about trusted modules.
 */
export const Modules: Record<string, Module> = {
  card: {
    pubkey: '',
    url: requiredEnvVar('CARD_URI'),
    routeMethods: {
      '/card': ['post'],
      '/card/holder': ['get'],
      '/card/pay': ['get', 'post'],
      '/card/scan': ['get'],
    },
  },
  ledger: {
    pubkey: requiredEnvVar('LEDGER_PUBLIC_KEY'),
    url: '',
    routeMethods: {},
  },
  urlx: {
    pubkey: requiredEnvVar('URLX_PUBLIC_KEY'),
    url: requiredEnvVar('URLX_URI'),
    routeMethods: {
      '/lnurlp/:pubkey/callback': ['get'],
    },
  },
};
