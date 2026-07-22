import { useStore } from '../store/useStore';
import { Card, EmptyState, Stat, Pill } from '../components/ui';
import { money, formatDateTime, titleCase } from '../lib/format';
import { explorerTx } from '../lib/wallet';
import { Wallet, Coins, ExternalLink } from 'lucide-react';

export function Payments() {
  const { transactions, projects } = useStore();
  const projName = (id: string) => projects.find((p) => p.id === id)?.title ?? '—';

  const released = transactions.filter((t) => t.kind === 'milestone-release' || t.kind === 'split-settlement').reduce((a, t) => a + t.amount, 0);
  const funded = transactions.filter((t) => t.kind === 'funding' || t.kind === 'amendment-deposit').reduce((a, t) => a + t.amount, 0);
  const refunded = transactions.filter((t) => t.kind === 'refund').reduce((a, t) => a + t.amount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-sm text-white/45">Every financial action across your projects</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total funded" value={money(funded)} accent="text-sol-blue" />
        <Stat label="Total released" value={money(released)} accent="text-sol-green" />
        <Stat label="Total refunded" value={money(refunded)} />
      </div>
      {transactions.length === 0 ? (
        <EmptyState icon={<Wallet size={36} />} title="No transactions yet" />
      ) : (
        <Card className="divide-y divide-line">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-4">
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${t.kind === 'funding' ? 'bg-sol-blue/15 text-sol-blue' : t.kind === 'refund' ? 'bg-white/10 text-white/60' : 'bg-sol-green/15 text-sol-green'}`}><Coins size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{titleCase(t.kind)}</span>
                  <Pill>{projName(t.projectId)}</Pill>
                </div>
                <div className="truncate font-mono text-xs text-white/40">{t.from.slice(0, 10)}… → {t.to.slice(0, 10)}… · {formatDateTime(t.createdAt)}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-white">{money(t.amount, t.currency)}</div>
                <a href={explorerTx(t.id)} target="_blank" rel="noreferrer" className="flex items-center justify-end gap-1 text-xs text-sol-blue hover:underline">explorer <ExternalLink size={11} /></a>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
