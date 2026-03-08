export interface ChainConfig {
  id: number;
  name: string;
  rpc: string;
  explorer: string;
  nativeSymbol: string;
  decimals: number;
  confirmations: number;
}

/**
 * List of EVM chains supported for wallet-based auth and on-chain credit purchases.
 *
 * NOTE: Additional networks (Polygon, Base, custom L1, etc.) can be added later by
 * simply appending a new object to this array—no further code changes required.
 */
export const CHAINS: ChainConfig[] = [
  {
    id: 101888,
    name: 'Starsky Mainnet',
    rpc: 'https://rpc.mainnet.sharelock.cc',
    explorer: 'https://explorer.sharelock.cc',
    nativeSymbol: 'Coin AI',
    decimals: 18,
    confirmations: 1,
  },
  {
    id: 1018888,
    name: 'Starsky Testnet',
    rpc: 'https://rpc.testnet.sharelock.cc',
    explorer: 'https://testnet.sharelock.cc',
    nativeSymbol: 'Coin AI',
    decimals: 18,
    confirmations: 1,
  },
];

/** Convenience helper to fetch a chain by id */
export const getChain = (id: number): ChainConfig | undefined =>
  CHAINS.find((c) => c.id === id);
