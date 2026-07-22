// ---------- Roles & identity ----------
export type Role = 'stakeholder' | 'implementer' | 'arbiter';

export interface Party {
  id: string;
  role: Role;
  name: string;
  org?: string;
  email?: string;
  wallet?: string; // base58 pubkey (real or simulated)
  avatarColor?: string;
}

// ---------- Money ----------
export type Currency = 'USDC' | 'USDT' | 'SOL';

/** Where every part of the budget currently belongs. */
export interface FundBuckets {
  released: number;   // paid to implementer
  active: number;     // reserved for in-progress milestones
  future: number;     // allocated to not-yet-started milestones
  refundable: number; // returnable to stakeholder
  disputed: number;   // locked pending dispute resolution
}

// ---------- Milestone building blocks ----------
export interface RequiredEvidence {
  type: 'deployment-link' | 'document' | 'repository' | 'screenshot' | 'video' | 'other';
  label: string;
}

export interface DelayTerms {
  gracePeriodDays: number;
  actionAfterGracePeriod: string;
}

export type MilestoneStatus =
  | 'draft'
  | 'awaiting-scope-approval'
  | 'changes-requested'
  | 'scope-approved'
  | 'locked'
  | 'blocked-by-dependency'
  | 'ready-to-start'
  | 'in-progress'
  | 'submitted'
  | 'under-review'
  | 'revision-requested'
  | 'resubmitted'
  | 'approved'
  | 'payment-processing'
  | 'paid'
  | 'delivery-overdue'
  | 'review-expired'
  | 'disputed'
  | 'cancelled'
  | 'refunded';

export interface Submission {
  version: number;
  title: string;
  summary: string;
  deliverableChecklist: { label: string; done: boolean }[];
  evidenceLinks: { label: string; url: string }[];
  notes?: string;
  knownLimitations?: string;
  confirmedMatchesScope: boolean;
  hash: string;
  submittedAt: string;
  submittedBy: string;
}

export interface RevisionRequest {
  number: number;
  reason: string;
  failedCriteria: string[];
  requiredCorrection: string;
  deadline: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  order: number;
  title: string;
  description: string;
  paymentAmount: number;
  durationDays: number;
  dependencies: string[]; // milestone ids
  deliverables: string[];
  acceptanceCriteria: string[];
  requiredEvidence: RequiredEvidence[];
  reviewPeriodDays: number;
  revisionLimit: number;
  delayTerms: DelayTerms;

  // scope double-approval
  stakeholderScopeApproved: boolean;
  implementerScopeApproved: boolean;
  // completion double-verification
  implementerCompletionConfirmed: boolean;
  stakeholderCompletionApproved: boolean;

  status: MilestoneStatus;

  // runtime data
  startedAt?: string;
  deliveryDeadline?: string;
  reviewDeadline?: string;
  submissions: Submission[];
  revisionRequests: RevisionRequest[];
  revisionCount: number;
  disputeId?: string;
  pendingExtension?: {
    newDeadline: string;
    reason: string;
    impact: string;
    requestedBy: Role;
    requestedAt: string;
  };
}

// ---------- Global terms ----------
export interface GlobalTerms {
  reviewPeriodDays: number;
  revisionLimitPerMilestone: number;
  scopeChangesRequireBothSignatures: boolean;
  lateSubmissionGraceDays: number;
  allowPartialRefunds: boolean;
  allowSplitDisputeResolution: boolean;
  cancellationPolicy: string;
  disputePolicy: string;
  timeoutOutcome: 'auto-release' | 'escalate-arbiter' | 'pause-project' | 'mandatory-dispute';
}

// ---------- Documents ----------
export interface ProjectDoc {
  id: string;
  kind: 'requirements' | 'link' | 'reference' | 'design' | 'constraint' | 'exclusion';
  label: string;
  content: string;
  hash: string;
}

// ---------- Agreement versions & signatures ----------
export interface Signature {
  party: Role;
  wallet: string;
  signature: string;
  signedAt: string;
}

export interface AgreementVersion {
  version: number;
  hash: string;
  createdAt: string;
  note: string;
  snapshot: {
    milestones: Milestone[];
    globalTerms: GlobalTerms;
    totalBudget: number;
    docHashes: string[];
  };
  signatures: Signature[]; // both parties sign the same version
}

// ---------- Amendments ----------
export interface Amendment {
  id: string;
  createdAt: string;
  proposedBy: Role;
  reason: string;
  affectedMilestones: string[];
  oldWording: string;
  newWording: string;
  paymentDifference: number;
  deadlineDifferenceDays: number;
  status: 'proposed' | 'approved' | 'rejected' | 'changes-requested';
  signatures: Signature[];
}

// ---------- Disputes ----------
export type DisputeOutcome =
  | 'release-to-implementer'
  | 'refund-to-stakeholder'
  | 'split'
  | 'return-to-revision'
  | 'cancel-milestone';

export interface DisputeEvidence {
  by: Role;
  label: string;
  url?: string;
  note: string;
  at: string;
}

export interface Dispute {
  id: string;
  projectId: string;
  milestoneId: string;
  lockedMilestoneVersion: number;
  amount: number;
  openedBy: Role;
  stakeholderClaim: string;
  implementerResponse?: string;
  evidence: DisputeEvidence[];
  evidenceDeadline: string;
  status: 'open' | 'evidence' | 'resolved';
  resolution?: {
    outcome: DisputeOutcome;
    implementerAmount: number;
    stakeholderAmount: number;
    explanation: string;
    resolvedAt: string;
    signature: string;
    txId: string;
  };
  createdAt: string;
}

// ---------- Payments / transactions ----------
export type TxKind =
  | 'funding'
  | 'milestone-release'
  | 'refund'
  | 'split-settlement'
  | 'amendment-deposit';

export interface Transaction {
  id: string;        // mock signature
  kind: TxKind;
  projectId: string;
  milestoneId?: string;
  amount: number;
  currency: Currency;
  from: string;
  to: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  explorerUrl: string;
}

// ---------- Activity ----------
export interface ActivityEntry {
  id: string;
  projectId: string;
  actor: Role | 'assistant' | 'system';
  action: string;
  detail: string;
  milestoneId?: string;
  version?: number;
  txId?: string;
  at: string;
}

// ---------- Notifications ----------
export interface AppNotification {
  id: string;
  projectId?: string;
  audience: Role;
  title: string;
  body: string;
  link: string;
  read: boolean;
  at: string;
}

// ---------- Project ----------
export type ProjectStatus =
  | 'draft'
  | 'assistant-review'
  | 'stakeholder-editing'
  | 'awaiting-implementer-review'
  | 'changes-requested'
  | 'awaiting-final-scope-approval'
  | 'awaiting-signatures'
  | 'awaiting-funding'
  | 'funded'
  | 'active'
  | 'paused'
  | 'in-dispute'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface Project {
  id: string;
  title: string;
  category: string;
  summary: string;
  requirements: string;
  currency: Currency;
  totalBudget: number;
  estimatedDurationDays: number;
  desiredStartDate?: string;
  desiredCompletionDate?: string;
  confidential: boolean;

  stakeholder: Party;
  implementer?: Party;
  arbiter?: Party;

  documents: ProjectDoc[];
  globalTerms: GlobalTerms;
  milestones: Milestone[];

  status: ProjectStatus;
  currentVersion: number;
  versions: AgreementVersion[];
  amendments: Amendment[];

  funds: FundBuckets;
  fundedAmount: number;

  createdAt: string;
  updatedAt: string;
}
