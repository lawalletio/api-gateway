import { requiredEnvVar } from '@lib/utils';

type Module = {
  pubkey: string;
};

/**
 * Information about trusted modules.
 */
export const Modules: Record<string, Module> = {
  ledger: { pubkey: requiredEnvVar('LEDGER_PUBLIC_KEY') },
  urlx: { pubkey: requiredEnvVar('URLX_PUBLIC_KEY') },
};
