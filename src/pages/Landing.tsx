import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Lock, GitBranch, Scale, Coins,
  ArrowRight, CheckCircle2, Users, FileCheck2, Wallet, Milestone,
} from 'lucide-react';
import type { ComponentType } from 'react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sol-gradient font-black text-black shadow-glow">D</span>
          <span className="text-xl font-extrabold tracking-tight">DRIU</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Enter App <ArrowRight size={16} />
        </button>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid [background-size:26px_26px] opacity-40" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-sol-purple/25 blur-[120px]" />
        <div className="pointer-events-none absolute top-20 right-10 h-72 w-72 rounded-full bg-sol-green/20 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-1.5 text-xs text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-sol-green" /> Built on Solana · Crypto escrow for product work
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Define the work together,<br />
            <span className="gradient-text">lock the budget</span>, and release<br />
            payment as each milestone ships.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/55">
            DRIU turns a project brief into measurable milestones, secures the full budget in on-chain escrow,
            and releases funds only when both parties approve delivered work.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button onClick={() => navigate('/create')} className="btn-primary !px-6 !py-3 text-base">
              Start a project <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-ghost !px-6 !py-3 text-base">
              Explore the demo
            </button>
          </div>
          <p className="mt-4 text-sm font-medium text-white/40">Define it together. Lock it together. Pay as it is delivered.</p>
        </div>
      </section>

      {/* audience */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-4 md:grid-cols-2">
          <AudienceCard
            icon={Users} tint="purple" title="For Stakeholders"
            points={['Never pay the full budget before delivery', 'Approve the exact scope before work starts', 'Release payment milestone-by-milestone', 'Get refundable protection on unstarted work']}
          />
          <AudienceCard
            icon={Milestone} tint="green" title="For Implementers"
            points={['See the full project is funded before you start', 'Lock requirements so scope can’t shift silently', 'Get paid automatically on approval', 'Timeouts stop reviews from stalling forever']}
          />
        </div>
      </section>

      {/* how escrow works */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-center text-3xl font-bold">How the escrow works</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-white/50">Six safeguards that let two parties who don’t fully trust each other still ship a product together.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Feature icon={FileCheck2} title="Structured scope" body="An assistant converts your brief into milestones with measurable acceptance criteria and required evidence." />
          <Feature icon={ShieldCheck} title="Double approval" body="Every milestone is approved by both parties before work begins — and again after delivery." />
          <Feature icon={Wallet} title="Funded upfront" body="The Stakeholder deposits the full budget into escrow, so the Implementer knows the money is real." />
          <Feature icon={Coins} title="Staged payments" body="Approving a milestone releases only that amount. The rest stays locked in escrow." />
          <Feature icon={GitBranch} title="Versioned terms" body="Signed requirements are immutable. Any change creates a new version both parties must re-sign." />
          <Feature icon={Scale} title="Fair disputes" body="Revisions, timeouts, and an optional Arbiter prevent funds from being frozen or seized unilaterally." />
        </div>
      </section>

      {/* flow strip */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="card overflow-hidden">
          <div className="grid divide-y divide-line md:grid-cols-4 md:divide-x md:divide-y-0">
            {[
              { n: '01', t: 'Agree', d: 'Draft milestones and approve the exact scope together.' },
              { n: '02', t: 'Lock', d: 'Both parties sign; the full budget is deposited into escrow.' },
              { n: '03', t: 'Deliver', d: 'Work is submitted with evidence, milestone by milestone.' },
              { n: '04', t: 'Release', d: 'On approval, that milestone’s payment is released on-chain.' },
            ].map((s) => (
              <div key={s.n} className="p-6">
                <div className="text-3xl font-black gradient-text">{s.n}</div>
                <div className="mt-2 text-lg font-semibold">{s.t}</div>
                <div className="mt-1 text-sm text-white/50">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="card relative overflow-hidden p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-sol-gradient-soft" />
          <div className="relative">
            <Lock className="mx-auto mb-4 text-sol-green" size={32} />
            <h2 className="text-3xl font-bold">Ready to make an agreement that protects both sides?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/55">
              DRIU reduces risk through structured scope, escrow, staged payments, and verifiable approvals — not promises.
            </p>
            <button onClick={() => navigate('/create')} className="btn-primary mx-auto mt-6 !px-6 !py-3 text-base">
              Create your first project <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-white/35">
        DRIU · Milestone-based product development escrow on Solana · Devnet demo
      </footer>
    </div>
  );
}

function AudienceCard({ icon: Icon, title, points, tint }: { icon: ComponentType<{ size?: number; className?: string }>; title: string; points: string[]; tint: 'purple' | 'green' }) {
  return (
    <div className="card p-7">
      <div className={`mb-4 inline-grid h-11 w-11 place-items-center rounded-xl ${tint === 'purple' ? 'bg-sol-purple/15 text-sol-purple' : 'bg-sol-green/15 text-sol-green'}`}>
        <Icon size={22} />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm text-white/65">
            <CheckCircle2 size={17} className={tint === 'purple' ? 'mt-0.5 shrink-0 text-sol-purple' : 'mt-0.5 shrink-0 text-sol-green'} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: ComponentType<{ size?: number; className?: string }>; title: string; body: string }) {
  return (
    <div className="card card-hover p-6">
      <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-lg bg-white/5 text-sol-green">
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-white/50">{body}</p>
    </div>
  );
}
