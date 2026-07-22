import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MilestoneEditor } from '../components/MilestoneEditor';
import { Card, StatusBadge, Progress, Avatar, Modal, Field, InfoBanner, Pill } from '../components/ui';
import { MILESTONE_STATUS, PROJECT_STATUS, ROLE_LABEL } from '../lib/statuses';
import { money, formatDate, formatDateTime, relativeTime, daysUntil, titleCase } from '../lib/format';
import { shortHash } from '../lib/hash';
import { projectProgress } from '../lib/actions';
import { explorerTx } from '../lib/wallet';
import { isValid, validateAgreement } from '../lib/validation';
import type { Milestone, Project, Role } from '../types';
import { useProfile } from '../store/useProfile';
import { Star, Sparkles } from 'lucide-react';
import {
  ArrowLeft, Send, PenLine, ShieldCheck, Coins, Play, Upload, CheckCircle2,
  RotateCcw, Gavel, Clock, FileText, GitBranch, Activity as ActIcon, Layers,
  ExternalLink, AlertTriangle, CalendarClock, FilePlus2, XCircle, Lock,
} from 'lucide-react';

const TABS = ['Overview', 'Milestones', 'Agreement', 'Documents', 'Payments', 'Activity', 'Disputes', 'Amendments'] as const;
type Tab = typeof TABS[number];

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const role = store.currentRole;
  const project = store.projects.find((p) => p.id === id);
  const [tab, setTab] = useState<Tab>('Overview');

  // modal state
  const [submitFor, setSubmitFor] = useState<Milestone | null>(null);
  const [reviseFor, setReviseFor] = useState<Milestone | null>(null);
  const [disputeFor, setDisputeFor] = useState<Milestone | null>(null);
  const [extendFor, setExtendFor] = useState<Milestone | null>(null);
  const [amendOpen, setAmendOpen] = useState(false);
  const [signing, setSigning] = useState(false);

  if (!project) return <div className="mx-auto max-w-4xl py-20 text-center text-white/50">Project not found.</div>;
  const p = project;

  const version = p.versions[p.versions.length - 1];
  const escrowLocked = p.funds.active + p.funds.future + p.funds.disputed;
  const canEdit = role === 'stakeholder' && ['stakeholder-editing', 'changes-requested', 'draft'].includes(p.status);
  const projectDisputes = store.disputes.filter((d) => d.projectId === p.id);

  async function sign() {
    setSigning(true);
    try { await store.signAgreement(p.id, role); } finally { setSigning(false); }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white"><ArrowLeft size={15} /> Back</button>

      {/* header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{p.title}</h1>
              <StatusBadge meta={PROJECT_STATUS[p.status]} />
              {p.confidential && <Pill><Lock size={12} /> Confidential</Pill>}
            </div>
            <p className="mt-1 max-w-2xl text-sm text-white/50">{p.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2 text-white/60"><Avatar name={p.stakeholder.name} color={p.stakeholder.avatarColor} size={20} /> {p.stakeholder.name} <span className="text-white/35">Stakeholder</span></span>
              {p.implementer && <span className="flex items-center gap-2 text-white/60"><Avatar name={p.implementer.name} color={p.implementer.avatarColor} size={20} /> {p.implementer.name} <span className="text-white/35">Implementer</span></span>}
              {p.arbiter && <span className="flex items-center gap-2 text-white/60"><Avatar name={p.arbiter.name} color={p.arbiter.avatarColor} size={20} /> {p.arbiter.name} <span className="text-white/35">Arbiter</span></span>}
            </div>
          </div>
          <PrimaryAction p={p} role={role} onSign={sign} signing={signing} onEditTab={() => setTab('Milestones')} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Total budget" value={money(p.totalBudget, p.currency)} />
          <MiniStat label="Released" value={money(p.funds.released, p.currency)} accent="text-sol-green" />
          <MiniStat label="In escrow" value={money(escrowLocked, p.currency)} accent="text-sol-blue" />
          <MiniStat label="Refundable" value={money(p.funds.refundable, p.currency)} />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-white/45">
            <span>Progress · {p.milestones.filter((m) => m.status === 'paid').length}/{p.milestones.length} milestones paid</span>
            <span>Agreement v{p.currentVersion || '—'} · {projectProgress(p)}%</span>
          </div>
          <Progress value={projectProgress(p)} />
        </div>
      </Card>

      {/* tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-line pb-px">
        {TABS.map((t) => {
          const count = t === 'Disputes' ? projectDisputes.length : t === 'Amendments' ? p.amendments.length : 0;
          return (
            <button key={t} onClick={() => setTab(t)} className={`tab flex items-center gap-1.5 ${tab === t ? 'tab-active' : ''}`}>
              {t}{count > 0 && <span className="chip bg-white/10 text-white/60 !px-1.5 !py-0">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* content */}
      {tab === 'Overview' && <OverviewTab p={p} />}
      {tab === 'Milestones' && (
        canEdit ? <EditMilestones p={p} /> :
        <MilestonesTab p={p} role={role}
          onStart={(m) => store.startMilestone(p.id, m.id)}
          onSubmit={(m) => setSubmitFor(m)}
          onApprove={(m) => store.approveCompletion(p.id, m.id)}
          onRevise={(m) => setReviseFor(m)}
          onDispute={(m) => setDisputeFor(m)}
          onExtend={(m) => setExtendFor(m)}
          onApproveExtension={(m) => store.approveExtension(p.id, m.id)}
          onTimeout={(m) => store.claimReviewTimeout(p.id, m.id)}
          onScopeApprove={(m) => role === 'implementer' ? store.implementerApproveScope(p.id, m.id) : store.stakeholderApproveScope(p.id, m.id)}
        />
      )}
      {tab === 'Agreement' && <AgreementTab p={p} />}
      {tab === 'Documents' && <DocumentsTab p={p} />}
      {tab === 'Payments' && <PaymentsTab p={p} />}
      {tab === 'Activity' && <ActivityTab p={p} />}
      {tab === 'Disputes' && <DisputesTab p={p} />}
      {tab === 'Amendments' && <AmendmentsTab p={p} onPropose={() => setAmendOpen(true)} />}

      {/* modals */}
      {submitFor && <SubmitModal p={p} m={submitFor} onClose={() => setSubmitFor(null)} />}
      {reviseFor && <ReviseModal p={p} m={reviseFor} onClose={() => setReviseFor(null)} />}
      {disputeFor && <DisputeModal p={p} m={disputeFor} onClose={() => setDisputeFor(null)} />}
      {extendFor && <ExtendModal p={p} m={extendFor} onClose={() => setExtendFor(null)} />}
      {amendOpen && <AmendModal p={p} onClose={() => setAmendOpen(false)} />}
    </div>
  );
}

