import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/useProfile';
import { useStore } from '../store/useStore';
import { DEMO_PARTIES } from '../lib/seed';
import { connectWallet, detectWallets } from '../lib/wallet';
import type { Role } from '../types';
import { Briefcase, Hammer, Scale, Wallet, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LogoMark } from '../components/ui';

const ROLE_CARDS: { role: Role; icon: typeof Briefcase; title: string; desc: string }[] = [
  { role: 'stakeholder', icon: Briefcase, title: 'Stakeholder', desc: 'I fund work and approve milestones' },
  { role: 'implementer', icon: Hammer, title: 'Implementer', desc: 'I deliver work and get paid per milestone' },
  { role: 'arbiter', icon: Scale, title: 'Arbiter', desc: 'I resolve disputes between parties' },
];

export function Auth() {
  const navigate = useNavigate();
  const { signIn } = useProfile();
  const { connected, setWallet, setRole } = useStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRoleSel] = useState<Role>('stakeholder');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const available = detectWallets();
  const defaults = DEMO_PARTIES[role];

  async function connect(kind: 'phantom' | 'solflare' | 'simulated') {
    try {
      const w = await connectWallet(kind, role);
      setWallet(w);
    } catch (e) {
      alert('Could not connect: ' + (e as Error).message + '. Try the Demo Wallet.');
    }
  }

  function submit() {
    setBusy(true);
    const finalName = name.trim() || defaults.name;
    const finalEmail = email.trim() || defaults.email || '';
    setRole(role);
    signIn({ role, name: finalName, email: finalEmail, at: new Date().toISOString() });
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* left: brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] p-12 lg:flex">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-sol-purple/25 blur-[130px]" />
            <div className="absolute bottom-[-15%] right-[-10%] h-80 w-80 rounded-full bg-sol-green/15 blur-[120px]" />
          </div>
          <button onClick={() => navigate('/')} className="relative flex items-center gap-2.5 text-left">
            <LogoMark />
            <span className="text-lg font-black uppercase tracking-[0.18em] text-white">Driu</span>
          </button>
          <div className="relative">
            <h1 className="text-4xl leading-tight tracking-tight text-white">
              <span className="font-bold">Agreements built on</span>
              <br />
              <span className="font-light text-white/90">trust you can verify.</span>
            </h1>
            <p className="mt-4 max-w-md text-[#9ca3b8]">
              Sign in to define scope together, secure the budget in escrow, and build reputation —
              <span className="text-white/80"> aura</span> — with every verified identity and completed contract.
            </p>
            <div className="mt-8 space-y-3">
              <Bullet text="Verify your identity once to earn your first aura point" />
              <Bullet text="Both parties gain aura for every successful contract" />
              <Bullet text="Reviews and reputation travel with your wallet" />
            </div>
          </div>
          <div className="relative text-xs text-white/35">Devnet demo · non-custodial signing</div>
        </div>

        {/* right: form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <LogoMark size={32} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="mt-1 text-sm text-[#9ca3b8]">{mode === 'signin' ? 'Sign in to continue to DRIU.' : 'Join as a Stakeholder, Implementer, or Arbiter.'}</p>

            {/* tabs */}
            <div className="mt-6 flex gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1">
              <button onClick={() => setMode('signin')} className={`tab flex-1 text-center ${mode === 'signin' ? 'tab-active' : ''}`}>Sign in</button>
              <button onClick={() => setMode('signup')} className={`tab flex-1 text-center ${mode === 'signup' ? 'tab-active' : ''}`}>Sign up</button>
            </div>

            {/* role choice */}
            <div className="mt-6">
              <label className="label">I am a…</label>
              <div className="grid gap-2">
                {ROLE_CARDS.map(({ role: r, icon: Icon, title, desc }) => (
                  <button key={r} onClick={() => setRoleSel(r)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${role === r ? 'border-sol-purple bg-sol-purple/10' : 'border-line bg-white/5 hover:bg-white/10'}`}>
                    <span className={`grid h-9 w-9 place-items-center rounded-lg ${role === r ? 'bg-sol-purple/20 text-sol-purple' : 'bg-white/5 text-white/60'}`}><Icon size={17} /></span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{title}</div>
                      <div className="text-xs text-white/45">{desc}</div>
                    </div>
                    {role === r && <CheckCircle2 size={16} className="text-sol-purple" />}
                  </button>
                ))}
              </div>
            </div>

            {/* fields */}
            <div className="mt-4 space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="label">Full name</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={defaults.name} />
                </div>
              )}
              <div>
                <label className="label">Email</label>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={defaults.email} />
              </div>
            </div>

            {/* wallet */}
            <div className="mt-4">
              <label className="label">Wallet</label>
              {connected ? (
                <div className="flex items-center gap-2 rounded-xl border border-sol-green/30 bg-sol-green/10 px-3 py-2.5 text-sm">
                  <span className="h-2 w-2 rounded-full bg-sol-green" />
                  <span className="font-mono text-xs text-white">{connected.publicKey.slice(0, 8)}…{connected.publicKey.slice(-6)}</span>
                  <span className="chip bg-white/5 text-white/50">{connected.label}</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <WalletBtn label="Phantom" ok={available.includes('phantom')} onClick={() => connect('phantom')} />
                  <WalletBtn label="Solflare" ok={available.includes('solflare')} onClick={() => connect('solflare')} />
                  <WalletBtn label="Demo" ok onClick={() => connect('simulated')} />
                </div>
              )}
            </div>

            <button onClick={submit} disabled={busy} className="btn-primary mt-6 w-full !py-3">
              {mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/35">
              <ShieldCheck size={13} /> Your keys never leave your wallet. Signing is used only to authorize actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-white/60">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-sol-green" /> {text}
    </div>
  );
}

function WalletBtn({ label, ok, onClick }: { label: string; ok: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-xl border border-line bg-white/5 px-2 py-3 text-center hover:bg-white/10">
      <Wallet size={16} className="text-white/70" />
      <span className="text-xs font-medium text-white">{label}</span>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-sol-green' : 'bg-white/20'}`} />
    </button>
  );
}
