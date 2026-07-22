import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Lock, GitBranch, Scale, Coins,
  ArrowRight, CheckCircle2, Users, FileCheck2, Wallet, Milestone,
  ChevronDown, Search, Globe, ChevronsUpDown,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { SolanaModel } from '../components/SolanaModel';
import { LogoMark } from '../components/ui';

const NAV_ITEMS = [
  { label: 'Use DRIU', to: '/dashboard' },
  { label: 'Build', to: '/create' },
  { label: 'Escrow', to: '/payments' },
  { label: 'Products', to: '/projects' },
  { label: 'Ecosystem', to: '/profile' },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* nav — solana.com style */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
          <button onClick={() => navigate('/')} className="flex shrink-0 items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-black uppercase tracking-[0.18em]">Driu</span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:text-white"
              >
                {item.label}
                <ChevronDown size={13} className="text-white/40" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden w-64 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/45 transition hover:border-white/20 hover:bg-white/10 md:flex"
            >
              <Search size={15} />
              <span className="flex-1 text-left">Search or ask AI</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">⌘K</kbd>
            </button>
            <button className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-white/70 transition hover:text-white sm:flex">
              <Globe size={15} /> EN <ChevronsUpDown size={12} className="text-white/40" />
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary !rounded-full lg:hidden">
              Enter App
            </button>
          </div>
        </div>
      </header>

      {/* hero — solana.com style */}
      <section className="relative overflow-hidden">
        {/* background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-sol-purple/30 blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[15%] h-96 w-96 rounded-full bg-sol-green/15 blur-[130px]" />
          <div className="absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-sol-purple/15 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(153,69,255,0.12),transparent_55%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[82vh] max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          {/* left: headline */}
          <div>
            <h1 className="text-[2.9rem] leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="font-bold">The escrow layer</span>
              <br />
              <span className="font-light text-white/90">for every deal on earth.</span>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-[#9ca3b8]">
              DRIU is the milestone-based escrow protocol on Solana powering
              product development, freelance work, and trustless agreements.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/create')}
                className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-base font-semibold text-black transition hover:bg-white/90"
              >
                Get started
                <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-white transition group-hover:translate-x-0.5">
                  <ArrowRight size={16} />
                </span>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-full border border-white/15 px-6 py-3 text-base font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Explore the demo
              </button>
            </div>
          </div>

          {/* right: spinning Solana 3D model */}
          <div id="hero-3d" className="relative hidden h-[30rem] items-center justify-center lg:flex">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <HeroWave />
            </div>
            <div className="relative z-10 h-full w-full">
              <SolanaModel />
            </div>
          </div>
        </div>
      </section>

      {/* stats strip — solana.com style */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-white/[0.06] px-6 md:grid-cols-4 md:divide-x">
          {[
            { label: 'Budget held in escrow', value: '100%' },
            { label: 'Approvals per milestone', value: '2×' },
            { label: 'Payment release', value: 'Instant' },
            { label: 'Network fees', value: '$0.001' },
          ].map((s) => (
            <div key={s.label} className="px-2 py-10 text-center md:px-8">
              <div className="text-4xl font-bold tracking-tight md:text-5xl">{s.value}</div>
              <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* audience */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sol-green">Made for both sides</p>
        <h2 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
          Built for the people who fund the work — and the people who ship it.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
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
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-sol-purple/15 blur-[130px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-sol-purple">Protocol safeguards</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-4xl font-bold tracking-tight md:text-5xl">How the escrow works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-[#9ca3b8]">
            Six safeguards that let two parties who don’t fully trust each other still ship a product together.
          </p>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <Feature icon={FileCheck2} title="Structured scope" body="An assistant converts your brief into milestones with measurable acceptance criteria and required evidence." />
            <Feature icon={ShieldCheck} title="Double approval" body="Every milestone is approved by both parties before work begins — and again after delivery." />
            <Feature icon={Wallet} title="Funded upfront" body="The Stakeholder deposits the full budget into escrow, so the Implementer knows the money is real." />
            <Feature icon={Coins} title="Staged payments" body="Approving a milestone releases only that amount. The rest stays locked in escrow." />
            <Feature icon={GitBranch} title="Versioned terms" body="Signed requirements are immutable. Any change creates a new version both parties must re-sign." />
            <Feature icon={Scale} title="Fair disputes" body="Revisions, timeouts, and an optional Arbiter prevent funds from being frozen or seized unilaterally." />
          </div>
        </div>
      </section>

      {/* flow strip */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03]">
          <div className="grid divide-y divide-white/[0.06] md:grid-cols-4 md:divide-x md:divide-y-0">
            {[
              { n: '01', t: 'Agree', d: 'Draft milestones and approve the exact scope together.' },
              { n: '02', t: 'Lock', d: 'Both parties sign; the full budget is deposited into escrow.' },
              { n: '03', t: 'Deliver', d: 'Work is submitted with evidence, milestone by milestone.' },
              { n: '04', t: 'Release', d: 'On approval, that milestone’s payment is released on-chain.' },
            ].map((s) => (
              <div key={s.n} className="p-8">
                <div className="text-4xl font-black gradient-text">{s.n}</div>
                <div className="mt-3 text-xl font-semibold">{s.t}</div>
                <div className="mt-1.5 text-sm leading-relaxed text-[#9ca3b8]">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-12 text-center md:p-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(153,69,255,0.35),transparent_60%),radial-gradient(ellipse_at_80%_-20%,rgba(20,241,149,0.18),transparent_55%)]" />
          <div className="relative">
            <Lock className="mx-auto mb-6 text-sol-green" size={36} />
            <h2 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
              Ready to make an agreement that protects both sides?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-[#9ca3b8]">
              DRIU reduces risk through structured scope, escrow, staged payments, and verifiable approvals — not promises.
            </p>
            <button
              onClick={() => navigate('/create')}
              className="group mx-auto mt-9 inline-flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-base font-semibold text-black transition hover:bg-white/90"
            >
              Create your first project
              <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-white transition group-hover:translate-x-0.5">
                <ArrowRight size={16} />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* footer — solana.com style */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div>
              <div className="flex items-center gap-2.5">
                <LogoMark />
                <span className="text-lg font-black uppercase tracking-[0.18em]">Driu</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/40">
                Milestone-based product development escrow on Solana. Devnet demo.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <FooterCol title="Product" links={[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Projects', to: '/projects' },
                { label: 'Payments', to: '/payments' },
              ]} />
              <FooterCol title="Protocol" links={[
                { label: 'Create project', to: '/create' },
                { label: 'Disputes', to: '/disputes' },
                { label: 'Invitations', to: '/invitations' },
              ]} />
              <FooterCol title="Account" links={[
                { label: 'Profile', to: '/profile' },
                { label: 'Notifications', to: '/notifications' },
              ]} />
            </div>
          </div>
          <div className="mt-12 border-t border-white/[0.06] pt-6 text-sm text-white/30">
            © {new Date().getFullYear()} DRIU · Built on Solana
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Decorative gradient waves behind the three.js model */
function HeroWave() {
  return (
    <svg viewBox="0 0 600 480" fill="none" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="wave-a" x1="0" y1="240" x2="600" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945FF" stopOpacity="0" />
          <stop offset="0.4" stopColor="#9945FF" />
          <stop offset="0.75" stopColor="#00C2FF" />
          <stop offset="1" stopColor="#14F195" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="wave-b" x1="0" y1="240" x2="600" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14F195" stopOpacity="0" />
          <stop offset="0.5" stopColor="#14F195" stopOpacity="0.7" />
          <stop offset="1" stopColor="#9945FF" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d="M-20 380 C 120 340, 180 420, 300 330 S 480 160, 620 120"
        stroke="url(#wave-a)" strokeWidth="3" strokeLinecap="round"
      />
      <path
        d="M-20 430 C 140 400, 220 460, 340 380 S 500 240, 620 200"
        stroke="url(#wave-b)" strokeWidth="2" strokeLinecap="round" opacity="0.7"
      />
      <path
        d="M-20 330 C 100 300, 200 370, 320 290 S 460 110, 620 60"
        stroke="url(#wave-a)" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"
      />
    </svg>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{title}</div>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <button onClick={() => navigate(l.to)} className="text-sm text-white/60 transition hover:text-white">
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AudienceCard({ icon: Icon, title, points, tint }: { icon: ComponentType<{ size?: number; className?: string }>; title: string; points: string[]; tint: 'purple' | 'green' }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 transition hover:border-white/20">
      <div className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-[90px] ${tint === 'purple' ? 'bg-sol-purple/25' : 'bg-sol-green/20'}`} />
      <div className={`relative mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl ${tint === 'purple' ? 'bg-sol-purple/15 text-sol-purple' : 'bg-sol-green/15 text-sol-green'}`}>
        <Icon size={24} />
      </div>
      <h3 className="relative text-2xl font-bold">{title}</h3>
      <ul className="relative mt-5 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-[15px] text-white/65">
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
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7 transition duration-200 hover:border-white/20 hover:bg-white/[0.05]">
      <div className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-sol-green">
        <Icon size={21} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#9ca3b8]">{body}</p>
    </div>
  );
}