// ---------------- Primary action (context header button) ----------------
function PrimaryAction({ p, role, onSign, signing, onEditTab }: { p: Project; role: Role; onSign: () => void; signing: boolean; onEditTab: () => void }) {
  const store = useStore();
  const version = p.versions[p.versions.length - 1];
  const signed = version?.signatures.some((s) => s.party === role);

  if (role === 'stakeholder') {
    if (['stakeholder-editing', 'draft'].includes(p.status)) {
      const issues = validateAgreement(p.milestones, p.globalTerms, p.totalBudget);
      return <button onClick={() => store.sendToImplementer(p.id)} disabled={!isValid(issues)} className="btn-primary"><Send size={16} /> Send to Implementer</button>;
    }
    if (p.status === 'changes-requested') return <button onClick={() => store.resendToImplementer(p.id)} className="btn-primary"><Send size={16} /> Re-send updated agreement</button>;
    if (p.status === 'awaiting-signatures' && !signed) return <button onClick={onSign} disabled={signing} className="btn-primary"><PenLine size={16} /> {signing ? 'Signing…' : 'Sign agreement'}</button>;
    if (p.status === 'awaiting-funding') return <button onClick={() => store.fundProject(p.id)} className="btn-primary"><Coins size={16} /> Fund escrow · {money(p.totalBudget)}</button>;
  }
  if (role === 'implementer') {
    if (p.status === 'awaiting-signatures' && !signed) return <button onClick={onSign} disabled={signing} className="btn-primary"><PenLine size={16} /> {signing ? 'Signing…' : 'Sign agreement'}</button>;
    if (p.status === 'awaiting-implementer-review' || p.status === 'changes-requested') return <button onClick={onEditTab} className="btn-primary"><ShieldCheck size={16} /> Review scope</button>;
    const workable = p.milestones.find((m) => ['in-progress', 'revision-requested', 'ready-to-start'].includes(m.status));
    if (p.status === 'active' && workable) return <button onClick={onEditTab} className="btn-primary"><Upload size={16} /> {workable.status === 'ready-to-start' ? 'Start next milestone' : 'Submit work'}</button>;
  }
  if (p.status === 'awaiting-closeout' && (role === 'stakeholder' || role === 'implementer')) {
    const mine = role === 'stakeholder' ? p.closeout?.stakeholderConfirmedAt : p.closeout?.implementerConfirmedAt;
    if (!mine) return <button onClick={() => store.confirmCloseout(p.id, role)} className="btn-primary"><CheckCircle2 size={16} /> Confirm close-out</button>;
    return <Pill className="!bg-sol-green/15 !text-sol-green"><CheckCircle2 size={14} /> You confirmed close-out</Pill>;
  }
  if (signed && p.status === 'awaiting-signatures') return <Pill className="!bg-sol-green/15 !text-sol-green"><CheckCircle2 size={14} /> You signed · awaiting other party</Pill>;
  return null;
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div className="rounded-xl border border-line bg-white/5 p-3"><div className="text-xs text-white/40">{label}</div><div className={`mt-0.5 text-lg font-bold ${accent ?? 'text-white'}`}>{value}</div></div>;
}

