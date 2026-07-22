import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MilestoneEditor } from '../components/MilestoneEditor';
import { Card, Field, InfoBanner } from '../components/ui';
import { generateMilestones, defaultGlobalTerms, analyze } from '../lib/assistant';
import type { AssistantAnalysis } from '../lib/assistant';
import { validateAgreement, isValid } from '../lib/validation';
import type { GlobalTerms, Milestone } from '../types';
import { hashObject } from '../lib/hash';
import { uid } from '../lib/id';
import { Sparkles, ArrowLeft, ArrowRight, Send, Save, HelpCircle, AlertTriangle, Info } from 'lucide-react';

const STEPS = ['Basics', 'Documentation', 'Assistant', 'Milestones', 'Review'];

export function CreateProject() {
  const navigate = useNavigate();
  const store = useStore();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    title: '', category: 'Website', summary: '', requirements: '',
    totalBudget: 30000, estimatedDurationDays: 60,
    desiredStartDate: '', desiredCompletionDate: '',
    implementerName: '', implementerEmail: '', confidential: false, withArbiter: true,
    exclusions: '',
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [terms, setTerms] = useState<GlobalTerms | null>(null);
  const [analysis, setAnalysis] = useState<AssistantAnalysis | null>(null);

  if (store.currentRole !== 'stakeholder') {
    return (
      <div className="mx-auto max-w-lg py-12">
        <Card className="p-8 text-center">
          <Info size={30} className="mx-auto mb-3 text-sol-blue" />
          <h1 className="text-xl font-bold text-white">Only Stakeholders create projects</h1>
          <p className="mt-2 text-sm text-white/50">Projects are proposed and funded by a Stakeholder. As an {store.currentRole}, you receive invitations to review and approve the scope instead.</p>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={() => navigate('/invitations')} className="btn-primary">View invitations</button>
            <button onClick={() => navigate('/dashboard')} className="btn-ghost">Dashboard</button>
          </div>
        </Card>
      </div>
    );
  }

  function runAssistant() {
    const input = { title: form.title, category: form.category, summary: form.summary, requirements: form.requirements, totalBudget: form.totalBudget, estimatedDurationDays: form.estimatedDurationDays };
    const ms = generateMilestones(input);
    setMilestones(ms);
    setTerms(defaultGlobalTerms(input));
    setAnalysis(analyze(input, ms));
  }

  const canNext = () => {
    if (step === 0) return form.title.trim() && form.summary.trim() && form.totalBudget > 0;
    if (step === 1) return form.requirements.trim().length > 20;
    return true;
  };

  function next() {
    if (step === 1 && !analysis) runAssistant();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function finalize(send: boolean) {
    const id = store.createProject({
      title: form.title, category: form.category, summary: form.summary, requirements: form.requirements,
      totalBudget: form.totalBudget, estimatedDurationDays: form.estimatedDurationDays,
      desiredStartDate: form.desiredStartDate || undefined, desiredCompletionDate: form.desiredCompletionDate || undefined,
      implementerName: form.implementerName || undefined, implementerEmail: form.implementerEmail || undefined,
      confidential: form.confidential, withArbiter: form.withArbiter,
    });
    store.setMilestones(id, milestones);
    if (terms) store.updateProjectMeta(id, { globalTerms: terms });
    if (form.exclusions.trim()) {
      const p = useStore.getState().projects.find((x) => x.id === id)!;
      store.updateProjectMeta(id, { documents: [...p.documents, { id: uid('doc'), kind: 'exclusion', label: 'Out of scope', content: form.exclusions, hash: hashObject(form.exclusions) }] });
    }
    if (send) store.sendToImplementer(id);
    navigate(`/project/${id}`);
  }

  const issues = terms ? validateAgreement(milestones, terms, form.totalBudget) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="eyebrow text-sol-purple">Build</p>
        <h1 className="page-title mt-1">New project</h1>
        <p className="mt-1 text-sm text-[#9ca3b8]">Turn a brief into a measurable, escrow-backed agreement.</p>
      </div>

      {/* stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${i === step ? 'bg-sol-gradient text-black' : i < step ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40'}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full ${i <= step ? 'bg-black/20' : 'bg-white/10'}`}>{i + 1}</span>
              {s}
            </div>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-sol-green/50' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0 */}
      {step === 0 && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Project title"><input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Business Website Development" /></Field>
            <Field label="Product category">
              <select className="input" value={form.category} onChange={(e) => set({ category: e.target.value })}>
                <option>Website</option><option>Web App</option><option>Mobile App</option><option>Branding / Design</option><option>Smart Contract</option><option>Other</option>
              </select>
            </Field>
          </div>
          <Field label="Project summary"><textarea rows={2} className="input" value={form.summary} onChange={(e) => set({ summary: e.target.value })} placeholder="One or two sentences describing the product." /></Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Total budget (USDC)"><input type="number" className="input" value={form.totalBudget} onChange={(e) => set({ totalBudget: Number(e.target.value) })} /></Field>
            <Field label="Est. duration (days)"><input type="number" className="input" value={form.estimatedDurationDays} onChange={(e) => set({ estimatedDurationDays: Number(e.target.value) })} /></Field>
            <Field label="Currency"><input className="input" value="USDC" disabled /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Desired start date"><input type="date" className="input" value={form.desiredStartDate} onChange={(e) => set({ desiredStartDate: e.target.value })} /></Field>
            <Field label="Desired completion date"><input type="date" className="input" value={form.desiredCompletionDate} onChange={(e) => set({ desiredCompletionDate: e.target.value })} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Implementer name" hint="Who you’re inviting to deliver the work"><input className="input" value={form.implementerName} onChange={(e) => set({ implementerName: e.target.value })} placeholder="Jordan Kim" /></Field>
            <Field label="Implementer email"><input className="input" value={form.implementerEmail} onChange={(e) => set({ implementerEmail: e.target.value })} placeholder="jordan@studio.dev" /></Field>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={form.withArbiter} onChange={(e) => set({ withArbiter: e.target.checked })} /> Include an optional Arbiter for disputes</label>
            <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={form.confidential} onChange={(e) => set({ confidential: e.target.checked })} /> Confidential project</label>
          </div>
        </Card>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <Card className="space-y-4 p-6">
          <Field label="Full requirements" hint="Paste your brief. Mandatory features, constraints, and responsibilities. The more detail, the better the milestones.">
            <textarea rows={8} className="input" value={form.requirements} onChange={(e) => set({ requirements: e.target.value })} placeholder="Describe pages/features, tech constraints, who provides content, supported browsers/devices…" />
          </Field>
          <Field label="What is NOT included (out of scope)" hint="Optional but recommended — prevents disputes later.">
            <textarea rows={3} className="input" value={form.exclusions} onChange={(e) => set({ exclusions: e.target.value })} placeholder="e.g. Copywriting, photography, and paid ad campaigns are out of scope." />
          </Field>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && analysis && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2"><Sparkles size={18} className="text-sol-purple" /><h2 className="font-semibold text-white">Assistant analysis</h2></div>
            {analysis.clarifications.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70"><HelpCircle size={15} /> Clarification questions</div>
                <ul className="space-y-1.5">
                  {analysis.clarifications.map((c, i) => <li key={i} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70">{c}</li>)}
                </ul>
                <p className="mt-2 text-xs text-white/40">Answer these in your requirements for sharper milestones, or continue and refine the generated plan.</p>
              </div>
            )}
            <div>
              <div className="mb-2 text-sm font-medium text-white/70">Risk & quality checks</div>
              <div className="space-y-1.5">
                {analysis.risks.map((r, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${r.level === 'high' ? 'bg-red-500/10 text-red-200' : r.level === 'warn' ? 'bg-amber-400/10 text-amber-200' : 'bg-sol-blue/10 text-sol-blue'}`}>
                    {r.level === 'high' ? <AlertTriangle size={15} className="mt-0.5 shrink-0" /> : r.level === 'warn' ? <AlertTriangle size={15} className="mt-0.5 shrink-0" /> : <Info size={15} className="mt-0.5 shrink-0" />}
                    {r.message}
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <InfoBanner tone="info">The assistant generated {milestones.length} milestones. Review and edit them in the next step — nothing is final until both parties approve and sign.</InfoBanner>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && terms && (
        <MilestoneEditor milestones={milestones} onChange={setMilestones} totalBudget={form.totalBudget} globalTerms={terms} onTermsChange={setTerms} />
      )}

      {/* Step 4 */}
      {step === 4 && terms && (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 font-semibold text-white">Review agreement</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <Sum label="Project" value={form.title} />
              <Sum label="Budget" value={`${form.totalBudget.toLocaleString()} USDC`} />
              <Sum label="Milestones" value={String(milestones.length)} />
              <Sum label="Implementer" value={form.implementerName || 'Jordan Kim'} />
              <Sum label="Arbiter" value={form.withArbiter ? 'Sam Okafor' : 'None'} />
              <Sum label="Duration" value={`${form.estimatedDurationDays} days`} />
            </div>
            <div className="mt-4 space-y-2">
              {milestones.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2.5 text-sm">
                  <span className="text-white/80"><span className="text-white/40">{i + 1}.</span> {m.title}</span>
                  <span className="font-semibold text-white">{m.paymentAmount.toLocaleString()} USDC</span>
                </div>
              ))}
            </div>
          </Card>
          {!isValid(issues) ? (
            <InfoBanner tone="danger">Resolve validation errors in the Milestones step before sending.</InfoBanner>
          ) : (
            <InfoBanner tone="success">Agreement is valid and balanced. You can save a draft or send it to the Implementer for review.</InfoBanner>
          )}
        </div>
      )}

      {/* nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))} className="btn-ghost"><ArrowLeft size={16} /> Back</button>
        {step < STEPS.length - 1 ? (
          <button onClick={next} disabled={!canNext()} className="btn-primary">Continue <ArrowRight size={16} /></button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => finalize(false)} className="btn-ghost"><Save size={16} /> Save draft</button>
            <button onClick={() => finalize(true)} disabled={!isValid(issues)} className="btn-primary"><Send size={16} /> Send to Implementer</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Sum({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white/5 px-4 py-3"><div className="text-xs text-white/40">{label}</div><div className="mt-0.5 font-semibold text-white">{value}</div></div>;
}
