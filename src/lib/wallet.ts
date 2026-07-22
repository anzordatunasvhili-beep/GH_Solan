// Lightweight wallet layer. Connects to injected Phantom / Solflare providers when available,
// and falls back to a deterministic simulated wallet so the demo always runs.
import { fakeBase58 } from './id';
import { hashString } from './hash';

export type WalletKind = 'phantom' | 'solflare' | 'simulated';

export interface ConnectedWallet {
  kind: WalletKind;
  publicKey: string;
  label: string;
}

interface InjectedProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: { toString(): string };
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => Promise<void>;
  signMessage?: (msg: Uint8Array, enc?: string) => Promise<{ signature: Uint8Array }>;
}

declare global {
  interface Window {
    solana?: InjectedProvider;
    solflare?: InjectedProvider;
    phantom?: { solana?: InjectedProvider };
  }
}

function getProvider(kind: WalletKind): InjectedProvider | undefined {
  if (typeof window === 'undefined') return undefined;
  if (kind === 'phantom') return window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : undefined);
  if (kind === 'solflare') return window.solflare?.isSolflare ? window.solflare : undefined;
  return undefined;
}

export function detectWallets(): WalletKind[] {
  const out: WalletKind[] = [];
  if (getProvider('phantom')) out.push('phantom');
  if (getProvider('solflare')) out.push('solflare');
  return out;
}

const SIM_KEY = 'driu.simwallet';

function simulatedKeyFor(seed: string): string {
  // stable pseudo-key so a given demo identity always maps to the same address
  const h = hashString(seed);
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let out = '';
  for (let i = 0; i < 44; i++) out += alphabet[parseInt(h[i % h.length], 16) % alphabet.length];
  return out;
}

export async function connectWallet(kind: WalletKind, simSeed = 'demo'): Promise<ConnectedWallet> {
  if (kind === 'simulated') {
    let key = localStorage.getItem(SIM_KEY);
    if (!key) {
      key = simulatedKeyFor(simSeed + fakeBase58(6));
      localStorage.setItem(SIM_KEY, key);
    }
    return { kind: 'simulated', publicKey: key, label: 'Demo Wallet' };
  }
  const provider = getProvider(kind);
  if (!provider) throw new Error(`${kind} wallet not found`);
  const res = await provider.connect();
  return {
    kind,
    publicKey: res.publicKey.toString(),
    label: kind === 'phantom' ? 'Phantom' : 'Solflare',
  };
}

export async function signMessage(wallet: ConnectedWallet, message: string): Promise<string> {
  if (wallet.kind === 'simulated') {
    // deterministic simulated signature bound to key + message
    return 'sim_' + hashString(wallet.publicKey + '::' + message);
  }
  const provider = getProvider(wallet.kind);
  if (!provider?.signMessage) {
    return 'sig_' + hashString(wallet.publicKey + '::' + message);
  }
  const encoded = new TextEncoder().encode(message);
  const { signature } = await provider.signMessage(encoded, 'utf8');
  return Array.from(signature).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}
export function explorerAddr(addr: string): string {
  return `https://explorer.solana.com/address/${addr}?cluster=devnet`;
}