// ---------------- Overview ----------------
function OverviewTab({ p }: { p: Project }) {
  const gt = p.globalTerms;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {p.status === 'awaiting-closeout' && <div className="lg:col-span-3"><CloseoutCard p={p} /></div>}
      {p.status === 'completed' && <div className="lg:col-span-3"><CompletionReviewCard p={p} /></div>}
      <Card className="p-5 lg:col-span-2">
        <h3 className="mb-3 font-semibold text-white">Fund allocation</h3>
        <FundBar p={p} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {([['Released', p.funds.released, 'bg-sol-green'], ['Active', p.funds.active, 'bg-sol-blue'], ['Future', p.funds.future, 'bg-white/40'], ['Refundable', p.funds.refundable, 'bg-white/20'], ['Disputed', p.funds.disputed, 'bg-red-400']] as const).map(([l, v, c]) => (
            <div key={l} className="rounded-lg bg-white/5 p-3">
              <div className="flex items-center gap-1.5 text-xs text-white/45"><span className={`h-2 w-2 rounded-full ${c}`} />{l}</div>
              <div className="mt-1 font-semibold text-white">{money(v)}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="mb-3 font-semibold text-white">Key terms</h3>
        <dl className="space-y-2.5 text-sm">
          <Term k="Default review period" v={`${gt.reviewPeriodDays} days`} />
          <Term k="Revisions / milestone" v={String(gt.revisionLimitPerMilestone)} />
          <Term k="Late grace period" v={`${gt.lateSubmissionGraceDays} days`} />
          <Term k="Scope changes" v={gt.scopeChangesRequireBothSignatures ? 'Require both signatures' : 'Single approval'} />
          <Term k="Review timeout" v={titleCase(gt.timeoutOutcome)} />
          <Term k="Partial refunds" v={gt.allowPartialRefunds ? 'Allowed' : 'No'} />
          <Term k="Split disputes" v={gt.allowSplitDisputeResolution ? 'Allowed' : 'No'} />
        </dl>
      </Card>
      <Card className="p-5 lg:col-span-3">
        <h3 className="mb-2 font-semibold text-white">Policies</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div><div className="label">Cancellation policy</div><p className="text-sm text-white/60">{gt.cancellationPolicy}</p></div>
          <div><div className="label">Dispute policy</div><p className="text-sm text-white/60">{gt.disputePolicy}</p></div>
        </div>
      </Card>
    </div>
  );
}
function Term({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between gap-2"><dt className="text-white/45">{k}</dt><dd className="font-medium text-white">{v}</dd></div>;
}
function FundBar({ p }: { p: Project }) {
  const total = p.totalBudget || 1;
  const seg = (v: number, c: string) => <div className={c} style={{ width: `${(v / total) * 100}%` }} />;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
      {seg(p.funds.released, 'bg-sol-green')}
      {seg(p.funds.active, 'bg-sol-blue')}
      {seg(p.funds.disputed, 'bg-red-400')}
      {seg(p.funds.refundable, 'bg-white/25')}
      {seg(p.funds.future, 'bg-white/40')}
    </div>
  );
}

// ---------------- Milestones (edit mode) ----------------
function EditMilestones({ p }: { p: Project }) {
  const store = useStore();
  const [terms, setTerms] = useState(p.globalTerms);
  const issues = validateAgreement(p.milestones, terms, p.totalBudget);
  return (
    <div className="space-y-4">
      <InfoBanner tone="info">Editing mode — refine milestones, then send to the Implementer. Changes here are only a draft until both parties approve.</InfoBanner>
      <MilestoneEditor
        milestones={p.milestones}
        onChange={(m) => store.setMilestones(p.id, m)}
        totalBudget={p.totalBudget}
        globalTerms={terms}
        onTermsChange={(t) => { setTerms(t); store.updateProjectMeta(p.id, { globalTerms: t }); }}
      />
      <div className="flex justify-end gap-2">
        {p.status === 'changes-requested'
          ? <button onClick={() => store.resendToImplementer(p.id)} disabled={!isValid(issues)} className="btn-primary"><Send size={16} /> Re-send to Implementer</button>
          : <button onClick={() => store.sendToImplementer(p.id)} disabled={!isValid(issues)} className="btn-primary"><Send size={16} /> Send to Implementer</button>}
      </div>
    </div>
  );
}

// ---------------- Milestones (view/flow mode) ----------------
interface FlowHandlers {
  onStart: (m: Milestone) => void; onSubmit: (m: Milestone) => void; onApprove: (m: Milestone) => void;
  onRevise: (m: Milestone) => void; onDispute: (m: Milestone) => void; onExtend: (m: Milestone) => void;
  onApproveExtension: (m: Milestone) => void; onTimeout: (m: Milestone) => void; onScopeApprove: (m: Milestone) => void;
}
function MilestonesTab({ p, role, ...h }: { p: Project; role: Role } & FlowHandlers) {
  const store = useStore();
  return (
    <div className="space-y-3">
      {p.milestones.map((m) => (
        <MilestoneCard key={m.id} p={p} m={m} role={role} h={h} onRequestChanges={(note) => store.implementerRequestChanges(p.id, m.id, note)} />
      ))}
    </div>
  );
}

function MilestoneCard({ p, m, role, h, onRequestChanges }: { p: Project; m: Milestone; role: Role; h: FlowHandlers; onRequestChanges: (n: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [note, setNote] = useState('');
  const latest = m.submissions[m.submissions.length - 1];
  const overdue = m.deliveryDeadline && daysUntil(m.deliveryDeadline) < 0 && m.status === 'in-progress';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <button onClick={() => setOpen((o) => !o)} className="flex flex-1 items-start gap-3 text-left">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/8 text-sm font-bold text-white">{m.order}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{m.title}</span>
              <StatusBadge meta={MILESTONE_STATUS[m.status]} />
              {overdue && <Pill className="!bg-red-500/15 !text-red-300"><AlertTriangle size={12} /> Overdue</Pill>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/45">
              <span className="font-medium text-white/70">{money(m.paymentAmount)}</span>
              {m.deliveryDeadline && <span className="flex items-center gap-1"><CalendarClock size={12} /> Due {formatDate(m.deliveryDeadline)}</span>}
              {m.reviewDeadline && ['submitted', 'under-review', 'resubmitted'].includes(m.status) && <span className="flex items-center gap-1"><Clock size={12} /> Review ends {formatDate(m.reviewDeadline)}</span>}
              {m.revisionCount > 0 && <span>Rev {m.revisionCount}/{m.revisionLimit}</span>}
              <span className="flex items-center gap-1">
                <ScopeDot on={m.stakeholderScopeApproved} /> <ScopeDot on={m.implementerScopeApproved} /> scope
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {/* scope approval */}
        {role === 'implementer' && ['awaiting-scope-approval', 'changes-requested'].includes(m.status) && !m.implementerScopeApproved && (
          <>
            <button onClick={() => h.onScopeApprove(m)} className="btn-success !py-2"><CheckCircle2 size={15} /> Approve scope</button>
            <button onClick={() => setReqOpen(true)} className="btn-ghost !py-2"><RotateCcw size={15} /> Request changes</button>
          </>
        )}
        {role === 'stakeholder' && p.status === 'awaiting-final-scope-approval' && m.implementerScopeApproved && !m.stakeholderScopeApproved && (
          <button onClick={() => h.onScopeApprove(m)} className="btn-success !py-2"><CheckCircle2 size={15} /> Confirm scope</button>
        )}
        {/* start */}
        {role === 'implementer' && m.status === 'ready-to-start' && <button onClick={() => h.onStart(m)} className="btn-primary !py-2"><Play size={15} /> Start milestone</button>}
        {/* submit / resubmit */}
        {role === 'implementer' && (m.status === 'in-progress' || m.status === 'revision-requested' || m.status === 'delivery-overdue') && (
          <button onClick={() => h.onSubmit(m)} className="btn-primary !py-2"><Upload size={15} /> {m.status === 'revision-requested' ? 'Submit revision' : 'Submit work'}</button>
        )}
        {role === 'implementer' && (m.status === 'in-progress' || m.status === 'delivery-overdue') && (
          <button onClick={() => h.onExtend(m)} className="btn-ghost !py-2"><CalendarClock size={15} /> Request extension</button>
        )}
        {/* review */}
        {role === 'stakeholder' && ['submitted', 'under-review', 'resubmitted', 'review-expired'].includes(m.status) && (
          <>
            <button onClick={() => h.onApprove(m)} className="btn-success !py-2"><CheckCircle2 size={15} /> Approve & release {money(m.paymentAmount)}</button>
            <button onClick={() => h.onRevise(m)} disabled={m.revisionCount >= m.revisionLimit} className="btn-ghost !py-2"><RotateCcw size={15} /> Request revision</button>
            <button onClick={() => h.onDispute(m)} className="btn-danger !py-2"><Gavel size={15} /> Open dispute</button>
          </>
        )}
        {/* timeout */}
        {role === 'implementer' && ['submitted', 'under-review', 'resubmitted'].includes(m.status) && m.reviewDeadline && daysUntil(m.reviewDeadline) < 0 && (
          <button onClick={() => h.onTimeout(m)} className="btn-ghost !py-2"><Clock size={15} /> Claim review timeout</button>
        )}
        {/* extension approval */}
        {role === 'stakeholder' && m.pendingExtension && (
          <button onClick={() => h.onApproveExtension(m)} className="btn-primary !py-2"><CalendarClock size={15} /> Approve new deadline ({formatDate(m.pendingExtension.newDeadline)})</button>
        )}
      </div>

      {/* expanded */}
      {open && (
        <div className="mt-4 space-y-4 border-t border-line pt-4 text-sm">
          <p className="text-white/60">{m.description}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="label">Deliverables</div>
              <ul className="space-y-1">{m.deliverables.map((d, i) => <li key={i} className="flex gap-2 text-white/70"><span className="text-white/30">•</span> {d}</li>)}</ul>
            </div>
            <div>
              <div className="label">Acceptance criteria</div>
              <ul className="space-y-1">{m.acceptanceCriteria.map((c, i) => <li key={i} className="flex gap-2 text-white/70"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-white/30" /> {c}</li>)}</ul>
            </div>
          </div>
          <div>
            <div className="label">Required evidence</div>
            <div className="flex flex-wrap gap-2">{m.requiredEvidence.map((e, i) => <Pill key={i}>{e.label}</Pill>)}</div>
          </div>
          {m.pendingExtension && (
            <InfoBanner tone="warn">Extension requested to {formatDate(m.pendingExtension.newDeadline)} — {m.pendingExtension.reason} <span className="text-white/50">(impact: {m.pendingExtension.impact})</span></InfoBanner>
          )}
          {m.revisionRequests.length > 0 && (
            <div>
              <div className="label">Revision history</div>
              <div className="space-y-2">
                {m.revisionRequests.map((r) => (
                  <div key={r.number} className="rounded-lg bg-white/5 p-3">
                    <div className="text-white/80">Revision {r.number}: {r.reason}</div>
                    <div className="mt-1 text-xs text-white/45">Failed: {r.failedCriteria.join(', ') || '—'}</div>
                    <div className="text-xs text-white/45">Required: {r.requiredCorrection}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {m.submissions.length > 0 && (
            <div>
              <div className="label">Submissions</div>
              <div className="space-y-2">
                {m.submissions.map((s) => (
                  <div key={s.version} className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">v{s.version} · {s.title}</span>
                      <span className="text-xs text-white/40">{formatDateTime(s.submittedAt)}</span>
                    </div>
                    <p className="mt-1 text-white/60">{s.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.evidenceLinks.map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer" className="chip bg-sol-blue/10 text-sol-blue"><ExternalLink size={12} /> {l.label}</a>)}
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-white/30">hash {shortHash(s.hash, 12)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={reqOpen} onClose={() => setReqOpen(false)} title="Request scope changes">
        <Field label="What should change?"><textarea rows={4} className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe the change you need before approving this milestone." /></Field>
        <p className="mt-2 text-xs text-white/40">This creates a new draft version. Both parties will need to approve again.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setReqOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={() => { onRequestChanges(note); setReqOpen(false); setNote(''); }} disabled={!note.trim()} className="btn-primary">Send request</button>
        </div>
      </Modal>
    </Card>
  );
}
function ScopeDot({ on }: { on: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${on ? 'bg-sol-green' : 'bg-white/20'}`} />;
}

// ---------------- Agreement ----------------
function AgreementTab({ p }: { p: Project }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white/5 px-4 py-3">
        <div className="text-sm text-white/60">Formal contract document — printable and exportable to PDF, with on-chain signatures.</div>
        <button onClick={() => navigate(`/project/${p.id}/contract`)} className="btn-primary !py-2"><FileText size={15} /> View / Print contract</button>
      </div>
      {p.versions.length === 0 && <InfoBanner tone="info">No signed version yet. The agreement is locked and hashed once both parties approve the scope. You can still preview the draft contract above.</InfoBanner>}
      {[...p.versions].reverse().map((v) => (
        <Card key={v.version} className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-sol-purple" />
              <span className="font-semibold text-white">Version {v.version}</span>
              {v.version === p.currentVersion && <Pill className="!bg-sol-green/15 !text-sol-green">Current</Pill>}
            </div>
            <span className="text-xs text-white/40">{formatDateTime(v.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm text-white/50">{v.note}</p>
          <div className="mt-3 rounded-lg bg-white/5 p-3">
            <div className="text-xs text-white/40">Agreement hash</div>
            <div className="mt-0.5 break-all font-mono text-xs text-white/70">{v.hash}</div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(['stakeholder', 'implementer'] as Role[]).map((r) => {
              const sig = v.signatures.find((s) => s.party === r);
              return (
                <div key={r} className={`rounded-lg border p-3 ${sig ? 'border-sol-green/30 bg-sol-green/10' : 'border-line bg-white/5'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    {sig ? <CheckCircle2 size={15} className="text-sol-green" /> : <Clock size={15} className="text-white/40" />}
                    <span className="font-medium text-white">{ROLE_LABEL[r]}</span>
                    <span className="ml-auto text-xs text-white/40">{sig ? formatDate(sig.signedAt) : 'Not signed'}</span>
                  </div>
                  {sig && <div className="mt-1 font-mono text-[10px] text-white/35">{sig.wallet.slice(0, 10)}… · sig {shortHash(sig.signature, 10)}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Documents ----------------
function DocumentsTab({ p }: { p: Project }) {
  return (
    <div className="space-y-3">
      {p.documents.map((d) => (
        <Card key={d.id} className="p-5">
          <div className="flex items-center gap-2"><FileText size={16} className="text-white/50" /><span className="font-semibold text-white">{d.label}</span><Pill>{d.kind}</Pill></div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-white/60">{d.content}</p>
          <div className="mt-2 font-mono text-[10px] text-white/30">hash {shortHash(d.hash, 12)}</div>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Payments ----------------
function PaymentsTab({ p }: { p: Project }) {
  const txs = useStore((s) => s.transactions.filter((t) => t.projectId === p.id));
  if (txs.length === 0) return <InfoBanner tone="info">No transactions yet. Funding and milestone releases will appear here.</InfoBanner>;
  return (
    <div className="space-y-2">
      {txs.map((t) => (
        <Card key={t.id} className="flex items-center gap-4 p-4">
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${t.kind === 'funding' ? 'bg-sol-blue/15 text-sol-blue' : t.kind === 'refund' ? 'bg-white/10 text-white/60' : 'bg-sol-green/15 text-sol-green'}`}><Coins size={16} /></span>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white">{titleCase(t.kind)}</div>
            <div className="truncate font-mono text-xs text-white/40">{t.from.slice(0, 8)}… → {t.to.slice(0, 8)}…</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-white">{money(t.amount, t.currency)}</div>
            <a href={explorerTx(t.id)} target="_blank" rel="noreferrer" className="flex items-center justify-end gap-1 text-xs text-sol-blue hover:underline">explorer <ExternalLink size={11} /></a>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Activity ----------------
function ActivityTab({ p }: { p: Project }) {
  const acts = useStore((s) => s.activity.filter((a) => a.projectId === p.id));
  return (
    <div className="relative space-y-1 pl-4">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-white/10" />
      {acts.map((a) => (
        <div key={a.id} className="relative flex gap-3 py-2">
          <span className="absolute -left-[9px] top-3.5 h-2 w-2 rounded-full bg-sol-purple ring-4 ring-ink-950" />
          <div className="pl-3">
            <div className="text-sm text-white"><span className="font-medium">{ROLE_LABEL[a.actor]}</span> · {a.action}</div>
            {a.detail && <div className="text-xs text-white/50">{a.detail}</div>}
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/30">
              <span>{formatDateTime(a.at)}</span>
              {a.version && <span>v{a.version}</span>}
              {a.txId && <a href={explorerTx(a.txId)} target="_blank" rel="noreferrer" className="text-sol-blue hover:underline">tx</a>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Disputes tab (project scoped) ----------------
function DisputesTab({ p }: { p: Project }) {
  const disputes = useStore((s) => s.disputes.filter((d) => d.projectId === p.id));
  const navigate = useNavigate();
  if (disputes.length === 0) return <InfoBanner tone="info">No disputes on this project.</InfoBanner>;
  return (
    <div className="space-y-3">
      {disputes.map((d) => {
        const m = p.milestones.find((x) => x.id === d.milestoneId);
        return (
          <Card key={d.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Gavel size={16} className="text-red-300" /><span className="font-semibold text-white">{m?.title}</span></div>
              <Pill className={d.status === 'resolved' ? '!bg-sol-green/15 !text-sol-green' : '!bg-red-500/15 !text-red-300'}>{titleCase(d.status)}</Pill>
            </div>
            <p className="mt-2 text-sm text-white/60">{d.stakeholderClaim}</p>
            <div className="mt-2 text-sm text-white/70">Amount in dispute: <span className="font-semibold text-white">{money(d.amount)}</span></div>
            <button onClick={() => navigate('/disputes')} className="btn-ghost mt-3 !py-2">Open dispute center</button>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------- Amendments ----------------
function AmendmentsTab({ p, onPropose }: { p: Project; onPropose: () => void }) {
  const store = useStore();
  const role = store.currentRole;
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={onPropose} className="btn-ghost"><FilePlus2 size={16} /> Propose amendment</button>
      </div>
      {p.amendments.length === 0 ? <InfoBanner tone="info">No amendments. After signing, any scope change goes through a formal amendment both parties sign.</InfoBanner> : p.amendments.map((a) => (
        <Card key={a.id} className="p-5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">{a.reason}</span>
            <Pill className={a.status === 'approved' ? '!bg-sol-green/15 !text-sol-green' : a.status === 'rejected' ? '!bg-red-500/15 !text-red-300' : '!bg-amber-400/15 !text-amber-300'}>{titleCase(a.status)}</Pill>
          </div>
          <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
            <div><div className="label">Was</div><p className="text-white/60">{a.oldWording || '—'}</p></div>
            <div><div className="label">Becomes</div><p className="text-white/60">{a.newWording || '—'}</p></div>
          </div>
          <div className="mt-2 flex gap-4 text-sm text-white/60">
            <span>Payment Δ: <span className={a.paymentDifference >= 0 ? 'text-sol-green' : 'text-red-300'}>{a.paymentDifference >= 0 ? '+' : ''}{money(a.paymentDifference)}</span></span>
            <span>Deadline Δ: {a.deadlineDifferenceDays} days</span>
          </div>
          {a.status === 'proposed' && a.proposedBy !== role && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => store.decideAmendment(p.id, a.id, 'approved')} className="btn-success !py-2"><CheckCircle2 size={15} /> Approve & sign</button>
              <button onClick={() => store.decideAmendment(p.id, a.id, 'rejected')} className="btn-danger !py-2"><XCircle size={15} /> Reject</button>
            </div>
          )}
          {a.status === 'proposed' && a.proposedBy === role && <div className="mt-3 text-xs text-white/40">Awaiting the other party’s decision.</div>}
        </Card>
      ))}
    </div>
  );
}

// ---------------- Modals ----------------
function SubmitModal({ p, m, onClose }: { p: Project; m: Milestone; onClose: () => void }) {
  const store = useStore();
  const [title, setTitle] = useState(m.status === 'revision-requested' ? `${m.title} (revised)` : `${m.title} — delivered`);
  const [summary, setSummary] = useState('');
  const [checklist, setChecklist] = useState(m.deliverables.map((d) => ({ label: d, done: false })));
  const [links, setLinks] = useState(m.requiredEvidence.map((e) => ({ label: e.label, url: '' })));
  const [confirmed, setConfirmed] = useState(false);
  const ready = confirmed && summary.trim() && checklist.every((c) => c.done);
  return (
    <Modal open onClose={onClose} title={m.status === 'revision-requested' ? 'Submit revision' : 'Submit milestone'} wide>
      <div className="space-y-4">
        <Field label="Submission title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Completion summary"><textarea rows={3} className="input" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summarize what was delivered and how it meets the acceptance criteria." /></Field>
        <div>
          <div className="label">Deliverable checklist</div>
          <div className="space-y-1.5">
            {checklist.map((c, i) => (
              <label key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70">
                <input type="checkbox" checked={c.done} onChange={(e) => setChecklist(checklist.map((x, k) => k === i ? { ...x, done: e.target.checked } : x))} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="label">Evidence links</div>
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input className="input w-1/3" value={l.label} onChange={(e) => setLinks(links.map((x, k) => k === i ? { ...x, label: e.target.value } : x))} />
                <input className="input flex-1" placeholder="https://…" value={l.url} onChange={(e) => setLinks(links.map((x, k) => k === i ? { ...x, url: e.target.value } : x))} />
              </div>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-2 rounded-lg border border-line bg-white/5 p-3 text-sm text-white/70">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
          I confirm that this submission is the completed result for the currently locked milestone requirements.
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button disabled={!ready} onClick={() => {
            store.submitMilestone(p.id, m.id, { title, summary, checklist, evidenceLinks: links.filter((l) => l.url.trim()), });
            onClose();
          }} className="btn-primary"><Upload size={16} /> Submit</button>
        </div>
      </div>
    </Modal>
  );
}

function ReviseModal({ p, m, onClose }: { p: Project; m: Milestone; onClose: () => void }) {
  const store = useStore();
  const [reason, setReason] = useState('');
  const [failed, setFailed] = useState<string[]>([]);
  const [correction, setCorrection] = useState('');
  return (
    <Modal open onClose={onClose} title="Request revision">
      <InfoBanner tone="warn">A revision must reference existing acceptance criteria — it cannot add new scope.</InfoBanner>
      <div className="mt-4 space-y-4">
        <div>
          <div className="label">Which acceptance criteria are not satisfied?</div>
          <div className="space-y-1.5">
            {m.acceptanceCriteria.map((c, i) => (
              <label key={i} className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70">
                <input type="checkbox" checked={failed.includes(c)} onChange={(e) => setFailed(e.target.checked ? [...failed, c] : failed.filter((x) => x !== c))} className="mt-0.5" />
                {c}
              </label>
            ))}
          </div>
        </div>
        <Field label="Reason"><textarea rows={2} className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Field label="Required correction"><textarea rows={2} className="input" value={correction} onChange={(e) => setCorrection(e.target.value)} /></Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button disabled={!reason.trim() || failed.length === 0} onClick={() => { store.requestRevision(p.id, m.id, { reason, failedCriteria: failed, requiredCorrection: correction }); onClose(); }} className="btn-primary"><RotateCcw size={16} /> Request revision</button>
        </div>
      </div>
    </Modal>
  );
}

function DisputeModal({ p, m, onClose }: { p: Project; m: Milestone; onClose: () => void }) {
  const store = useStore();
  const [claim, setClaim] = useState('');
  return (
    <Modal open onClose={onClose} title="Open a dispute">
      <InfoBanner tone="danger">Opening a dispute locks {money(m.paymentAmount)} until an Arbiter resolves it. Use this when revisions cannot resolve the issue.</InfoBanner>
      <div className="mt-4 space-y-4">
        <Field label="Describe your claim"><textarea rows={4} className="input" value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="Explain which locked requirements are not met and why revision is not sufficient." /></Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button disabled={!claim.trim()} onClick={() => { store.openDispute(p.id, m.id, claim); onClose(); }} className="btn-danger"><Gavel size={16} /> Open dispute</button>
        </div>
      </div>
    </Modal>
  );
}

function ExtendModal({ p, m, onClose }: { p: Project; m: Milestone; onClose: () => void }) {
  const store = useStore();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [impact, setImpact] = useState('');
  return (
    <Modal open onClose={onClose} title="Request deadline extension">
      <div className="space-y-4">
        <Field label="New proposed deadline"><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Reason"><textarea rows={2} className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Field label="Impact on future milestones"><textarea rows={2} className="input" value={impact} onChange={(e) => setImpact(e.target.value)} /></Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button disabled={!date || !reason.trim()} onClick={() => { store.requestExtension(p.id, m.id, { newDeadline: new Date(date).toISOString(), reason, impact }); onClose(); }} className="btn-primary"><CalendarClock size={16} /> Request extension</button>
        </div>
      </div>
    </Modal>
  );
}

function AmendModal({ p, onClose }: { p: Project; onClose: () => void }) {
  const store = useStore();
  const [reason, setReason] = useState('');
  const [affected, setAffected] = useState<string[]>([]);
  const [oldW, setOldW] = useState('');
  const [newW, setNewW] = useState('');
  const [pay, setPay] = useState(0);
  const [days, setDays] = useState(0);
  return (
    <Modal open onClose={onClose} title="Propose amendment" wide>
      <div className="space-y-4">
        <Field label="Reason for change"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <div>
          <div className="label">Affected milestones</div>
          <div className="flex flex-wrap gap-2">
            {p.milestones.map((m) => {
              const on = affected.includes(m.id);
              return <button key={m.id} onClick={() => setAffected(on ? affected.filter((x) => x !== m.id) : [...affected, m.id])} className={`chip ${on ? 'bg-sol-purple/20 text-sol-purple' : 'bg-white/8 text-white/50'}`}>{m.title}</button>;
            })}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Old wording"><textarea rows={2} className="input" value={oldW} onChange={(e) => setOldW(e.target.value)} /></Field>
          <Field label="New wording"><textarea rows={2} className="input" value={newW} onChange={(e) => setNewW(e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Payment difference (USDC)"><input type="number" className="input" value={pay} onChange={(e) => setPay(Number(e.target.value))} /></Field>
          <Field label="Deadline difference (days)"><input type="number" className="input" value={days} onChange={(e) => setDays(Number(e.target.value))} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button disabled={!reason.trim()} onClick={() => { store.proposeAmendment(p.id, { reason, affectedMilestones: affected, oldWording: oldW, newWording: newW, paymentDifference: pay, deadlineDifferenceDays: days }); onClose(); }} className="btn-primary"><FilePlus2 size={16} /> Propose</button>
        </div>
      </div>
    </Modal>
  );
}

function CompletionReviewCard({ p }: { p: Project }) {
  const role = useStore((s) => s.currentRole);
  const { reviews, addReview } = useProfile();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  if (role === 'arbiter') return null;
  const otherRole: Role = role === 'stakeholder' ? 'implementer' : 'stakeholder';
  const otherName = otherRole === 'stakeholder' ? p.stakeholder.name : p.implementer?.name ?? 'Counterparty';
  const myName = role === 'stakeholder' ? p.stakeholder.name : p.implementer?.name ?? 'Me';
  const mine = reviews.find((r) => r.projectId === p.id && r.fromRole === role);

  return (
    <Card className="border-sol-green/25 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-sol-green">
        <Sparkles size={16} /> Contract completed — both parties earned +1 aura
      </div>
      {mine ? (
        <div className="mt-3 rounded-xl border border-line bg-white/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Your review of {otherName}</span>
            <span className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={13} className={i <= mine.rating ? 'fill-amber-300 text-amber-300' : 'text-white/20'} />
              ))}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-white/70">{mine.comment}</p>
        </div>
      ) : (
        <div className="mt-3">
          <div className="mb-2 text-sm text-white/60">Leave a review for <span className="font-medium text-white">{otherName}</span> — it will appear on their profile.</div>
          <div className="mb-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => setRating(i)} className="p-0.5">
                <Star size={20} className={i <= rating ? 'fill-amber-300 text-amber-300' : 'text-white/25 hover:text-white/50'} />
              </button>
            ))}
          </div>
          <textarea className="input min-h-[70px]" placeholder="How was the collaboration?" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button
            onClick={() => addReview({ projectId: p.id, projectTitle: p.title, fromRole: role, fromName: myName, toRole: otherRole, rating, comment: comment.trim() || 'Great collaboration.' })}
            className="btn-primary mt-2 !py-2"
          >
            Submit review
          </button>
        </div>
      )}
    </Card>
  );
}

function CloseoutCard({ p }: { p: Project }) {
  const store = useStore();
  const role = store.currentRole;
  const rows: { r: Role; name: string; at?: string }[] = [
    { r: 'stakeholder', name: p.stakeholder.name, at: p.closeout?.stakeholderConfirmedAt },
    { r: 'implementer', name: p.implementer?.name ?? 'Implementer', at: p.closeout?.implementerConfirmedAt },
  ];
  const mine = rows.find((x) => x.r === role);
  return (
    <Card className="border-sol-blue/25 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-sol-blue">
        <CheckCircle2 size={16} /> Final step - project close-out
      </div>
      <p className="mt-1.5 text-sm text-white/55">
        All milestones are settled. Both parties now submit their final confirmation. When both confirm,
        the project is marked completed and each side earns +1 aura.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map((x) => (
          <div key={x.r} className={`flex items-center gap-3 rounded-xl border p-3.5 ${x.at ? 'border-sol-green/25 bg-sol-green/5' : 'border-line bg-white/5'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${x.at ? 'bg-sol-green' : 'bg-white/25'}`} />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{x.name} <span className="text-white/40">- {titleCase(x.r)}</span></div>
              <div className="text-xs text-white/45">{x.at ? `Confirmed ${formatDateTime(x.at)}` : 'Waiting for confirmation'}</div>
            </div>
            {x.r === role && !x.at && (
              <button onClick={() => store.confirmCloseout(p.id, role)} className="btn-primary !px-3 !py-1.5 !text-xs">Confirm</button>
            )}
          </div>
        ))}
      </div>
      {mine?.at && <div className="mt-3 text-xs text-white/45">You have confirmed. Waiting for the other party to submit their confirmation.</div>}
    </Card>
  );
}
