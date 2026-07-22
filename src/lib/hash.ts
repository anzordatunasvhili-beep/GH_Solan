// Deterministic canonical JSON + synchronous hash for agreement/submission fingerprints.
// Not cryptographically secure — used for stable, reproducible content addressing in the demo.

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

function fnv1a(str: string, seed: number): string {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Produces a stable 64-char hex string (sha-256-like appearance). */
export function hashString(input: string): string {
  const seeds = [0x811c9dc5, 0x1000193, 0xdeadbeef, 0x9945ff, 0x14f195, 0xcafebabe, 0x0badf00d, 0xfeedface];
  return seeds.map((s) => fnv1a(input, s)).join('');
}

export function hashObject(value: unknown): string {
  return hashString(canonicalize(value));
}

export function shortHash(hash: string, len = 8): string {
  if (!hash) return '';
  return hash.slice(0, len) + '…' + hash.slice(-4);
}
