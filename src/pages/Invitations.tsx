import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, EmptyState, StatusBadge, Avatar, Pill } from '../components/ui';
import { PROJECT_STATUS } from '../lib/statuses';
import { money, formatDate } from '../lib/format';
import { Mail, ArrowRight } from 'lucide-react';

export function Invitations() {
  const navigate = useNavigate();
  const { projects, currentRole } = useStore();

  const list = projects.filter((p) => {
    if (currentRole === 'implementer') return ['awaiting-implementer-review', 'changes-requested', 'awaiting-final-scope-approval', 'awaiting-signatures'].includes(p.status);
    if (currentRole === 'stakeholder') return ['awaiting-implementer-review', 'changes-requested'].includes(p.status);
    return false;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Invitations</h1>
        <p className="text-sm text-white/45">{currentRole === 'implementer' ? 'Projects waiting for your review' : 'Agreements you’ve sent for review'}</p>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<Mail size={36} />} title="No pending invitations" body={currentRole === 'implementer' ? 'When a Stakeholder invites you to a project, it will appear here.' : 'Send an agreement to an Implementer to see it here.'} />
      ) : (
        list.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{p.title}</span>
                  <StatusBadge meta={PROJECT_STATUS[p.status]} />
                </div>
                <p className="mt-1 text-sm text-white/50">{p.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/55">
                  <span className="flex items-center gap-2"><Avatar name={p.stakeholder.name} color={p.stakeholder.avatarColor} size={18} /> {p.stakeholder.name}</span>
                  <Pill>{money(p.totalBudget, p.currency)}</Pill>
                  <Pill>{p.milestones.length} milestones</Pill>
                  {p.desiredCompletionDate && <span className="text-white/40">by {formatDate(p.desiredCompletionDate)}</span>}
                </div>
              </div>
              <button onClick={() => navigate(`/project/${p.id}`)} className="btn-primary shrink-0">Review <ArrowRight size={16} /></button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
