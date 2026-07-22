import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Mail, Wallet, Gavel, Bell, User,
  Plus, ChevronDown, LogOut, ShieldCheck,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { actionItems } from '../lib/actions';
import { Avatar, Modal } from './ui';
import { DEMO_PARTIES } from '../lib/seed';
import { connectWallet, detectWallets, explorerAddr } from '../lib/wallet';
import type { Role } from '../types';
import { relativeTime, titleCase } from '../lib/format';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/invitations', label: 'Invitations', icon: Mail },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/disputes', label: 'Disputes', icon: Gavel },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

const ROLES: Role[] = ['stakeholder', 'implementer', 'arbiter'];

export function Layout() {
  const navigate = useNavigate();
  const { currentRole, setRole, projects, disputes, connected, setWallet, notifications, markAllRead } = useStore();
  const [walletOpen, setWalletOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const items = useMemo(() => actionItems(projects, disputes, currentRole), [projects, disputes, currentRole]);
  const unread = notifications.filter((n) => n.audience === currentRole && !n.read);
  const myNotifs = notifications.filter((n) => n.audience === currentRole).slice(0, 12);
  const pendingInvites = projects.filter((p) =>
    (currentRole === 'implementer' && (p.status === 'awaiting-implementer-review' || p.status === 'changes-requested'))).length;

  const badge = (n: number) => n > 0 ? <span className="ml-auto rounded-full bg-sol-purple/25 px-2 py-0.5 text-xs font-semibold text-sol-purple">{n}</span> : null;

  async function doConnect(kind: 'phantom' | 'solflare' | 'simulated') {
    try {
      const w = await connectWallet(kind, currentRole);
      setWallet(w);
      setWalletOpen(false);
    } catch (e) {
      alert('Could not connect: ' + (e as Error).message + '. Try the Demo Wallet.');
    }
  }

  const available = detectWallets();

  return (
    <div className="flex min-h-screen bg-ink-950 bg-grid [background-size:22px_22px]">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-ink-900/80 backdrop-blur">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 px-5 py-5 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sol-gradient font-black text-black shadow-glow">D</span>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-white">DRIU</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Milestone Escrow</div>
          </div>
        </button>

        <div className="px-3 py-2">
          <button onClick={() => navigate('/create')} className="btn-primary w-full">
            <Plus size={16} /> New Project
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
              {label === 'Dashboard' && badge(items.length)}
              {label === 'Invitations' && badge(pendingInvites)}
              {label === 'Disputes' && badge(disputes.filter((d) => d.status !== 'resolved').length)}
              {label === 'Notifications' && badge(unread.length)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3 text-[11px] text-white/35">
          Devnet demo · simulated escrow
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-ink-900/80 px-6 py-3 backdrop-blur">
          <div className="text-sm text-white/50">Viewing as</div>
          {/* Role switcher */}
          <div className="relative">
            <button onClick={() => setRoleOpen((o) => !o)} className="btn-ghost !py-2">
              <Avatar name={DEMO_PARTIES[currentRole].name} color={DEMO_PARTIES[currentRole].avatarColor} size={22} />
              <span className="font-semibold">{DEMO_PARTIES[currentRole].name}</span>
              <span className="chip bg-white/5 text-white/50">{titleCase(currentRole)}</span>
              <ChevronDown size={14} />
            </button>
            {roleOpen && (
              <div className="absolute left-0 top-full z-40 mt-2 w-64 card p-1" onMouseLeave={() => setRoleOpen(false)}>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setRoleOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 ${r === currentRole ? 'bg-white/5' : ''}`}
                  >
                    <Avatar name={DEMO_PARTIES[r].name} color={DEMO_PARTIES[r].avatarColor} size={26} />
                    <div>
                      <div className="font-medium text-white">{DEMO_PARTIES[r].name}</div>
                      <div className="text-xs text-white/45">{titleCase(r)} · {DEMO_PARTIES[r].org}</div>
                    </div>
                  </button>
                ))}
                <div className="px-3 py-2 text-[11px] text-white/35">Switch roles to demo both sides of an agreement.</div>
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotifOpen((o) => !o)} className="relative rounded-xl border border-line bg-white/5 p-2.5 text-white/70 hover:bg-white/10">
                <Bell size={18} />
                {unread.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-sol-purple text-[10px] font-bold text-black">{unread.length}</span>}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-80 card p-2" onMouseLeave={() => setNotifOpen(false)}>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    <button className="text-xs text-sol-purple hover:underline" onClick={markAllRead}>Mark all read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {myNotifs.length === 0 && <div className="px-3 py-6 text-center text-sm text-white/40">No notifications</div>}
                    {myNotifs.map((n) => (
                      <button key={n.id} onClick={() => { setNotifOpen(false); navigate(n.link); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-sol-purple" />}
                          <span className="text-sm font-medium text-white">{n.title}</span>
                          <span className="ml-auto text-[10px] text-white/35">{relativeTime(n.at)}</span>
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-white/50">{n.body}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wallet */}
            {connected ? (
              <a href={explorerAddr(connected.publicKey)} target="_blank" rel="noreferrer" className="btn-ghost !py-2" title="View on explorer">
                <span className="h-2 w-2 rounded-full bg-sol-green" />
                <span className="font-mono text-xs">{connected.publicKey.slice(0, 4)}…{connected.publicKey.slice(-4)}</span>
                <span className="chip bg-white/5 text-white/50">{connected.label}</span>
              </a>
            ) : (
              <button onClick={() => setWalletOpen(true)} className="btn-primary !py-2"><Wallet size={16} /> Connect Wallet</button>
            )}
          </div>
        </header>

        <main className="flex-1 animate-fade-in px-6 py-6">
          <Outlet />
        </main>
      </div>

      {/* Wallet modal */}
      <Modal open={walletOpen} onClose={() => setWalletOpen(false)} title="Connect a wallet">
        <p className="mb-4 text-sm text-white/55">Connect a Solana wallet to sign agreements and authorize devnet transactions. Signatures use your wallet’s message signing.</p>
        <div className="space-y-2">
          <WalletOption name="Phantom" available={available.includes('phantom')} onClick={() => doConnect('phantom')} />
          <WalletOption name="Solflare" available={available.includes('solflare')} onClick={() => doConnect('solflare')} />
          <button onClick={() => doConnect('simulated')} className="flex w-full items-center gap-3 rounded-xl border border-sol-purple/30 bg-sol-purple/10 px-4 py-3 text-left hover:bg-sol-purple/20">
            <ShieldCheck size={20} className="text-sol-purple" />
            <div>
              <div className="font-semibold text-white">Demo Wallet</div>
              <div className="text-xs text-white/50">Simulated signing — works without an extension</div>
            </div>
          </button>
        </div>
        {connected && (
          <button onClick={() => { setWallet(null); }} className="btn-ghost mt-4 w-full"><LogOut size={16} /> Disconnect</button>
        )}
      </Modal>
    </div>
  );
}

function WalletOption({ name, available, onClick }: { name: string; available: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-line bg-white/5 px-4 py-3 text-left hover:bg-white/10">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 font-bold text-white">{name[0]}</span>
      <div className="flex-1">
        <div className="font-semibold text-white">{name}</div>
        <div className="text-xs text-white/45">{available ? 'Detected' : 'Not detected — will prompt to install'}</div>
      </div>
      {available && <span className="h-2 w-2 rounded-full bg-sol-green" />}
    </button>
  );
}
