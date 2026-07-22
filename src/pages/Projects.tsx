import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { StatusBadge, EmptyState, Avatar } from '../components/ui';
import { PROJECT_STATUS, MILESTONE_STATUS } from '../lib/statuses';
import { money, relativeTime } from '../lib/format';
import { projectProgress, currentMilestone, actionItems } from '../lib/actions';
import type { Milestone, Project } from '../types';
import {
  FolderPlus, Search, ArrowRight, ArrowUpDown,
  Lock, Coins, Zap, Globe, Smartphone, Palette, FileCode2, Boxes, Layers, Mail,
} from 'lucide-react';

type Filter = 'all' | 'active' | 'awaiting' | 'closed';
type Sort = 'recent' | 'budget' | 'progress';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'awaiting', label: 'Awaiting' },
  { id: 'closed', label: 'Closed' },
];

function matchesFilter(p: Project, f: Filter): boolean {
  if (f === 'active') return ['active', 'funded', 'in-dispute', 'paused', 'awaiting-closeout'].includes(p.status);
  if (f === 'awaiting') return p.status.startsWith('awaiting') || ['changes-requested', 'stakeholder-editing', 'draft'].includes(p.status);
  if (f === 'closed') return ['completed', 'cancelled', 'refunded'].includes(p.status);
  return true;
}

const CATEGORY_ICON: Record<string, typeof Globe> = {
  'Website': Globe,
  'Web App': Layers,
  'Mobile App': Smartphone,
  'Branding / Design': Palette,
  'Smart Contract': FileCode2,
};

function milestoneDotClass(m: Milestone): string {
  if (m.status === 'paid') return 'bg-sol-green';
  if (m.status === 'disputed') return 'bg-red-400';
  if (['in-progress', 'submitted', 'under-review', 'resubmitted', 'revision-requested'].includes(m.status)) return 'bg-sol-blue';
  if (['cancelled', 'refunded'].includes(m.status)) return 'bg-white/10';
  return 'bg-white/20';
}

