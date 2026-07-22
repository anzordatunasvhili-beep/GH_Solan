import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, Progress, StatusBadge, EmptyState, Avatar } from '../components/ui';
import { PROJECT_STATUS } from '../lib/statuses';
import { money } from '../lib/format';
import { projectProgress } from '../lib/actions';
import { FolderPlus, Search } from 'lucide-react';

export function Projects() {
  const navigate = useNavigate();
  const { projects, currentRole } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'awaiting' | 'closed'>('all');

  const filtered = projects.filter((p) => {
    if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'active') return ['active', 'funded', 'in-dispute', 'paused'].includes(p.status);
    if (filter === 'awaiting') return p.status.startsWith('awaiting') || p.status === 'changes-requested' || p.status === 'stakeholder-editing';
    if (filter === 'closed') return ['completed', 'cancelled', 'refunded'].includes(p.status);
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-white/45">{projects.length} total</p>
        </div>
        <button onClick={() => navigate('/create')} className="btn-primary"><FolderPlus size={16} /> New Project</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="input pl-9" />
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-white/5 p-1">
          {(['all', 'active', 'awaiting', 'closed'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`tab ${filter === f ? 'tab-active' : ''}`}>{f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FolderPlus size={36} />} title="No projects found" body="Try a different filter or create a new project." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((p) => {
            const other = currentRole === 'implementer' ? p.stakeholder : (p.implementer ?? p.stakeholder);
            return (
              <Card key={p.id} hover className="cursor-pointer p-5" >
                <div onClick={() => navigate(`/project/${p.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white">{p.title}</div>
                      <div className="text-xs text-white/45">{p.category}</div>
                    </div>
                    <StatusBadge meta={PROJECT_STATUS[p.status]} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-white/50">{p.summary}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-white/55"><Avatar name={other.name} color={other.avatarColor} size={20} /> {other.name}</div>
                    <div className="font-semibold text-white">{money(p.totalBudget, p.currency)}</div>
                  </div>
                  <div className="mt-3">
                    <Progress value={projectProgress(p)} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
