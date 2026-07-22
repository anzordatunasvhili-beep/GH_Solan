export function uid(prefix = ''): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36).slice(-4);
  return `${prefix}${prefix ? '-' : ''}${t}${rnd}`;
}

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function fakeBase58(len = 44): string {
  let s = '';
  for (let i = 0; i < len; i++) s += BASE58[Math.floor(Math.random() * BASE58.length)];
  return s;
}

/** A plausible-looking devnet transaction signature. */
export function fakeTxSignature(): string {
  return fakeBase58(88);
}
