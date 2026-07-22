import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ActivityEntry, Amendment, AppNotification, Dispute, DisputeEvidence, DisputeOutcome,
  Milestone, Party, Project, ProjectStatus, Role, Submission, Transaction, TxKind,
} from '../types';
import { DEMO_PARTIES, buildSeed } from '../lib/seed';
import { generateMilestones, defaultGlobalTerms, analyze } from '../lib/assistant';
import type { AssistantInput, AssistantAnalysis } from '../lib/assistant';
import { hashObject } from '../lib/hash';
import { uid, fakeTxSignature } from '../lib/id';
import { daysFromNow } from '../lib/format';
import { explorerTx, signMessage } from '../lib/wallet';
import type { ConnectedWallet } from '../lib/wallet';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

interface CreateInput extends AssistantInput {
  desiredStartDate?: string;
  desiredCompletionDate?: string;
  implementerName?: string;
  implementerEmail?: string;
  confidential?: boolean;
  withArbiter?: boolean;
}

interface StoreState {
  currentRole: Role;
  connected: ConnectedWallet | null;
  projects: Project[];
  transactions: Transaction[];
  disputes: Dispute[];
  activity: ActivityEntry[];
  notifications: AppNotification[];

  // meta
  setRole: (r: Role) => void;
  setWallet: (w: ConnectedWallet | null) => void;
  resetDemo: () => void;
  identity: () => Party;

  // creation
  createProject: (input: CreateInput) => string;
  updateProjectMeta: (id: string, patch: Partial<Project>) => void;
  regenerateMilestones: (id: string) => void;
  setMilestones: (id: string, milestones: Milestone[]) => void;
  analyzeProject: (id: string) => AssistantAnalysis;
  sendToImplementer: (id: string) => void;

  // scope approvals
  implementerApproveScope: (id: string, milestoneId: string) => void;
  implementerRequestChanges: (id: string, milestoneId: string, note: string) => void;
  stakeholderApproveScope: (id: string, milestoneId: string) => void;
  resendToImplementer: (id: string) => void;

  // signatures + funding
  signAgreement: (id: string, role: Role) => Promise<void>;
  fundProject: (id: string) => void;

  // milestone lifecycle
  startMilestone: (id: string, milestoneId: string) => void;
  submitMilestone: (id: string, milestoneId: string, data: SubmitData) => void;
  approveCompletion: (id: string, milestoneId: string) => void;
  confirmCloseout: (id: string, role: Role) => void;
  requestRevision: (id: string, milestoneId: string, data: RevisionData) => void;
  requestExtension: (id: string, milestoneId: string, data: ExtensionData) => void;
  approveExtension: (id: string, milestoneId: string) => void;
  claimReviewTimeout: (id: string, milestoneId: string) => void;

  // amendments
  proposeAmendment: (id: string, data: AmendmentData) => void;
  decideAmendment: (id: string, amendmentId: string, decision: 'approved' | 'rejected') => void;

  // disputes
  openDispute: (id: string, milestoneId: string, claim: string) => void;
  respondDispute: (disputeId: string, response: string) => void;
  addDisputeEvidence: (disputeId: string, ev: Omit<DisputeEvidence, 'at'>) => void;
  resolveDispute: (disputeId: string, outcome: DisputeOutcome, implementerAmount: number, stakeholderAmount: number, explanation: string) => void;

  // cancellation
  cancelProject: (id: string) => void;

  // notifications
  markNotificationRead: (nid: string) => void;
  markAllRead: () => void;
}

interface SubmitData {
  title: string; summary: string; checklist: { label: string; done: boolean }[];
  evidenceLinks: { label: string; url: string }[]; notes?: string; knownLimitations?: string;
}
interface RevisionData { reason: string; failedCriteria: string[]; requiredCorrection: string; }
interface ExtensionData { newDeadline: string; reason: string; impact: string; }
interface AmendmentData {
  reason: string; affectedMilestones: string[]; oldWording: string; newWording: string;
  paymentDifference: number; deadlineDifferenceDays: number;
}

