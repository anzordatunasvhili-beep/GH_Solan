import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, EmptyState, Pill, Field, InfoBanner, Modal } from '../components/ui';
import { money, formatDateTime, titleCase, formatDate } from '../lib/format';
import type { Dispute, DisputeOutcome, Project } from '../types';
import { Gavel, ShieldCheck, Upload, CheckCircle2 } from 'lucide-react';
import { ROLE_LABEL } from '../lib/statuses';

export function Disputes() {
  const { disputes, projects, currentRole } = useStore();
  if (disputes.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-2xl font-bold text-white">Disputes</h1>
        <EmptyState icon={<Gavel size={36} />} title="No disputes" body="Disputes appear here when a milestone submission is contested. An Arbiter resolves them by release, refund, split, revision, or cancellation." />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Dispute center</h1>
        <p className="text-sm text-white/45">Viewing as {ROLE_LABEL[currentRole]}</p>
      </div>
      {disputes.map((d) => {
        const p = projects.find((x) => x.id === d.projectId);
        if (!p) return null;
        return <DisputeCard key={d.id} d={d} p={p} />;
      })}
    </div>
  );
}

function DisputeCard({ d, p }: { d: Dispute; p: Project }) {
  const store = useStore();
  const role = store.currentRole;
  const m = p.milestones.find((x) => x.id === d.milestoneId)!;
  const latest = m.submissions[m.submissions.length - 1];
  const [resolveOpen, setResolveOpen] = useState(false);
  const [evOpen, setEvOpen] = useState(false);
  const [response, setResponse] = useState('');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gavel size={18} className="text-red-300" />
          <span className="font-semibold text-white">{m.title}</span>
          <Pill>{p.title}</Pill>
        </div>
        <Pill className={d.status === 'resolved' ? '!bg-sol-green/15 !text-sol-green' : '!bg-red-500/15 !text-red-300'}>{titleCase(d.status)}</Pill>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white/5 p-4">
          <div className="label">Locked requirements (v{d.lockedMilestoneVersion})</div>
          <ul className="space-y-1 text-sm text-white/70">{m.acceptanceCriteria.map((c, i) => <li key={i}>• {c}</li>)}</ul>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="label">Amount in dispute</div>
          <div className="text-2xl font-bold text-white">{money(d.amount)}</div>
          <div className="mt-1 text-xs text-white/40">Locked until resolution · evidence deadline {formatDate(d.evidenceDeadline)}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Claim who="Stakeholder claim" text={d.stakeholderClaim} />
        {d.implementerResponse && <Claim who="Implementer response" text={d.implementerResponse} />}
        {latest && (
          <div className="rounded-lg border border-line p-3">
            <div className="label">Latest submission (v{latest.version})</div>
            <p className="text-sm text-white/70">{latest.summary}</p>
          </div>
        )}
        {d.evidence.length > 0 && (
          <div>
            <div className="label">Evidence</div>
            <div className="space-y-1.5">
              {d.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <Pill>{ROLE_LABEL[e.by]}</Pill>
                  <span className="text-white/70">{e.label}</span>
                  {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-sol-blue hover:underline">link</a>}
                  <span className="ml-auto text-[10px] text-white/30">{formatDateTime(e.at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {d.status === 'resolved' && d.resolution && (
        <InfoBanner tone="success">
          <div className="font-semibold">Resolved · {titleCase(d.resolution.outcome)}</div>
          <div className="mt-1">Implementer: {money(d.resolution.implementerAmount)} · Stakeholder refund: {money(d.resolution.stakeholderAmount)}</div>
          <div className="mt-1 text-white/70">{d.resolution.explanation}</div>
        </InfoBanner>
      )}

      {d.status !== 'resolved' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(role === 'stakeholder' || role === 'implementer') && <button onClick={() => setEvOpen(true)} className="btn-ghost !py-2"><Upload size={15} /> Add evidence</button>}
          {role === 'implementer' && !d.implementerResponse && (
            <div className="flex w-full gap-2">
              <input className="input" value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Respond to the claim…" />
              <button disabled={!response.trim()} onClick={() => { store.respondDispute(d.id, response); setResponse(''); }} className="btn-primary shrink-0">Respond</button>
            </div>
          )}
          {role === 'arbiter' && <button onClick={() => setResolveOpen(true)} className="btn-primary !py-2"><ShieldCheck size={15} /> Resolve dispute</button>}
          {role === 'arbiter' && <span className="self-center text-xs text-white/40">As Arbiter you may release, refund, split, return to revision, or cancel.</span>}
        </div>
      )}

      {evOpen && <EvidenceModal d={d} onClose={() => setEvOpen(false)} />}
      {resolveOpen && <ResolveModal d={d} onClose={() => setResolveOpen(false)} />}
    </Card>
  );
}

function Claim({ who, text }: { who: string; text: string }) {
  return <div className="rounded-lg border border-line p-3"><div className="label">{who}</div><p className="text-sm text-white/70">{text}</p></div>;
}

function EvidenceModal({ d, onClose }: { d: Dispute; onClose: () => void }) {
  const store = useStore();
  const role = store.currentRole as 'stakeholder' | 'implementer';
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  return (
    <Modal open onClose={onClose} title="Submit evidence">
      <div className="space-y-4">
        <Field label="Label"><input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Screen recording of failing flow" /></Field>
        <Field label="Link (optional)"><input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></Field>
        <Field label="Note"><textarea rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button disabled={!label.trim()} onClick={() => { store.addDisputeEvidence(d.id, { by: role, label, url: url || undefined, note }); onClose(); }} className="btn-primary">Submit evidence</button>
        </div>
      </div>
    </Modal>
  );
}

function ResolveModal({ d, onClose }: { d: Dispute; onClose: () => void }) {
  const store = useStore();
  const [outcome, setOutcome] = useState<DisputeOutcome>('split');
  const [impPct, setImpPct] = useState(50);
  const [explanation, setExplanation] = useState('');

  const impAmount = outcome === 'release-to-implementer' ? d.amount : outcome === 'refund-to-stakeholder' ? 0 : outcome === 'split' ? Math.round((d.amount * impPct) / 100) : 0;
  const stkAmount = outcome === 'refund-to-stakeholder' ? d.amount : outcome === 'split' ? d.amount - impAmount : 0;

  return (
    <Modal open onClose={onClose} title="Resolve dispute" wide>
      <div className="space-y-4">
        <div>
          <div className="label">Outcome</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ['release-to-implementer', 'Release all to Implementer'],
              ['refund-to-stakeholder', 'Refund all to Stakeholder'],
              ['split', 'Split between both'],
              ['return-to-revision', 'Return to revision'],
              ['cancel-milestone', 'Cancel milestone'],
            ] as [DisputeOutcome, string][]).map(([val, lab]) => (
              <button key={val} onClick={() => setOutcome(val)} className={`rounded-xl border px-4 py-3 text-left text-sm ${outcome === val ? 'border-sol-purple bg-sol-purple/15 text-white' : 'border-line bg-white/5 text-white/60'}`}>
                {outcome === val && <CheckCircle2 size={14} className="mb-1 text-sol-purple" />}{lab}
              </button>
            ))}
          </div>
        </div>
        {outcome === 'split' && (
          <div>
            <div className="label">Split — Implementer share: {impPct}%</div>
            <input type="range" min={0} max={100} value={impPct} onChange={(e) => setImpPct(Number(e.target.value))} className="w-full" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-white/5 p-3 text-sm">
          <div>Implementer receives <div className="text-lg font-bold text-sol-green">{money(impAmount)}</div></div>
          <div>Stakeholder refund <div className="text-lg font-bold text-white">{money(stkAmount)}</div></div>
        </div>
        <Field label="Written resolution explanation"><textarea rows={3} className="input" value={explanation} onChange={(e) => setExplanation(e.target.value)} /></Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button disabled={!explanation.trim()} onClick={() => { store.resolveDispute(d.id, outcome, impAmount, stkAmount, explanation); onClose(); }} className="btn-primary"><ShieldCheck size={16} /> Resolve & settle</button>
        </div>
      </div>
    </Modal>
  );
}
