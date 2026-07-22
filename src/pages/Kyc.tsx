import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useProfile } from '../store/useProfile';
import { Card, Field, InfoBanner } from '../components/ui';
import { DEMO_PARTIES } from '../lib/seed';
import { ShieldCheck, IdCard, User, Globe, Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const STEPS = ['Identity', 'Document', 'Verify'];

export function Kyc() {
  const navigate = useNavigate();
  const role = useStore((s) => s.currentRole);
  const { kyc, completeKyc } = useProfile();
  const existing = kyc[role];

  const [step, setStep] = useState(0);
  const [legalName, setLegalName] = useState(DEMO_PARTIES[role].name);
  const [country, setCountry] = useState('United States');
  const [dob, setDob] = useState('');
  const [idType, setIdType] = useState('Passport');
  const [idNumber, setIdNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'done'>(existing?.verified ? 'done' : 'idle');

  function runVerification() {
    setStatus('verifying');
    setTimeout(() => {
      completeKyc(role, {
        legalName,
        country,
        idType,
        idLast4: idNumber.slice(-4) || '0000',
      });
      setStatus('done');
    }, 1800);
  }

  const canNext = () => {
    if (step === 0) return legalName.trim() && country.trim() && dob;
    if (step === 1) return idType && idNumber.trim().length >= 4;
    return true;
  };

  if (existing?.verified && status === 'done') {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-sol-green/15 text-sol-green">
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-2xl font-bold text-white">Identity verified</h1>
          <p className="mt-1 text-sm text-white/50">You earned <span className="font-semibold text-sol-green">+1 aura</span> for verifying your identity.</p>
          <div className="mt-5 rounded-xl border border-line bg-white/5 p-4 text-left text-sm">
            <Line k="Legal name" v={existing.legalName} />
            <Line k="Country" v={existing.country} />
            <Line k="Document" v={`${existing.idType} ····${existing.idLast4}`} />
            <Line k="Verified" v={new Date(existing.verifiedAt).toLocaleDateString()} />
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => navigate('/profile')} className="btn-ghost">Back to profile</button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to dashboard <ArrowRight size={15} /></button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-sol-purple/15 text-sol-purple"><IdCard size={22} /></div>
        <h1 className="text-2xl font-bold text-white">Identity verification (KYC)</h1>
        <p className="mt-1 text-sm text-white/45">Verify once to earn <span className="text-sol-green">+1 aura</span> and unlock trusted-party status.</p>
      </div>

      {/* stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${i === step ? 'bg-white/15 text-white' : i < step ? 'bg-white/5 text-white/70' : 'bg-white/5 text-white/35'}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full ${i < step ? 'bg-sol-green text-black' : 'bg-white/10'}`}>{i < step ? '✓' : i + 1}</span>
              {s}
            </div>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-sol-green/50' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Legal full name"><div className="relative"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><input className="input pl-9" value={legalName} onChange={(e) => setLegalName(e.target.value)} /></div></Field>
            <Field label="Country of residence"><div className="relative"><Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><input className="input pl-9" value={country} onChange={(e) => setCountry(e.target.value)} /></div></Field>
            <Field label="Date of birth"><input type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Document type">
              <select className="input" value={idType} onChange={(e) => setIdType(e.target.value)}>
                <option>Passport</option><option>National ID</option><option>Driver’s License</option>
              </select>
            </Field>
            <Field label="Document number" hint="For this demo, only the last 4 digits are stored.">
              <input className="input" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="e.g. X1234567" />
            </Field>
            <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-white/45">
              <IdCard size={26} className="mx-auto mb-2 text-white/30" />
              Drag a photo of your document here <span className="text-white/30">(simulated — no upload required)</span>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            {status === 'idle' && (
              <>
                <InfoBanner tone="info">Review your details, then submit for verification. This is a simulated check for the demo.</InfoBanner>
                <div className="rounded-xl border border-line bg-white/5 p-4 text-sm">
                  <Line k="Legal name" v={legalName} />
                  <Line k="Country" v={country} />
                  <Line k="Date of birth" v={dob || '—'} />
                  <Line k="Document" v={`${idType} ····${idNumber.slice(-4) || '····'}`} />
                </div>
              </>
            )}
            {status === 'verifying' && (
              <div className="flex flex-col items-center py-8 text-center">
                <Loader2 size={34} className="mb-3 animate-spin text-sol-purple" />
                <div className="font-semibold text-white">Verifying your identity…</div>
                <div className="text-sm text-white/45">Checking document and screening records</div>
              </div>
            )}
          </div>
        )}

        {status !== 'verifying' && (
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => (step === 0 ? navigate('/profile') : setStep((s) => s - 1))} className="btn-ghost"><ArrowLeft size={15} /> Back</button>
            {step < 2 ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="btn-primary">Continue <ArrowRight size={15} /></button>
            ) : (
              <button onClick={runVerification} className="btn-primary"><Sparkles size={15} /> Submit & verify</button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
      <span className="text-white/45">{k}</span>
      <span className="font-medium text-white">{v}</span>
    </div>
  );
}
