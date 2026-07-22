import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useProfile, computeAura, completedContractsFor } from '../store/useProfile';
import { DEMO_PARTIES } from '../lib/seed';
import { Card, Avatar, Pill, InfoBanner } from '../components/ui';
import { titleCase, relativeTime } from '../lib/format';
import { explorerAddr } from '../lib/wallet';
import type { Role } from '../types';
import { RotateCcw, ExternalLink, Wallet, Sparkles, ShieldCheck, IdCard, Star, CheckCircle2 } from 'lucide-react';

export function Profile() {
  const navigate = useNavigate();
  const { currentRole, connected, setRole, resetDemo, projects } = useStore();
  const { kyc, reviews } = useProfile();
  const me = DEMO_PARTIES[currentRole];

  const kycRec = kyc[currentRole];
  const kycVerified = !!kycRec?.verified;
  const completed = completedContractsFor(currentRole, projects);
  const aura = computeAura(currentRole, projects, kycVerified);
  const myReviews = reviews.filter((r) => r.toRole === currentRole);
  const avgRating = myReviews.length ? myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="eyebrow text-sol-green">Account</p>
        <h1 className="page-title mt-1">Profile & settings</h1>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={me.name} color={me.avatarColor} size={56} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold text-white">{me.name}</div>
              {kycVerified && <ShieldCheck size={17} className="text-sol-green" />}
            </div>
            <div className="text-sm text-white/50">{me.org} · {me.email}</div>
            <div className="mt-1 flex items-center gap-2">
              <Pill>{titleCase(currentRole)}</Pill>
              {kycVerified && <span className="chip bg-sol-green/10 text-sol-green">KYC verified</span>}
            </div>
          </div>
          <div className="rounded-2xl border border-sol-purple/30 bg-sol-purple/10 px-5 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-2xl font-extrabold text-white">
              <Sparkles size={18} className="text-sol-purple" /> {aura}
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-sol-purple">aura</div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-white/5 p-4">
          <div className="label">Signing wallet</div>
          {connected ? (
            <a href={explorerAddr(connected.publicKey)} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-mono text-sm text-sol-blue hover:underline">
              <span className="h-2 w-2 rounded-full bg-sol-green" />{connected.publicKey} <ExternalLink size={12} />
            </a>
          ) : (
            <div className="flex items-center gap-2 text-sm text-white/50"><Wallet size={15} /> Not connected - using seeded demo address {me.wallet?.slice(0, 10)}.</div>
          )}
        </div>
      </Card>

      {/* aura breakdown */}
      <Card className="p-6">
        <h2 className="mb-1 font-semibold text-white">Reputation — aura</h2>
        <p className="mb-4 text-sm text-white/50">Aura is earned, never bought: +1 for verifying your identity, and +1 for every contract completed successfully — awarded to both sides.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className={`flex items-center gap-3 rounded-xl border p-4 ${kycVerified ? 'border-sol-green/25 bg-sol-green/5' : 'border-line bg-white/5'}`}>
            <span className={`grid h-10 w-10 place-items-center rounded-lg ${kycVerified ? 'bg-sol-green/15 text-sol-green' : 'bg-white/5 text-white/40'}`}><IdCard size={18} /></span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">Identity verified</div>
              <div className="text-xs text-white/45">{kycVerified ? `Verified ${relativeTime(kycRec!.verifiedAt)}` : 'Complete KYC to earn +1 aura'}</div>
            </div>
            {kycVerified ? (
              <span className="text-sm font-bold text-sol-green">+1</span>
            ) : (
              <button onClick={() => navigate('/kyc')} className="btn-primary !px-3 !py-1.5 !text-xs">Verify</button>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-white/5 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-sol-purple/15 text-sol-purple"><CheckCircle2 size={18} /></span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">Completed contracts</div>
              <div className="text-xs text-white/45">{completed} successful {completed === 1 ? 'agreement' : 'agreements'}</div>
            </div>
            <span className="text-sm font-bold text-sol-purple">+{completed}</span>
          </div>
        </div>
      </Card>

      {/* reviews */}
      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Reviews received</h2>
          {myReviews.length > 0 && (
            <span className="flex items-center gap-1 text-sm text-amber-300">
              <Star size={14} className="fill-amber-300" /> {avgRating.toFixed(1)} · {myReviews.length} {myReviews.length === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>
        {myReviews.length === 0 ? (
          <p className="text-sm text-white/45">No reviews yet. Complete a contract and your counterparty can leave one.</p>
        ) : (
          <div className="space-y-3">
            {myReviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">{r.fromName} <span className="font-normal text-white/40">· {titleCase(r.fromRole)}</span></div>
                  <Stars n={r.rating} />
                </div>
                <p className="mt-1.5 text-sm text-white/65">{r.comment}</p>
                <div className="mt-2 text-xs text-white/35">{r.projectTitle} · {relativeTime(r.at)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 font-semibold text-white">Demo identity</h2>
        <p className="mb-3 text-sm text-white/50">Switch roles to experience both sides of an agreement. All three identities share this browser's data.</p>
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

export function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= n ? 'fill-amber-300 text-amber-300' : 'text-white/20'} />
      ))}
    </span>
  );
}
