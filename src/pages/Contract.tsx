import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { money, formatDate, formatDateTime, titleCase } from '../lib/format';
import type { AgreementVersion, Milestone, Party, Project } from '../types';
import { ArrowLeft, Printer, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export function Contract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = useStore((s) => s.projects.find((p) => p.id === id));

  if (!project) {
    return <div className="grid min-h-screen place-items-center bg-black text-white/60">Project not found.</div>;
  }
  const p = project;
  const version: AgreementVersion | undefined = p.versions[p.versions.length - 1];

  // Use the signed snapshot when available; otherwise preview the live draft.
  const milestones = version ? version.snapshot.milestones : p.milestones;
  const terms = version ? version.snapshot.globalTerms : p.globalTerms;
  const budget = version ? version.snapshot.totalBudget : p.totalBudget;

  const sigOf = (role: 'stakeholder' | 'implementer' | 'arbiter') => version?.signatures.find((s) => s.party === role);
  const fullyExecuted = !!sigOf('stakeholder') && !!sigOf('implementer');

  return (
    <div className="min-h-screen bg-black py-8 print:bg-white print:py-0">
      {/* toolbar (hidden when printing) */}
      <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-between px-4 print:hidden">
        <button onClick={() => navigate(`/project/${p.id}`)} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
          <ArrowLeft size={15} /> Back to project
        </button>
        <div className="flex items-center gap-2">
          {!version && <span className="chip bg-amber-400/15 text-amber-300 border border-amber-400/30">Draft — not yet signed</span>}
          <button onClick={() => window.print()} className="btn-primary !py-2"><Printer size={16} /> Print / Save as PDF</button>
        </div>
      </div>

      {/* the paper */}
      <article className="contract-paper mx-auto max-w-[820px] bg-white px-14 py-16 text-[#1a1a2e] shadow-2xl print:max-w-none print:shadow-none">
        {/* letterhead */}
        <header className="flex items-start justify-between border-b-2 border-[#1a1a2e] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-[#1a1a2e] font-black text-white">D</span>
              <span className="text-2xl font-extrabold tracking-tight">DRIU</span>
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#555]">Milestone Escrow Agreement</div>
          </div>
          <div className="text-right text-xs text-[#555]">
            <div>Agreement No.</div>
            <div className="font-mono font-semibold text-[#1a1a2e]">{p.id.toUpperCase()}</div>
            <div className="mt-1">Version {version?.version ?? '—'} · {p.currency}</div>
          </div>
        </header>

        {/* title */}
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold">Milestone-Based Product Development &amp; Escrow Agreement</h1>
          <p className="mt-1 text-sm text-[#555]">for the project titled “{p.title}”</p>
          {fullyExecuted ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#0a7d4f] bg-[#e7fff4] px-3 py-1 text-xs font-semibold text-[#0a7d4f]">
              <ShieldCheck size={13} /> Fully executed &amp; on-chain
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#a86500] bg-[#fff7e6] px-3 py-1 text-xs font-semibold text-[#a86500]">
              <Clock size={13} /> Pending signatures
            </div>
          )}
        </div>

        {/* preamble */}
        <Section n="1" title="Parties">
          <p className="mb-3">
            This Agreement is entered into {version ? `on ${formatDate(version.createdAt)}` : 'upon full execution'} by and between the following parties, and is
            secured by an on-chain escrow arrangement on the Solana network (devnet):
          </p>
          <PartyBlock role="Stakeholder (the “Client”)" party={p.stakeholder} />
          {p.implementer && <PartyBlock role="Implementer (the “Provider”)" party={p.implementer} />}
          {p.arbiter && <PartyBlock role="Arbiter (dispute resolver)" party={p.arbiter} />}
        </Section>

        {/* recitals */}
        <Section n="2" title="Purpose &amp; Scope">
          <p className="mb-2">{p.summary}</p>
          <table className="w-full text-sm">
            <tbody>
              <Row k="Product category" v={p.category} />
              <Row k="Total contract value" v={money(budget, p.currency)} />
              <Row k="Estimated duration" v={`${p.estimatedDurationDays} days`} />
              {p.desiredStartDate && <Row k="Intended start" v={formatDate(p.desiredStartDate)} />}
              {p.desiredCompletionDate && <Row k="Target completion" v={formatDate(p.desiredCompletionDate)} />}
              <Row k="Confidential" v={p.confidential ? 'Yes' : 'No'} />
              <Row k="Number of milestones" v={String(milestones.length)} />
            </tbody>
          </table>
        </Section>

        {/* escrow */}
        <Section n="3" title="Escrow &amp; Payment">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            <li>The Client shall deposit the full contract value of <strong>{money(budget, p.currency)}</strong> into escrow before any work begins.</li>
            <li>Funds are released to the Provider on a per-milestone basis, only upon the Client’s approval of the corresponding deliverable.</li>
            <li>All remaining funds stay locked in escrow until each milestone is completed, cancelled, refunded, or resolved by the Arbiter.</li>
            <li>Neither party may unilaterally withdraw funds committed to an active, approved milestone except as permitted by the cancellation or dispute terms herein.</li>
          </ol>
        </Section>

        {/* milestone schedule */}
        <Section n="4" title="Milestone Schedule">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[#1a1a2e] text-left">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Milestone</th>
                <th className="py-2 pr-2 text-right">Payment</th>
                <th className="py-2 pr-2 text-right">Days</th>
                <th className="py-2 text-right">Review</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id} className="border-b border-[#ddd] align-top">
                  <td className="py-2 pr-2 font-semibold">{m.order}</td>
                  <td className="py-2 pr-2">
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-[#555]">{m.description}</div>
                  </td>
                  <td className="py-2 pr-2 text-right font-semibold">{money(m.paymentAmount, p.currency)}</td>
                  <td className="py-2 pr-2 text-right">{m.durationDays}</td>
                  <td className="py-2 text-right">{m.reviewPeriodDays}d</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#1a1a2e]">
                <td colSpan={2} className="py-2 font-bold">Total</td>
                <td className="py-2 pr-2 text-right font-bold">{money(milestones.reduce((a, m) => a + m.paymentAmount, 0), p.currency)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* per-milestone acceptance criteria */}
        <Section n="5" title="Deliverables &amp; Acceptance Criteria">
          <div className="space-y-4">
            {milestones.map((m) => (
              <MilestoneDetail key={m.id} m={m} />
            ))}
          </div>
        </Section>

        {/* general terms */}
        <Section n="6" title="General Terms">
          <table className="w-full text-sm">
            <tbody>
              <Row k="Default review period" v={`${terms.reviewPeriodDays} days`} />
              <Row k="Revisions per milestone" v={String(terms.revisionLimitPerMilestone)} />
              <Row k="Late submission grace period" v={`${terms.lateSubmissionGraceDays} days`} />
              <Row k="Scope changes" v={terms.scopeChangesRequireBothSignatures ? 'Require both parties’ signatures' : 'Single approval'} />
              <Row k="Partial refunds" v={terms.allowPartialRefunds ? 'Permitted' : 'Not permitted'} />
              <Row k="Split dispute resolution" v={terms.allowSplitDisputeResolution ? 'Permitted' : 'Not permitted'} />
              <Row k="Review-timeout outcome" v={titleCase(terms.timeoutOutcome)} />
            </tbody>
          </table>
        </Section>

        <Section n="7" title="Cancellation">
          <p className="text-sm">{terms.cancellationPolicy}</p>
        </Section>

        <Section n="8" title="Disputes">
          <p className="text-sm">{terms.disputePolicy}</p>
          <p className="mt-2 text-sm">
            The platform enforces payment and approval rules but does not adjudicate subjective quality. Disagreements are resolved
            through revision, timeout, cancellation, or Arbiter decision as set out above.
          </p>
        </Section>

        {/* blockchain fingerprint */}
        <Section n="9" title="Integrity &amp; Immutability">
          <p className="mb-2 text-sm">
            This Agreement is represented by a deterministic content hash. Any modification to the terms above produces a new version
            with a new hash and requires re-signature by both parties. Prior signed versions are retained and cannot be overwritten.
          </p>
          <div className="rounded-md border border-[#ccc] bg-[#f7f7fb] p-3">
            <div className="text-[10px] uppercase tracking-wide text-[#777]">Agreement hash (version {version?.version ?? '—'})</div>
            <div className="mt-1 break-all font-mono text-xs">{version?.hash ?? '— not generated until scope is approved —'}</div>
          </div>
        </Section>

        {/* signatures */}
        <Section n="10" title="Signatures">
          <p className="mb-4 text-sm">
            By signing below with their Solana wallet, each party cryptographically attests to the exact terms and hash of this
            Agreement version. Wallet message signatures constitute binding acceptance.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <SignatureBlock role="stakeholder" label="Stakeholder" party={p.stakeholder} sig={sigOf('stakeholder')} />
            {p.implementer && <SignatureBlock role="implementer" label="Implementer" party={p.implementer} sig={sigOf('implementer')} />}
          </div>
          {p.arbiter && (
            <div className="mt-6 border-t border-[#ddd] pt-4">
              <p className="mb-3 text-xs text-[#555]">Acknowledged by the appointed Arbiter for dispute-resolution authority:</p>
              <div className="grid grid-cols-2 gap-6">
                <SignatureBlock role="arbiter" label="Arbiter" party={p.arbiter} sig={sigOf('arbiter')} />
              </div>
            </div>
          )}
        </Section>

        <footer className="mt-10 border-t border-[#ddd] pt-4 text-center text-[10px] text-[#999]">
          Generated by DRIU · {formatDateTime(new Date().toISOString())} · This document reflects the recorded on-chain agreement state and is provided for reference. Devnet demo.
        </footer>
      </article>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">
        <span className="mr-2 text-[#888]">{n}.</span>
        <span dangerouslySetInnerHTML={{ __html: title }} />
      </h2>
      <div className="leading-relaxed text-[#333]">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-[#eee]">
      <td className="py-1.5 pr-4 text-[#666]">{k}</td>
      <td className="py-1.5 text-right font-medium">{v}</td>
    </tr>
  );
}

function PartyBlock({ role, party }: { role: string; party: Party }) {
  return (
    <div className="mb-3 rounded-md border border-[#ddd] p-3">
      <div className="text-[10px] uppercase tracking-wide text-[#888]">{role}</div>
      <div className="mt-0.5 font-semibold">{party.name}{party.org ? `, ${party.org}` : ''}</div>
      {party.email && <div className="text-sm text-[#555]">{party.email}</div>}
      <div className="mt-1 font-mono text-[11px] text-[#555]">Wallet: {party.wallet}</div>
    </div>
  );
}

function MilestoneDetail({ m }: { m: Milestone }) {
  return (
    <div className="break-inside-avoid rounded-md border border-[#e2e2e8] p-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{m.order}. {m.title}</div>
        <div className="text-sm font-semibold">{money(m.paymentAmount)}</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[#888]">Deliverables</div>
          <ul className="mt-1 list-disc pl-4 text-[#333]">{m.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[#888]">Acceptance criteria</div>
          <ul className="mt-1 list-disc pl-4 text-[#333]">{m.acceptanceCriteria.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      </div>
      <div className="mt-2 text-xs text-[#666]">
        Required evidence: {m.requiredEvidence.map((e) => e.label).join(', ') || '—'} · Review period {m.reviewPeriodDays} days · Revision limit {m.revisionLimit}
      </div>
    </div>
  );
}

function SignatureBlock({ role, label, party, sig }: { role: string; label: string; party: Party; sig?: { wallet: string; signature: string; signedAt: string } }) {
  return (
    <div>
      <div className="flex h-16 items-end border-b-2 border-[#1a1a2e] pb-1">
        {sig ? (
          <span className="font-mono text-lg italic text-[#0a7d4f]">✓ signed on-chain</span>
        ) : (
          <span className="text-sm italic text-[#bbb]">awaiting signature</span>
        )}
      </div>
      <div className="mt-1.5 text-xs">
        <div className="flex items-center gap-1 font-semibold">
          {sig && <CheckCircle2 size={12} className="text-[#0a7d4f]" />}
          {label}: {party.name}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-[#666]">Wallet: {sig?.wallet ?? party.wallet}</div>
        {sig && (
          <>
            <div className="font-mono text-[10px] text-[#666]">Signature: {sig.signature.slice(0, 40)}…</div>
            <div className="text-[10px] text-[#888]">Signed {formatDateTime(sig.signedAt)}</div>
          </>
        )}
      </div>
    </div>
  );
}
