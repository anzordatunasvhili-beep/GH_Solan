import type { ReactNode } from 'react';
import type { GlobalTerms, Milestone } from '../types';
import { validateAgreement } from '../lib/validation';
import { money } from '../lib/format';
import { InfoBanner } from './ui';
import {
  Plus, Trash2, ChevronUp, ChevronDown, SplitSquareHorizontal, Merge, X,
} from 'lucide-react';
import { uid } from '../lib/id';

interface Props {
  milestones: Milestone[];
  onChange: (m: Milestone[]) => void;
  totalBudget: number;
  globalTerms: GlobalTerms;
  onTermsChange: (t: GlobalTerms) => void;
}

function blankMilestone(order: number): Milestone {
  return {
    id: uid('milestone'), order, title: 'New milestone', description: '', paymentAmount: 0, durationDays: 7,
    dependencies: [], deliverables: [''], acceptanceCriteria: [''], requiredEvidence: [{ type: 'document', label: 'Evidence' }],
    reviewPeriodDays: 5, revisionLimit: 2, delayTerms: { gracePeriodDays: 2, actionAfterGracePeriod: 'Stakeholder may cancel or open a dispute.' },
    stakeholderScopeApproved: false, implementerScopeApproved: false, implementerCompletionConfirmed: false, stakeholderCompletionApproved: false,
    status: 'draft', submissions: [], revisionRequests: [], revisionCount: 0,
  };
}

