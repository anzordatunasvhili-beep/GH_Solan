import { useStore } from '../store/useStore';
import { DEMO_PARTIES } from '../lib/seed';
import { Card, Avatar, Pill, InfoBanner } from '../components/ui';
import { titleCase } from '../lib/format';
import { explorerAddr } from '../lib/wallet';
import type { Role } from '../types';
import { RotateCcw, ExternalLink, Wallet } from 'lucide-react';

export function Profile() {
  const { currentRole, connected, setRole, resetDemo } = useStore();
  const me = DEMO_PARTIES[currentRole];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-white">Profile & settings</h1>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={me.name} color={me.avatarColor} size={56} />
          <div>
            <div className="text-xl font-bold text-white">{me.name}</div>
            <div className="text-sm text-white/50">{me.org} · {me.email}</div>
            <div className="mt-1"><Pill>{titleCase(currentRole)}</Pill></div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-white/5 p-4">
          <div className="label">Signing wallet</div>
          {connected ? (
            <a href={explorerAddr(connected.publicKey)} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-mono text-sm text-sol-blue hover:underline">
              <span className="h-2 w-2 rounded-full bg-sol-green" />{connected.publicKey} <ExternalLink size={12} />
            </a>
          ) : (
            <div className="flex items-center gap-2 text-sm text-white/50"><Wallet size={15} /> Not connected — using seeded demo address {me.wallet?.slice(0, 10)}…</div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 font-semibold text-white">Demo identity</h2>
        <p className="mb-3 text-sm text-white/50">Switch roles to experience both sides of an agreement. All three identities share this browser’s data.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(['stakeholder', 'implementer', 'arbiter'] as Role[]).map((r) => (
            <button key={r} onClick={() => setRole(r)} className={`rounded-xl border p-4 text-left ${r === currentRole ? 'border-sol-purple bg-sol-purple/10' : 'border-line bg-white/5 hover:bg-white/10'}`}>
              <Avatar name={DEMO_PARTIES[r].name} color={DEMO_PARTIES[r].avatarColor} size={30} />
              <div className="mt-2 font-medium text-white">{DEMO_PARTIES[r].name}</div>
              <div className="text-xs text-white/45">{titleCase(r)}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 font-semibold text-white">Danger zone</h2>
        <InfoBanner tone="warn">Resetting restores the original demo data and clears every project, payment, and dispute in this browser.</InfoBanner>
        <button onClick={() => { if (confirm('Reset all demo data?')) resetDemo(); }} className="btn-danger mt-3"><RotateCcw size={16} /> Reset demo data</button>
      </Card>
    </div>
  );
}
