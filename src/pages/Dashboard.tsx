import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Milestone, Project } from '../types';

import { actionItems, currentMilestone, projectProgress } from '../lib/actions';
import { Card, Progress, StatusBadge, Stat, EmptyState, Avatar } from '../components/ui';
import { PROJECT_STATUS, MILESTONE_STATUS } from '../lib/statuses';
import { money, daysUntil } from '../lib/format';
import { relativeTime } from '../lib/format';
import { ROLE_LABEL } from '../lib/statuses';
import { ArrowRight, FolderPlus, Zap, Clock, Mail, CalendarClock } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { projects, disputes, activity, currentRole } = useStore();

  const myProjects = useMemo(() => projects.filter((p) => {
    if (currentRole === 'arbiter') return !!p.arbiter;
    return true;
  }), [projects, currentRole]);

  const items = actionItems(projects, disputes, currentRole);

  const totals = useMemo(() => {
    const t = { released: 0, active: 0, future: 0, refundable: 0, disputed: 0, budget: 0 };
    for (const p of myProjects) {
      t.released += p.funds.released; t.active += p.funds.active; t.future += p.funds.future;
      t.refundable += p.funds.refundable; t.disputed += p.funds.disputed; t.budget += p.totalBudget;
    }
    return t;
  }, [myProjects]);

  const recent = activity.slice(0, 8);

  const deadlines = useMemo(() => {
    if (currentRole !== 'implementer') return [] as { p: Project; m: Milestone }[];
    const out: { p: Project; m: Milestone }[] = [];
    for (const p of projects) for (const m of p.milestones)
      if (['in-progress', 'revision-requested'].includes(m.status) && m.deliveryDeadline) out.push({ p, m });
    return out.sort((x, y) => new Date(x.m.deliveryDeadline!).getTime() - new Date(y.m.deliveryDeadline!).getTime());
  }, [projects, currentRole]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/45">Overview for {ROLE_LABEL[currentRole]}</p>
        </div>
        {currentRole === 'stakeholder' ? (
          <button onClick={() => navigate('/create')} className="btn-primary"><FolderPlus size={16} /> New Project</button>
        ) : (
          <button onClick={() => navigate('/invitations')} className="btn-primary"><Mail size={16} /> Invitations</button>
        )}
      </div>

      {/* fund summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label={currentRole === 'implementer' ? 'Earned' : 'Released'} value={money(totals.released)} accent="text-sol-green" sub={currentRole === 'implementer' ? 'Paid out to you' : 'Paid to implementer'} />
        <Stat label="Active in escrow" value={money(totals.active)} accent="text-sol-blue" sub={currentRole === 'implementer' ? 'Secured for your current work' : 'In-progress milestones'} />
        <Stat label={currentRole === 'implementer' ? 'Upcoming earnings' : 'Locked (future)'} value={money(totals.future)} sub={currentRole === 'implementer' ? 'Future milestones, already funded' : 'Awaiting future milestones'} />
        <Stat label="Refundable" value={money(totals.refundable)} accent="text-white" sub="Returnable to stakeholder" />
        <Stat label="In dispute" value={money(totals.disputed)} accent={totals.disputed > 0 ? 'text-red-300' : 'text-white'} sub="Locked pending resolution" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* action items */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Zap size={16} className="text-sol-purple" />
              <h2 className="font-semibold text-white">Needs your action</h2>
              {items.length > 0 && <span className="chip bg-sol-purple/20 text-sol-purple">{items.length}</span>}
            </div>
            {items.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/40">You’re all caught up. Nothing needs your attention.</div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <button key={it.id} onClick={() => navigate(it.link)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-white/5 px-4 py-3 text-left transition hover:bg-white/10">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${it.urgency === 'high' ? 'bg-red-400' : 'bg-sol-green'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{it.title}</div>
                      <div className="truncate text-xs text-white/45">{it.detail}</div>
                    </div>
                    <ArrowRight size={16} className="text-white/40" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* projects */}
          <div className="space-y-3">
            <h2 className="font-semibold text-white">Projects</h2>
            {myProjects.length === 0 ? (
              <EmptyState icon={<FolderPlus size={36} />} title="No projects yet" body={currentRole === 'stakeholder' ? 'Create your first milestone-based agreement to get started.' : 'Projects appear here once a Stakeholder invites you and the agreement begins.'} action={currentRole === 'stakeholder' ? <button onClick={() => navigate('/create')} className="btn-primary">New Project</button> : <button onClick={() => navigate('/invitations')} className="btn-primary">View invitations</button>} />
            ) : (
              myProjects.map((p) => {
                const cm = currentMilestone(p);
                const other = currentRole === 'implementer' ? p.stakeholder : (p.implementer ?? p.stakeholder);
                return (
                  <Card key={p.id} hover className="cursor-pointer p-5" >
                    <div onClick={() => navigate(`/project/${p.id}`)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{p.title}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-white/45">
                            <Avatar name={other.name} color={other.avatarColor} size={18} /> with {other.name}
                          </div>
                        </div>
                        <StatusBadge meta={PROJECT_STATUS[p.status]} />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div><div className="text-xs text-white/40">Budget</div><div className="font-semibold text-white">{money(p.totalBudget, p.currency)}</div></div>
                        <div><div className="text-xs text-white/40">Released</div><div className="font-semibold text-sol-green">{money(p.funds.released, p.currency)}</div></div>
                        <div><div className="text-xs text-white/40">In escrow</div><div className="font-semibold text-white">{money(p.funds.active + p.funds.future + p.funds.disputed, p.currency)}</div></div>
                      </div>
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-white/45">
                          <span>Progress · {p.milestones.filter((m) => m.status === 'paid').length}/{p.milestones.length} milestones</span>
                          <span>{projectProgress(p)}%</span>
                        </div>
                        <Progress value={projectProgress(p)} />
                      </div>
                      {cm && (
                        <div className="mt-4 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                          <div className="text-xs text-white/55">Current: <span className="text-white">{cm.title}</span></div>
                          <StatusBadge meta={MILESTONE_STATUS[cm.status]} />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          {deadlines.length > 0 && (
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock size={16} className="text-sol-blue" />
                <h2 className="font-semibold text-white">Upcoming deadlines</h2>
              </div>
              <div className="space-y-2">
                {deadlines.slice(0, 5).map(({ p, m }) => {
                  const d = daysUntil(m.deliveryDeadline!);
                  return (
                    <button key={m.id} onClick={() => navigate(`/project/${p.id}`)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-white/5 px-3 py-2.5 text-left hover:bg-white/10">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">{m.title}</div>
                        <div className="truncate text-xs text-white/45">{p.title}</div>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold ${d <= 2 ? 'text-red-300' : 'text-white/60'}`}>{d < 0 ? `${-d}d overdue` : d === 0 ? 'due today' : `${d}d left`}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
          {/* recent activity */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Clock size={16} className="text-white/50" />
              <h2 className="font-semibold text-white">Recent activity</h2>
            </div>
            <div className="space-y-3">
              {recent.length === 0 && <div className="py-4 text-center text-sm text-white/40">No activity yet</div>}
              {recent.map((a) => (
                <div key={a.id} className="flex gap-3 text-sm">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sol-purple" />
                  <div className="min-w-0">
                    <div className="text-white"><span className="font-medium">{ROLE_LABEL[a.actor]}</span> · {a.action}</div>
                    {a.detail && <div className="truncate text-xs text-white/45">{a.detail}</div>}
                    <div className="text-[10px] text-white/30">{relativeTime(a.at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