export function MilestoneEditor({ milestones, onChange, totalBudget, globalTerms, onTermsChange }: Props) {
  const issues = validateAgreement(milestones, globalTerms, totalBudget);
  const sum = milestones.reduce((a, m) => a + (m.paymentAmount || 0), 0);
  const diff = totalBudget - sum;

  const update = (idx: number, patch: Partial<Milestone>) => {
    onChange(milestones.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };
  const reorder = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= milestones.length) return;
    const arr = [...milestones];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    onChange(arr.map((m, i) => ({ ...m, order: i + 1 })));
  };
  const remove = (idx: number) => onChange(milestones.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i + 1 })));
  const add = () => onChange([...milestones, blankMilestone(milestones.length + 1)]);
  const split = (idx: number) => {
    const m = milestones[idx];
    const half = Math.floor(m.paymentAmount / 2);
    const a = { ...m, paymentAmount: half, title: m.title + ' (Part 1)' };
    const b = { ...blankMilestone(idx + 2), paymentAmount: m.paymentAmount - half, title: m.title + ' (Part 2)', description: m.description, dependencies: [m.id] };
    const arr = [...milestones];
    arr.splice(idx, 1, a, b);
    onChange(arr.map((mm, i) => ({ ...mm, order: i + 1 })));
  };
  const merge = (idx: number) => {
    if (idx + 1 >= milestones.length) return;
    const a = milestones[idx], b = milestones[idx + 1];
    const merged: Milestone = {
      ...a,
      title: `${a.title} + ${b.title}`,
      paymentAmount: a.paymentAmount + b.paymentAmount,
      durationDays: a.durationDays + b.durationDays,
      deliverables: [...a.deliverables, ...b.deliverables],
      acceptanceCriteria: [...a.acceptanceCriteria, ...b.acceptanceCriteria],
    };
    const arr = [...milestones];
    arr.splice(idx, 2, merged);
    onChange(arr.map((mm, i) => ({ ...mm, order: i + 1 })));
  };

  return (
    <div className="space-y-4">
      {/* budget bar */}
      <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${diff === 0 ? 'border-sol-green/30 bg-sol-green/10' : 'border-amber-400/30 bg-amber-400/10'}`}>
        <span className="text-white/70">Milestone payments: <span className="font-semibold text-white">{money(sum)}</span> of <span className="font-semibold text-white">{money(totalBudget)}</span></span>
        <span className={diff === 0 ? 'font-semibold text-sol-green' : 'font-semibold text-amber-300'}>
          {diff === 0 ? 'Balanced ✓' : diff > 0 ? `${money(diff)} unallocated` : `${money(-diff)} over budget`}
        </span>
      </div>

      {issues.filter((i) => i.level === 'error').length > 0 && (
        <InfoBanner tone="danger">
          <div className="font-semibold">Fix before sending:</div>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {issues.filter((i) => i.level === 'error').map((i, k) => <li key={k}>{i.message}</li>)}
          </ul>
        </InfoBanner>
      )}

      {milestones.map((m, idx) => (
        <div key={m.id} className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-sol-gradient text-sm font-bold text-black">{idx + 1}</span>
            <input value={m.title} onChange={(e) => update(idx, { title: e.target.value })} className="input flex-1 font-semibold" placeholder="Milestone title" />
            <div className="flex items-center gap-1">
              <IconBtn onClick={() => reorder(idx, -1)} title="Move up"><ChevronUp size={16} /></IconBtn>
              <IconBtn onClick={() => reorder(idx, 1)} title="Move down"><ChevronDown size={16} /></IconBtn>
              <IconBtn onClick={() => split(idx)} title="Split"><SplitSquareHorizontal size={16} /></IconBtn>
              <IconBtn onClick={() => merge(idx)} title="Merge with next"><Merge size={16} /></IconBtn>
              <IconBtn onClick={() => remove(idx)} title="Remove" danger><Trash2 size={16} /></IconBtn>
            </div>
          </div>

          <textarea value={m.description} onChange={(e) => update(idx, { description: e.target.value })} rows={2} className="input mb-3" placeholder="Detailed description of the milestone" />

          <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField label="Payment (USDC)" value={m.paymentAmount} onChange={(v) => update(idx, { paymentAmount: v })} />
            <NumField label="Duration (days)" value={m.durationDays} onChange={(v) => update(idx, { durationDays: v })} />
            <NumField label="Review (days)" value={m.reviewPeriodDays} onChange={(v) => update(idx, { reviewPeriodDays: v })} />
            <NumField label="Revision limit" value={m.revisionLimit} onChange={(v) => update(idx, { revisionLimit: v })} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ListEditor label="Deliverables" items={m.deliverables} onChange={(v) => update(idx, { deliverables: v })} />
            <ListEditor label="Acceptance criteria (measurable)" items={m.acceptanceCriteria} onChange={(v) => update(idx, { acceptanceCriteria: v })} />
          </div>

          <div className="mt-3">
            <div className="label">Required evidence</div>
            <div className="flex flex-wrap gap-2">
              {m.requiredEvidence.map((ev, k) => (
                <span key={k} className="chip bg-white/8 text-white/70">
                  {ev.label}
                  <button onClick={() => update(idx, { requiredEvidence: m.requiredEvidence.filter((_, i) => i !== k) })} className="text-white/40 hover:text-white"><X size={12} /></button>
                </span>
              ))}
              <button onClick={() => update(idx, { requiredEvidence: [...m.requiredEvidence, { type: 'document', label: 'New evidence' }] })} className="chip border border-dashed border-white/20 text-white/50 hover:text-white"><Plus size={12} /> Add</button>
            </div>
          </div>

          {idx > 0 && (
            <div className="mt-3">
              <div className="label">Depends on</div>
              <div className="flex flex-wrap gap-2">
                {milestones.slice(0, idx).map((dep) => {
                  const on = m.dependencies.includes(dep.id);
                  return (
                    <button key={dep.id} onClick={() => update(idx, { dependencies: on ? m.dependencies.filter((d) => d !== dep.id) : [...m.dependencies, dep.id] })}
                      className={`chip ${on ? 'bg-sol-purple/20 text-sol-purple' : 'bg-white/8 text-white/50'}`}>
                      {dep.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={add} className="btn-ghost w-full"><Plus size={16} /> Add milestone</button>

      {/* global terms */}
      <div className="card p-5">
        <h3 className="mb-3 font-semibold text-white">Global terms</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <NumField label="Default review (days)" value={globalTerms.reviewPeriodDays} onChange={(v) => onTermsChange({ ...globalTerms, reviewPeriodDays: v })} />
          <NumField label="Revisions / milestone" value={globalTerms.revisionLimitPerMilestone} onChange={(v) => onTermsChange({ ...globalTerms, revisionLimitPerMilestone: v })} />
          <NumField label="Late grace (days)" value={globalTerms.lateSubmissionGraceDays} onChange={(v) => onTermsChange({ ...globalTerms, lateSubmissionGraceDays: v })} />
        </div>
        <div className="mt-3">
          <label className="label">Review-timeout outcome (visible before signing)</label>
          <select value={globalTerms.timeoutOutcome} onChange={(e) => onTermsChange({ ...globalTerms, timeoutOutcome: e.target.value as GlobalTerms['timeoutOutcome'] })} className="input">
            <option value="escalate-arbiter">Escalate to Arbiter</option>
            <option value="auto-release">Automatic payment release</option>
            <option value="pause-project">Temporary project pause</option>
            <option value="mandatory-dispute">Mandatory dispute creation</option>
          </select>
        </div>
        <div className="mt-3 grid gap-3">
          <div><label className="label">Cancellation policy</label><textarea rows={2} className="input" value={globalTerms.cancellationPolicy} onChange={(e) => onTermsChange({ ...globalTerms, cancellationPolicy: e.target.value })} /></div>
          <div><label className="label">Dispute policy</label><textarea rows={2} className="input" value={globalTerms.disputePolicy} onChange={(e) => onTermsChange({ ...globalTerms, disputePolicy: e.target.value })} /></div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return <button title={title} onClick={onClick} className={`rounded-lg border border-line p-2 text-white/60 hover:bg-white/10 ${danger ? 'hover:text-red-300' : 'hover:text-white'}`}>{children}</button>;
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="input" />
    </div>
  );
}

function ListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input value={it} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} className="input" />
            <button onClick={() => onChange(items.filter((_, k) => k !== i))} className="rounded-lg border border-line px-2 text-white/50 hover:text-red-300"><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ''])} className="text-xs text-sol-purple hover:underline">+ Add</button>
      </div>
    </div>
  );
}
