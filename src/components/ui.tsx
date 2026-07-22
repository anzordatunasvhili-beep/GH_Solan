import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { StatusMeta } from '../lib/statuses';

export function StatusBadge({ meta }: { meta: StatusMeta }) {
  return (
    <span className={`chip ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>{children}</div>;
}

export function Stat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-white/45">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ?? 'text-white'}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-white/45">{sub}</div>}
    </div>
  );
}

export function Progress({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className="h-full rounded-full bg-sol-gradient transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, color = '#9945FF', size = 32 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-black"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`card mt-[6vh] w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} animate-fade-in p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
      {icon && <div className="mb-3 text-white/30">{icon}</div>}
      <div className="text-lg font-semibold text-white">{title}</div>
      {body && <div className="mt-1 max-w-md text-sm text-white/45">{body}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/35">{hint}</p>}
    </div>
  );
}

export function InfoBanner({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'danger' | 'success'; children: ReactNode }) {
  const map = {
    info: 'border-sol-blue/30 bg-sol-blue/10 text-sol-blue',
    warn: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    danger: 'border-red-500/30 bg-red-500/10 text-red-200',
    success: 'border-sol-green/30 bg-sol-green/10 text-sol-green',
  } as const;
  return <div className={`rounded-xl border px-4 py-3 text-sm ${map[tone]}`}>{children}</div>;
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`chip bg-white/8 text-white/70 ${className}`}>{children}</span>;
}
