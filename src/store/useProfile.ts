import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Role } from '../types';
import { uid } from '../lib/id';

export interface KycRecord {
  verified: boolean;
  legalName: string;
  country: string;
  idType: string;
  idLast4: string;
  verifiedAt: string;
}

export interface Review {
  id: string;
  projectId: string;
  projectTitle: string;
  fromRole: Role;
  fromName: string;
  toRole: Role;
  rating: number; // 1..5
  comment: string;
  at: string;
}

export interface Session {
  role: Role;
  name: string;
  email: string;
  at: string;
}

interface ProfileState {
  session: Session | null;
  kyc: Partial<Record<Role, KycRecord>>;
  reviews: Review[];
  signIn: (s: Session) => void;
  signOut: () => void;
  completeKyc: (role: Role, data: Omit<KycRecord, 'verified' | 'verifiedAt'>) => void;
  addReview: (r: Omit<Review, 'id' | 'at'>) => void;
}

function seededProfiles() {
  const at = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
  return {
    session: null as Session | null,
    kyc: {
      stakeholder: { verified: true, legalName: 'Alex Rivera', country: 'United States', idType: 'Passport', idLast4: '4821', verifiedAt: at },
      implementer: { verified: true, legalName: 'Jordan Kim', country: 'South Korea', idType: 'National ID', idLast4: '9037', verifiedAt: at },
    } as Partial<Record<Role, KycRecord>>,
    reviews: [
      { id: uid('rev'), projectId: 'past-1', projectTitle: 'Landing page revamp', fromRole: 'stakeholder' as Role, fromName: 'Alex Rivera', toRole: 'implementer' as Role, rating: 5, comment: 'Delivered every milestone ahead of schedule. Clear communication throughout.', at },
      { id: uid('rev'), projectId: 'past-1', projectTitle: 'Landing page revamp', fromRole: 'implementer' as Role, fromName: 'Jordan Kim', toRole: 'stakeholder' as Role, rating: 5, comment: 'Scope was well defined and payments released promptly on approval.', at },
    ] as Review[],
  };
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      ...seededProfiles(),
      signIn: (s) => set({ session: s }),
      signOut: () => set({ session: null }),
      completeKyc: (role, data) =>
        set((st) => ({ kyc: { ...st.kyc, [role]: { ...data, verified: true, verifiedAt: new Date().toISOString() } } })),
      addReview: (r) => set((st) => ({ reviews: [{ id: uid('rev'), at: new Date().toISOString(), ...r }, ...st.reviews] })),
    }),
    { name: 'driu-profile-v1' },
  ),
);

// ---------- pure reputation helpers ----------

export function participatesAs(p: Project, role: Role): boolean {
  if (role === 'stakeholder') return true;
  if (role === 'implementer') return !!p.implementer;
  return !!p.arbiter;
}

export function completedContractsFor(role: Role, projects: Project[]): number {
  return projects.filter((p) => p.status === 'completed' && participatesAs(p, role)).length;
}

/** Aura = 1 for KYC verification + 1 for each successfully completed contract. */
export function computeAura(role: Role, projects: Project[], kycVerified: boolean): number {
  return (kycVerified ? 1 : 0) + completedContractsFor(role, projects);
}