export function Projects() {
  const navigate = useNavigate();
  const { projects, disputes, currentRole } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');

  const items = useMemo(() => actionItems(projects, disputes, currentRole), [projects, disputes, currentRole]);
  const nextActionFor = (id: string) => items.find((i) => i.projectId === id);

  const counts = useMemo(() => Object.fromEntries(
    FILTERS.map((f) => [f.id, projects.filter((p) => matchesFilter(p, f.id)).length]),
  ) as Record<Filter, number>, [projects]);

  const filtered = useMemo(() => {
    const list = projects.filter((p) =>
      matchesFilter(p, filter) &&
      (!q || (p.title + ' ' + p.category + ' ' + p.summary).toLowerCase().includes(q.toLowerCase())),
    );
    if (sort === 'budget') return [...list].sort((a, b) => b.totalBudget - a.totalBudget);
    if (sort === 'progress') return [...list].sort((a, b) => projectProgress(b) - projectProgress(a));
    return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects, filter, q, sort]);

  const stats = useMemo(() => {
    const s = { locked: 0, released: 0, active: 0 };
    for (const p of projects) {
      s.locked += p.funds.active + p.funds.future + p.funds.disputed;
      s.released += p.funds.released;
      if (['active', 'funded', 'in-dispute', 'paused', 'awaiting-closeout'].includes(p.status)) s.active += 1;
    }
    return s;
  }, [projects]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* header */}
      <div className="rounded-2xl border border-line bg-ink-850 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Projects</h1>
            <p className="mt-1 text-sm text-white/45">{currentRole === 'implementer' ? 'Deliver work, hit milestones, get paid from escrow' : 'Fund scope, approve milestones, release payments'} - {projects.length} agreements · escrow-backed, milestone by milestone</p>
            <div className="mt-5 flex flex-wrap gap-6">
              <HeroStat icon={Lock} label="Locked in escrow" value={money(stats.locked)} tint="text-sol-blue" />
              <HeroStat icon={Coins} label={currentRole === 'implementer' ? 'Earned' : 'Released'} value={money(stats.released)} tint="text-sol-green" />
              <HeroStat icon={Zap} label="Active projects" value={String(stats.active)} tint="text-white/70" />
            </div>
          </div>
          {currentRole === 'stakeholder' ? (
            <button onClick={() => navigate('/create')} className="btn-primary !px-5 !py-3">
              <FolderPlus size={17} /> New Project
            </button>
          ) : (
            <button onClick={() => navigate('/invitations')} className="btn-primary !px-5 !py-3">
              <Mail size={17} /> Invitations
            </button>
          )}
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, category, summary…" className="input pl-9" />
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-white/5 p-1">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`tab flex items-center gap-1.5 ${filter === f.id ? 'tab-active' : ''}`}>
              {f.label}
              <span className={`rounded-full px-1.5 text-[10px] font-semibold ${filter === f.id ? 'bg-white/15 text-white/80' : 'bg-white/10 text-white/40'}`}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setSort(sort === 'recent' ? 'budget' : sort === 'budget' ? 'progress' : 'recent')}
          className="btn-ghost !py-2.5" title="Change sorting"
        >
          <ArrowUpDown size={15} />
          {sort === 'recent' ? 'Recent' : sort === 'budget' ? 'Budget' : 'Progress'}
        </button>
      </div>

      {/* grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Boxes size={36} />}
          title="No projects found"
          body={currentRole === 'stakeholder' ? 'Try a different filter or create a new project.' : 'Try a different filter, or check your invitations for new agreements.'}
          action={currentRole === 'stakeholder' ? <button onClick={() => navigate('/create')} className="btn-primary"><FolderPlus size={16} /> New Project</button> : <button onClick={() => navigate('/invitations')} className="btn-primary"><Mail size={16} /> View invitations</button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <ProjectCard key={p.id} p={p} next={nextActionFor(p.id)?.title} onOpen={() => navigate(`/project/${p.id}`)} otherRole={currentRole} />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroStat({ icon: Icon, label, value, tint }: { icon: typeof Lock; label: string; value: string; tint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-10 w-10 place-items-center rounded-xl bg-white/5 ${tint}`}><Icon size={18} /></span>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function ProjectCard({ p, next, onOpen, otherRole }: { p: Project; next?: string; onOpen: () => void; otherRole: string }) {
  const other = otherRole === 'implementer' ? p.stakeholder : (p.implementer ?? p.stakeholder);
  const cm = currentMilestone(p);
  const progress = projectProgress(p);
  const Icon = CATEGORY_ICON[p.category] ?? Boxes;
  const paid = p.milestones.filter((m) => m.status === 'paid').length;

  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl border border-line bg-ink-850 p-5 text-left transition duration-200 hover:border-white/20 hover:bg-ink-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-white/60">
            <Icon size={19} />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-white">{p.title}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-white/40">
              <span>{p.category}</span>
              <span className="h-0.5 w-0.5 rounded-full bg-white/25" />
              <span>updated {relativeTime(p.updatedAt)}</span>
            </div>
          </div>
        </div>
        <StatusBadge meta={PROJECT_STATUS[p.status]} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-white/50">{p.summary}</p>

      {/* fund allocation bar */}
      <div className="mt-4">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/8">
          <FundSeg v={p.funds.released} total={p.totalBudget} cls="bg-sol-green" label="Released" />
          <FundSeg v={p.funds.active} total={p.totalBudget} cls="bg-sol-blue" label="Active" />
          <FundSeg v={p.funds.disputed} total={p.totalBudget} cls="bg-red-400" label="Disputed" />
          <FundSeg v={p.funds.refundable} total={p.totalBudget} cls="bg-white/30" label="Refundable" />
          <FundSeg v={p.funds.future} total={p.totalBudget} cls="bg-white/15" label="Future" />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-white/40">
            <span className="font-semibold text-sol-green">{money(p.funds.released, p.currency)}</span> released of {money(p.totalBudget, p.currency)}
          </span>
          <span className="font-semibold text-white/70">{progress}%</span>
        </div>
      </div>

      {/* milestone tracker */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5">
          {p.milestones.map((m) => (
            <span
              key={m.id}
              title={`${m.order}. ${m.title} — ${MILESTONE_STATUS[m.status].label}`}
              className={`h-2 flex-1 rounded-full ${milestoneDotClass(m)}`}
            />
          ))}
        </div>
        <span className="shrink-0 text-[11px] font-medium text-white/40">{paid}/{p.milestones.length}</span>
      </div>

      {/* footer */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <div className="flex min-w-0 items-center gap-2 text-xs text-white/55">
          <Avatar name={other.name} color={other.avatarColor} size={22} />
          <span className="truncate">{other.name}</span>
        </div>
        {next ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
            <Zap size={12} className="text-sol-green" /> {next}
          </span>
        ) : cm ? (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-white/40 transition group-hover:text-white/70">
            {cm.title.length > 24 ? cm.title.slice(0, 24) + '…' : cm.title} <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
          </span>
        ) : null}
      </div>
    </button>
  );
}

function FundSeg({ v, total, cls, label }: { v: number; total: number; cls: string; label: string }) {
  if (v <= 0) return null;
  return <div className={cls} style={{ width: `${(v / (total || 1)) * 100}%` }} title={`${label}: ${v.toLocaleString()} USDC`} />;
}