function initial() {
  const seed = buildSeed();
  return {
    currentRole: 'stakeholder' as Role,
    connected: null as ConnectedWallet | null,
    projects: seed.projects,
    transactions: seed.transactions,
    disputes: [] as Dispute[],
    activity: seed.activity,
    notifications: [] as AppNotification[],
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      // ---- internal helpers ----
      const now = () => new Date().toISOString();

      const patchProject = (id: string, updater: (p: Project) => Project) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...updater(clone(p)), updatedAt: now() } : p)),
        }));
      };

      const pushActivity = (e: Omit<ActivityEntry, 'id' | 'at'> & { at?: string }) => {
        set((s) => ({ activity: [{ id: uid('act'), at: e.at ?? now(), ...e }, ...s.activity] }));
      };

      const notify = (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => {
        set((s) => ({ notifications: [{ id: uid('ntf'), at: now(), read: false, ...n }, ...s.notifications] }));
      };

      const addTx = (kind: TxKind, projectId: string, amount: number, from: string, to: string, milestoneId?: string): Transaction => {
        const id = fakeTxSignature();
        const tx: Transaction = {
          id, kind, projectId, milestoneId, amount, currency: 'USDC', from, to,
          status: 'confirmed', createdAt: now(), explorerUrl: explorerTx(id),
        };
        set((s) => ({ transactions: [tx, ...s.transactions] }));
        return tx;
      };

      const recomputeReadiness = (p: Project) => {
        if (p.status !== 'active' && p.status !== 'funded') return;
        for (const m of p.milestones) {
          if (m.status === 'locked' || m.status === 'blocked-by-dependency') {
            const depsDone = m.dependencies.every((d) => p.milestones.find((x) => x.id === d)?.status === 'paid');
            m.status = depsDone ? 'ready-to-start' : 'blocked-by-dependency';
          }
        }
      };

      const makeVersion = (p: Project, note: string) => {
        const snapshot = {
          milestones: clone(p.milestones),
          globalTerms: clone(p.globalTerms),
          totalBudget: p.totalBudget,
          docHashes: p.documents.map((d) => d.hash),
        };
        const hash = hashObject(snapshot);
        const version = p.versions.length + 1;
        p.versions.push({ version, hash, createdAt: now(), note, snapshot, signatures: [] });
        p.currentVersion = version;
      };

      return {
        ...initial(),

        setRole: (r) => set({ currentRole: r }),
        setWallet: (w) => set({ connected: w }),
        resetDemo: () => { localStorage.removeItem('driu.simwallet'); set({ ...initial() }); },
        identity: () => DEMO_PARTIES[get().currentRole],

        // ---------- creation ----------
        createProject: (input) => {
          const id = uid('proj');
          const milestones = generateMilestones(input);
          const globalTerms = defaultGlobalTerms(input);
          const requirementsDoc = {
            id: uid('doc'), kind: 'requirements' as const, label: 'Project brief',
            content: input.requirements, hash: hashObject(input.requirements),
          };
          const project: Project = {
            id,
            title: input.title,
            category: input.category,
            summary: input.summary,
            requirements: input.requirements,
            currency: 'USDC',
            totalBudget: input.totalBudget,
            estimatedDurationDays: input.estimatedDurationDays,
            desiredStartDate: input.desiredStartDate,
            desiredCompletionDate: input.desiredCompletionDate,
            confidential: !!input.confidential,
            stakeholder: DEMO_PARTIES.stakeholder,
            implementer: input.implementerName
              ? { ...DEMO_PARTIES.implementer, name: input.implementerName, email: input.implementerEmail || DEMO_PARTIES.implementer.email }
              : DEMO_PARTIES.implementer,
            arbiter: input.withArbiter ? DEMO_PARTIES.arbiter : undefined,
            documents: [requirementsDoc],
            globalTerms,
            milestones,
            status: 'stakeholder-editing',
            currentVersion: 0,
            versions: [],
            amendments: [],
            funds: { released: 0, active: 0, future: 0, refundable: 0, disputed: 0 },
            fundedAmount: 0,
            createdAt: now(),
            updatedAt: now(),
          };
          set((s) => ({ projects: [project, ...s.projects] }));
          pushActivity({ projectId: id, actor: 'stakeholder', action: 'Project created', detail: `Created “${input.title}”.` });
          pushActivity({ projectId: id, actor: 'assistant', action: 'Milestones generated', detail: `Generated ${milestones.length} milestones from the brief.` });
          return id;
        },

        updateProjectMeta: (id, patch) => patchProject(id, (p) => ({ ...p, ...patch })),

        regenerateMilestones: (id) => patchProject(id, (p) => {
          p.milestones = generateMilestones({
            title: p.title, category: p.category, summary: p.summary,
            requirements: p.requirements, totalBudget: p.totalBudget, estimatedDurationDays: p.estimatedDurationDays,
          });
          return p;
        }),

        setMilestones: (id, milestones) => patchProject(id, (p) => { p.milestones = milestones; return p; }),

        analyzeProject: (id) => {
          const p = get().projects.find((x) => x.id === id)!;
          return analyze(
            { title: p.title, category: p.category, summary: p.summary, requirements: p.requirements, totalBudget: p.totalBudget, estimatedDurationDays: p.estimatedDurationDays },
            p.milestones,
          );
        },

        sendToImplementer: (id) => {
          patchProject(id, (p) => {
            p.milestones.forEach((m) => {
              m.stakeholderScopeApproved = true;
              m.implementerScopeApproved = false;
              m.status = 'awaiting-scope-approval';
            });
            p.status = 'awaiting-implementer-review';
            return p;
          });
          pushActivity({ projectId: id, actor: 'stakeholder', action: 'Sent for review', detail: 'Sent the proposed agreement to the Implementer.' });
          notify({ audience: 'implementer', projectId: id, title: 'New project invitation', body: 'You have been invited to review a project agreement.', link: `/project/${id}` });
        },

        // ---------- scope approvals ----------
        implementerApproveScope: (id, milestoneId) => {
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            m.implementerScopeApproved = true;
            if (m.stakeholderScopeApproved) m.status = 'scope-approved';
            // if implementer approved all, move to final stakeholder approval
            if (p.milestones.every((x) => x.implementerScopeApproved)) {
              p.status = 'awaiting-final-scope-approval';
            }
            return p;
          });
          pushActivity({ projectId: id, actor: 'implementer', action: 'Scope approved', detail: 'Approved a milestone scope.', milestoneId });
          const p = get().projects.find((x) => x.id === id)!;
          if (p.status === 'awaiting-final-scope-approval') {
            notify({ audience: 'stakeholder', projectId: id, title: 'Scope approved by Implementer', body: 'All milestones were approved. Confirm scope to proceed to signatures.', link: `/project/${id}` });
          }
        },

        implementerRequestChanges: (id, milestoneId, note) => {
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            m.implementerScopeApproved = false;
            m.stakeholderScopeApproved = false;
            m.status = 'changes-requested';
            p.status = 'changes-requested';
            return p;
          });
          pushActivity({ projectId: id, actor: 'implementer', action: 'Changes requested', detail: note, milestoneId });
          notify({ audience: 'stakeholder', projectId: id, title: 'Changes requested', body: note, link: `/project/${id}` });
        },

        resendToImplementer: (id) => {
          patchProject(id, (p) => {
            p.milestones.forEach((m) => {
              if (m.status === 'changes-requested' || m.status === 'draft') {
                m.stakeholderScopeApproved = true;
                m.implementerScopeApproved = false;
                m.status = 'awaiting-scope-approval';
              }
            });
            p.status = 'awaiting-implementer-review';
            return p;
          });
          pushActivity({ projectId: id, actor: 'stakeholder', action: 'Re-sent for review', detail: 'Updated the agreement and re-sent it to the Implementer.' });
          notify({ audience: 'implementer', projectId: id, title: 'Updated agreement', body: 'The Stakeholder updated the agreement. Please review again.', link: `/project/${id}` });
        },

        stakeholderApproveScope: (id, milestoneId) => {
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            m.stakeholderScopeApproved = true;
            if (m.implementerScopeApproved) m.status = 'scope-approved';
            if (p.milestones.every((x) => x.stakeholderScopeApproved && x.implementerScopeApproved)) {
              makeVersion(p, 'Initial signed agreement');
              p.status = 'awaiting-signatures';
            }
            return p;
          });
          pushActivity({ projectId: id, actor: 'stakeholder', action: 'Scope approved', detail: 'Confirmed a milestone scope.', milestoneId });
          const p = get().projects.find((x) => x.id === id)!;
          if (p.status === 'awaiting-signatures') {
            notify({ audience: 'stakeholder', projectId: id, title: 'Ready to sign', body: 'Scope is locked. Both parties can now sign the agreement.', link: `/project/${id}` });
            notify({ audience: 'implementer', projectId: id, title: 'Ready to sign', body: 'Scope is locked. Both parties can now sign the agreement.', link: `/project/${id}` });
          }
        },

        // ---------- signatures ----------
        signAgreement: async (id, role) => {
          const state = get();
          const p = state.projects.find((x) => x.id === id)!;
          const version = p.versions[p.versions.length - 1];
          const message = `DRIU Agreement\nProject: ${p.title}\nVersion: ${version.version}\nHash: ${version.hash}`;
          const wallet = state.connected;
          const party = DEMO_PARTIES[role];
          let signature: string;
          if (wallet) {
            signature = await signMessage(wallet, message);
          } else {
            signature = 'sim_' + hashObject({ role, h: version.hash });
          }
          patchProject(id, (proj) => {
            const v = proj.versions[proj.versions.length - 1];
            v.signatures = v.signatures.filter((s) => s.party !== role);
            v.signatures.push({ party: role, wallet: wallet?.publicKey ?? party.wallet ?? 'unknown', signature, signedAt: now() });
            const needed = proj.arbiter ? ['stakeholder', 'implementer'] : ['stakeholder', 'implementer'];
            const signed = new Set(v.signatures.map((s) => s.party));
            if (needed.every((n) => signed.has(n as Role))) {
              proj.status = 'awaiting-funding';
              proj.milestones.forEach((m) => { if (m.status === 'scope-approved') m.status = 'locked'; });
            }
            return proj;
          });
          pushActivity({ projectId: id, actor: role, action: 'Signed agreement', detail: `Signed agreement version ${version.version}.`, version: version.version });
          const after = get().projects.find((x) => x.id === id)!;
          if (after.status === 'awaiting-funding') {
            notify({ audience: 'stakeholder', projectId: id, title: 'Agreement signed', body: 'Both parties signed. Fund the escrow to begin.', link: `/project/${id}` });
          }
        },

        // ---------- funding ----------
        fundProject: (id) => {
          const p = get().projects.find((x) => x.id === id)!;
          const tx = addTx('funding', id, p.totalBudget, p.stakeholder.wallet ?? 'stakeholder', 'EscrowPDAdriu1111');
          patchProject(id, (proj) => {
            proj.fundedAmount = proj.totalBudget;
            proj.funds = { released: 0, active: 0, future: proj.totalBudget, refundable: 0, disputed: 0 };
            proj.status = 'active';
            recomputeReadiness(proj);
            return proj;
          });
          pushActivity({ projectId: id, actor: 'stakeholder', action: 'Funded escrow', detail: `Deposited ${p.totalBudget.toLocaleString()} USDC into escrow.`, txId: tx.id });
          notify({ audience: 'implementer', projectId: id, title: 'Project funded', body: 'The full budget is secured in escrow. You can start work.', link: `/project/${id}` });
        },

        // ---------- milestone lifecycle ----------
        startMilestone: (id, milestoneId) => {
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            m.status = 'in-progress';
            m.startedAt = now();
            m.deliveryDeadline = daysFromNow(m.durationDays);
            p.funds.future -= m.paymentAmount;
            p.funds.active += m.paymentAmount;
            return p;
          });
          pushActivity({ projectId: id, actor: 'implementer', action: 'Milestone started', detail: 'Started work on a milestone.', milestoneId });
        },

        submitMilestone: (id, milestoneId, data) => {
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            const version = m.submissions.length + 1;
            const submission: Submission = {
              version, title: data.title, summary: data.summary,
              deliverableChecklist: data.checklist, evidenceLinks: data.evidenceLinks,
              notes: data.notes, knownLimitations: data.knownLimitations,
              confirmedMatchesScope: true,
              hash: hashObject({ milestoneId, version, title: data.title, summary: data.summary }),
              submittedAt: now(), submittedBy: 'implementer',
            };
            m.submissions.push(submission);
            m.implementerCompletionConfirmed = true;
            m.status = version > 1 ? 'resubmitted' : 'submitted';
            m.reviewDeadline = daysFromNow(m.reviewPeriodDays);
            return p;
          });
          pushActivity({ projectId: id, actor: 'implementer', action: 'Milestone submitted', detail: `Submitted “${data.title}”.`, milestoneId });
          notify({ audience: 'stakeholder', projectId: id, title: 'Work submitted for review', body: `“${data.title}” is ready for your review.`, link: `/project/${id}` });
        },

        approveCompletion: (id, milestoneId) => {
          const p0 = get().projects.find((x) => x.id === id)!;
          const m0 = p0.milestones.find((x) => x.id === milestoneId)!;
          const tx = addTx('milestone-release', id, m0.paymentAmount, 'EscrowPDAdriu1111', p0.implementer?.wallet ?? 'implementer', milestoneId);
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            m.stakeholderCompletionApproved = true;
            m.status = 'paid';
            p.funds.active -= m.paymentAmount;
            p.funds.released += m.paymentAmount;
            recomputeReadiness(p);
            if (p.milestones.every((x) => x.status === 'paid' || x.status === 'cancelled' || x.status === 'refunded')) {
              p.status = 'awaiting-closeout';
              p.closeout = {};
            }
            return p;
          });
          pushActivity({ projectId: id, actor: 'stakeholder', action: 'Milestone approved', detail: `Approved “${m0.title}”.`, milestoneId });
          pushActivity({ projectId: id, actor: 'system', action: 'Payment released', detail: `Released ${m0.paymentAmount.toLocaleString()} USDC to the Implementer.`, milestoneId, txId: tx.id });
          notify({ audience: 'implementer', projectId: id, title: 'Payment released', body: `${m0.paymentAmount.toLocaleString()} USDC was released for “${m0.title}”.`, link: `/payments` });
        },

        confirmCloseout: (id, role) => {
          patchProject(id, (p) => {
            p.closeout = p.closeout ?? {};
            if (role === 'stakeholder') p.closeout.stakeholderConfirmedAt = now();
            if (role === 'implementer') p.closeout.implementerConfirmedAt = now();
            if (p.closeout.stakeholderConfirmedAt && p.closeout.implementerConfirmedAt) p.status = 'completed';
            return p;
          });
          const p1 = get().projects.find((x) => x.id === id)!;
          pushActivity({ projectId: id, actor: role, action: 'Close-out confirmed', detail: `${role === 'stakeholder' ? 'Stakeholder' : 'Implementer'} confirmed the project close-out.` });
          if (p1.status === 'completed') {
            pushActivity({ projectId: id, actor: 'system', action: 'Project completed', detail: 'Both parties confirmed close-out. The agreement is complete and both earned +1 aura.' });
            notify({ audience: 'stakeholder', projectId: id, title: 'Project completed', body: 'Both parties confirmed close-out. You earned +1 aura.', link: `/project/${id}` });
            notify({ audience: 'implementer', projectId: id, title: 'Project completed', body: 'Both parties confirmed close-out. You earned +1 aura.', link: `/project/${id}` });
          } else {
            const other = role === 'stakeholder' ? 'implementer' : 'stakeholder';
            notify({ audience: other, projectId: id, title: 'Close-out confirmation requested', body: 'The other party confirmed project close-out. Confirm to complete the agreement.', link: `/project/${id}` });
          }
        },

        requestRevision: (id, milestoneId, data) => {
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            m.revisionCount += 1;
            m.status = 'revision-requested';
            m.implementerCompletionConfirmed = false;
            m.revisionRequests.push({
              number: m.revisionCount, reason: data.reason, failedCriteria: data.failedCriteria,
              requiredCorrection: data.requiredCorrection, deadline: daysFromNow(m.durationDays), createdAt: now(),
            });
            return p;
          });
          pushActivity({ projectId: id, actor: 'stakeholder', action: 'Revision requested', detail: data.reason, milestoneId });
          notify({ audience: 'implementer', projectId: id, title: 'Revision requested', body: data.reason, link: `/project/${id}` });
        },

        requestExtension: (id, milestoneId, data) => {
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            m.pendingExtension = { ...data, requestedBy: 'implementer', requestedAt: now() };
            return p;
          });
          pushActivity({ projectId: id, actor: 'implementer', action: 'Extension requested', detail: `Requested a new deadline: ${data.reason}`, milestoneId });
          notify({ audience: 'stakeholder', projectId: id, title: 'Deadline extension requested', body: data.reason, link: `/project/${id}` });
        },

        approveExtension: (id, milestoneId) => {
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            if (m.pendingExtension) {
              m.deliveryDeadline = m.pendingExtension.newDeadline;
              if (m.status === 'delivery-overdue') m.status = 'in-progress';
              m.pendingExtension = undefined;
            }
            return p;
          });
          pushActivity({ projectId: id, actor: 'stakeholder', action: 'Extension approved', detail: 'Approved a new delivery deadline.', milestoneId });
          notify({ audience: 'implementer', projectId: id, title: 'Extension approved', body: 'Your new deadline was approved.', link: `/project/${id}` });
        },

        claimReviewTimeout: (id, milestoneId) => {
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            m.status = 'review-expired';
            return p;
          });
          pushActivity({ projectId: id, actor: 'implementer', action: 'Review timeout claimed', detail: 'The review period expired without a decision.', milestoneId });
          notify({ audience: 'stakeholder', projectId: id, title: 'Review period expired', body: 'Take a final action before the timeout rule applies.', link: `/project/${id}` });
        },

        // ---------- amendments ----------
        proposeAmendment: (id, data) => {
          patchProject(id, (p) => {
            const amendment: Amendment = {
              id: uid('amd'), createdAt: now(), proposedBy: get().currentRole,
              reason: data.reason, affectedMilestones: data.affectedMilestones,
              oldWording: data.oldWording, newWording: data.newWording,
              paymentDifference: data.paymentDifference, deadlineDifferenceDays: data.deadlineDifferenceDays,
              status: 'proposed', signatures: [],
            };
            p.amendments.push(amendment);
            return p;
          });
          pushActivity({ projectId: id, actor: get().currentRole, action: 'Amendment proposed', detail: data.reason });
          const other: Role = get().currentRole === 'stakeholder' ? 'implementer' : 'stakeholder';
          notify({ audience: other, projectId: id, title: 'Amendment proposed', body: data.reason, link: `/project/${id}` });
        },

        decideAmendment: (id, amendmentId, decision) => {
          patchProject(id, (p) => {
            const a = p.amendments.find((x) => x.id === amendmentId)!;
            a.status = decision;
            if (decision === 'approved') {
              a.paymentDifference && (p.totalBudget += a.paymentDifference);
              if (a.paymentDifference > 0) p.funds.future += a.paymentDifference;
              makeVersion(p, `Amendment: ${a.reason}`);
            }
            return p;
          });
          pushActivity({ projectId: id, actor: get().currentRole, action: `Amendment ${decision}`, detail: '' });
        },

        // ---------- disputes ----------
        openDispute: (id, milestoneId, claim) => {
          const p0 = get().projects.find((x) => x.id === id)!;
          const m0 = p0.milestones.find((x) => x.id === milestoneId)!;
          const dispute: Dispute = {
            id: uid('dsp'), projectId: id, milestoneId, lockedMilestoneVersion: p0.currentVersion,
            amount: m0.paymentAmount, openedBy: get().currentRole,
            stakeholderClaim: claim, evidence: [], evidenceDeadline: daysFromNow(5),
            status: 'evidence', createdAt: now(),
          };
          set((s) => ({ disputes: [dispute, ...s.disputes] }));
          patchProject(id, (p) => {
            const m = p.milestones.find((x) => x.id === milestoneId)!;
            m.status = 'disputed';
            m.disputeId = dispute.id;
            // move funds to disputed bucket
            if (p.funds.active >= m.paymentAmount) { p.funds.active -= m.paymentAmount; }
            else { p.funds.future -= m.paymentAmount; }
            p.funds.disputed += m.paymentAmount;
            p.status = 'in-dispute';
            return p;
          });
          pushActivity({ projectId: id, actor: get().currentRole, action: 'Dispute opened', detail: claim, milestoneId });
          notify({ audience: 'arbiter', projectId: id, title: 'New dispute', body: 'A dispute needs resolution.', link: `/disputes` });
          notify({ audience: 'implementer', projectId: id, title: 'Dispute opened', body: claim, link: `/disputes` });
        },

        respondDispute: (disputeId, response) => {
          set((s) => ({ disputes: s.disputes.map((d) => d.id === disputeId ? { ...d, implementerResponse: response } : d) }));
          const d = get().disputes.find((x) => x.id === disputeId)!;
          pushActivity({ projectId: d.projectId, actor: 'implementer', action: 'Dispute response', detail: response, milestoneId: d.milestoneId });
        },

        addDisputeEvidence: (disputeId, ev) => {
          set((s) => ({ disputes: s.disputes.map((d) => d.id === disputeId ? { ...d, evidence: [...d.evidence, { ...ev, at: new Date().toISOString() }] } : d) }));
          const d = get().disputes.find((x) => x.id === disputeId)!;
          pushActivity({ projectId: d.projectId, actor: ev.by, action: 'Evidence submitted', detail: ev.label, milestoneId: d.milestoneId });
        },

        resolveDispute: (disputeId, outcome, implementerAmount, stakeholderAmount, explanation) => {
          const d = get().disputes.find((x) => x.id === disputeId)!;
          const p0 = get().projects.find((x) => x.id === d.projectId)!;
          const txId = fakeTxSignature();
          set((s) => ({
            disputes: s.disputes.map((x) => x.id === disputeId ? {
              ...x, status: 'resolved',
              resolution: {
                outcome, implementerAmount, stakeholderAmount, explanation,
                resolvedAt: new Date().toISOString(), signature: 'sim_' + hashObject({ disputeId, outcome }), txId,
              },
            } : x),
          }));
          if (implementerAmount > 0) addTx('split-settlement', d.projectId, implementerAmount, 'EscrowPDAdriu1111', p0.implementer?.wallet ?? 'implementer', d.milestoneId);
          if (stakeholderAmount > 0) addTx('refund', d.projectId, stakeholderAmount, 'EscrowPDAdriu1111', p0.stakeholder.wallet ?? 'stakeholder', d.milestoneId);
          patchProject(d.projectId, (p) => {
            const m = p.milestones.find((x) => x.id === d.milestoneId)!;
            p.funds.disputed -= d.amount;
            p.funds.released += implementerAmount;
            p.funds.refundable += stakeholderAmount;
            if (outcome === 'release-to-implementer') m.status = 'paid';
            else if (outcome === 'refund-to-stakeholder') m.status = 'refunded';
            else if (outcome === 'split') m.status = 'paid';
            else if (outcome === 'return-to-revision') m.status = 'revision-requested';
            else if (outcome === 'cancel-milestone') m.status = 'cancelled';
            recomputeReadiness(p);
            const openDisputes = get().disputes.filter((x) => x.projectId === p.id && x.status !== 'resolved' && x.id !== disputeId);
            if (openDisputes.length === 0) {
              const allSettled = p.milestones.every((x) => ['paid', 'cancelled', 'refunded'].includes(x.status));
              if (allSettled) { p.status = 'awaiting-closeout'; p.closeout = p.closeout ?? {}; } else { p.status = 'active'; }
            }
            return p;
          });
          pushActivity({ projectId: d.projectId, actor: 'arbiter', action: 'Dispute resolved', detail: explanation, milestoneId: d.milestoneId, txId });
          notify({ audience: 'stakeholder', projectId: d.projectId, title: 'Dispute resolved', body: explanation, link: `/disputes` });
          notify({ audience: 'implementer', projectId: d.projectId, title: 'Dispute resolved', body: explanation, link: `/disputes` });
        },

        // ---------- cancellation ----------
        cancelProject: (id) => {
          const p0 = get().projects.find((x) => x.id === id)!;
          let refund = 0;
          patchProject(id, (p) => {
            p.milestones.forEach((m) => {
              if (['locked', 'ready-to-start', 'blocked-by-dependency', 'scope-approved', 'draft', 'awaiting-scope-approval'].includes(m.status)) {
                refund += m.paymentAmount;
                m.status = 'refunded';
              }
            });
            p.funds.future -= refund;
            p.funds.refundable += refund;
            p.status = p.funds.released > 0 ? 'cancelled' : 'refunded';
            return p;
          });
          if (refund > 0) addTx('refund', id, refund, 'EscrowPDAdriu1111', p0.stakeholder.wallet ?? 'stakeholder');
          pushActivity({ projectId: id, actor: get().currentRole, action: 'Project cancelled', detail: `Cancelled project. ${refund.toLocaleString()} USDC refundable to Stakeholder.` });
        },

        // ---------- notifications ----------
        markNotificationRead: (nid) => set((s) => ({ notifications: s.notifications.map((n) => n.id === nid ? { ...n, read: true } : n) })),
        markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      };
    },
    {
      name: 'driu-store-v1',
      partialize: (s) => ({
        currentRole: s.currentRole,
        connected: s.connected,
        projects: s.projects,
        transactions: s.transactions,
        disputes: s.disputes,
        activity: s.activity,
        notifications: s.notifications,
      }),
    },
  ),
);
