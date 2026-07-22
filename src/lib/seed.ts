import type { ActivityEntry, Party, Project, Transaction } from '../types';
import { generateMilestones, defaultGlobalTerms } from './assistant';
import { hashObject } from './hash';
import { daysFromNow } from './format';
import { fakeTxSignature } from './id';
import { explorerTx } from './wallet';

export const DEMO_PARTIES: Record<string, Party> = {
  stakeholder: {
    id: 'party-stakeholder',
    role: 'stakeholder',
    name: 'Alex Rivera',
    org: 'Northwind Ventures',
    email: 'alex@northwind.vc',
    wallet: '7xKStakeHoLDeRw1nDXfa2mVQ8dGpZ4hJ6bNqR3cTuVy',
    avatarColor: '#9945FF',
  },
  implementer: {
    id: 'party-implementer',
    role: 'implementer',
    name: 'Jordan Kim',
    org: 'Pixel Forge Studio',
    email: 'jordan@pixelforge.dev',
    wallet: '4mPImpLeMenTeRk9jHsW2QxVz7Yb1cRnT5dFgA6uLpEo',
    avatarColor: '#14F195',
  },
  arbiter: {
    id: 'party-arbiter',
    role: 'arbiter',
    name: 'Sam Okafor',
    org: 'DRIU Arbitration',
    email: 'sam@driu.xyz',
    wallet: '9qArBiTeRz3kLmN8pXyW4vQ7dRt2cFbH6jsA1uGeoPY',
    avatarColor: '#00C2FF',
  },
};

interface SeedResult {
  projects: Project[];
  transactions: Transaction[];
  activity: ActivityEntry[];
}

export function buildSeed(): SeedResult {
  const now = new Date().toISOString();
  const transactions: Transaction[] = [];
  const activity: ActivityEntry[] = [];

  const input = {
    title: 'Business Website Development',
    category: 'Website',
    summary: 'A modern marketing website for a B2B SaaS company with a CMS, lead capture, and analytics.',
    requirements:
      'We need a responsive marketing website (home, product, pricing, about, blog, contact). Must include a headless CMS so our marketing team can edit content, lead-capture forms routed to HubSpot, and Google Analytics. Design should feel premium and modern. Content will be provided by our team. Must support latest Chrome, Safari, Firefox and Edge, plus mobile.',
    totalBudget: 30000,
    estimatedDurationDays: 60,
  };

  const milestones = generateMilestones(input);
  const globalTerms = defaultGlobalTerms(input);

  // Simulate agreement progress: signed, funded, M1 paid, M2 in progress.
  milestones.forEach((m) => {
    m.stakeholderScopeApproved = true;
    m.implementerScopeApproved = true;
    m.status = 'locked';
  });

  const projectId = 'proj-demo-website';

  // Milestone 1 — paid
  const m1 = milestones[0];
  m1.status = 'paid';
  m1.startedAt = daysFromNow(-40);
  m1.deliveryDeadline = daysFromNow(-33);
  m1.reviewDeadline = daysFromNow(-30);
  m1.implementerCompletionConfirmed = true;
  m1.stakeholderCompletionApproved = true;
  m1.submissions = [{
    version: 1,
    title: 'Discovery & requirements delivered',
    summary: 'Sitemap, requirements document, and content checklist delivered and approved.',
    deliverableChecklist: m1.deliverables.map((d) => ({ label: d, done: true })),
    evidenceLinks: [{ label: 'Requirements document', url: 'https://example.com/requirements.pdf' }],
    confirmedMatchesScope: true,
    hash: hashObject({ m: m1.id, v: 1 }),
    submittedAt: daysFromNow(-34),
    submittedBy: 'implementer',
  }];

  // Milestone 2 — in progress
  const m2 = milestones[1];
  m2.status = 'in-progress';
  m2.startedAt = daysFromNow(-20);
  m2.deliveryDeadline = daysFromNow(2);

  // Remaining milestones blocked by dependency
  for (let i = 2; i < milestones.length; i++) milestones[i].status = 'blocked-by-dependency';

  const snapshot = {
    milestones: JSON.parse(JSON.stringify(milestones)),
    globalTerms,
    totalBudget: input.totalBudget,
    docHashes: [hashObject(input.requirements)],
  };
  const versionHash = hashObject(snapshot);

  const released = m1.paymentAmount;
  const active = m2.paymentAmount;
  const future = milestones.slice(2).reduce((a, m) => a + m.paymentAmount, 0);

  const project: Project = {
    id: projectId,
    title: input.title,
    category: input.category,
    summary: input.summary,
    requirements: input.requirements,
    currency: 'USDC',
    totalBudget: input.totalBudget,
    estimatedDurationDays: input.estimatedDurationDays,
    desiredStartDate: daysFromNow(-45),
    desiredCompletionDate: daysFromNow(15),
    confidential: false,
    stakeholder: DEMO_PARTIES.stakeholder,
    implementer: DEMO_PARTIES.implementer,
    arbiter: DEMO_PARTIES.arbiter,
    documents: [
      { id: 'doc-1', kind: 'requirements', label: 'Project brief', content: input.requirements, hash: hashObject(input.requirements) },
      { id: 'doc-2', kind: 'exclusion', label: 'Out of scope', content: 'Copywriting, photography, and paid ad campaigns are out of scope.', hash: hashObject('exclusions') },
    ],
    globalTerms,
    milestones,
    status: 'active',
    currentVersion: 1,
    versions: [{
      version: 1,
      hash: versionHash,
      createdAt: daysFromNow(-42),
      note: 'Initial signed agreement',
      snapshot,
      signatures: [
        { party: 'stakeholder', wallet: DEMO_PARTIES.stakeholder.wallet!, signature: 'sim_' + versionHash.slice(0, 40), signedAt: daysFromNow(-42) },
        { party: 'implementer', wallet: DEMO_PARTIES.implementer.wallet!, signature: 'sim_' + versionHash.slice(8, 48), signedAt: daysFromNow(-42) },
      ],
    }],
    amendments: [],
    funds: { released, active, future, refundable: 0, disputed: 0 },
    fundedAmount: input.totalBudget,
    createdAt: daysFromNow(-45),
    updatedAt: now,
  };

  const fundTx: Transaction = {
    id: fakeTxSignature(), kind: 'funding', projectId, amount: input.totalBudget, currency: 'USDC',
    from: DEMO_PARTIES.stakeholder.wallet!, to: 'EscrowPDAdriu' + '1111', status: 'confirmed',
    createdAt: daysFromNow(-42), explorerUrl: '',
  };
  fundTx.explorerUrl = explorerTx(fundTx.id);
  const releaseTx: Transaction = {
    id: fakeTxSignature(), kind: 'milestone-release', projectId, milestoneId: m1.id, amount: m1.paymentAmount, currency: 'USDC',
    from: 'EscrowPDAdriu' + '1111', to: DEMO_PARTIES.implementer.wallet!, status: 'confirmed',
    createdAt: daysFromNow(-30), explorerUrl: '',
  };
  releaseTx.explorerUrl = explorerTx(releaseTx.id);
  transactions.push(fundTx, releaseTx);

  const act = (actor: ActivityEntry['actor'], action: string, detail: string, extra: Partial<ActivityEntry> = {}): ActivityEntry => ({
    id: 'act-' + Math.random().toString(36).slice(2, 9), projectId, actor, action, detail, at: daysFromNow(-42), ...extra,
  });
  activity.push(
    act('stakeholder', 'Project created', 'Created “Business Website Development”.', { at: daysFromNow(-45) }),
    act('assistant', 'Milestones generated', `Generated ${milestones.length} milestones from the brief.`, { at: daysFromNow(-45) }),
    act('stakeholder', 'Signed agreement', 'Signed agreement version 1.', { version: 1, at: daysFromNow(-42) }),
    act('implementer', 'Signed agreement', 'Signed agreement version 1.', { version: 1, at: daysFromNow(-42) }),
    act('stakeholder', 'Funded escrow', 'Deposited 30,000 USDC into escrow.', { txId: fundTx.id, at: daysFromNow(-42) }),
    act('implementer', 'Milestone submitted', `Submitted “${m1.title}”.`, { milestoneId: m1.id, at: daysFromNow(-34) }),
    act('stakeholder', 'Milestone approved', `Approved “${m1.title}”.`, { milestoneId: m1.id, at: daysFromNow(-30) }),
    act('system', 'Payment released', `Released ${m1.paymentAmount} USDC to implementer.`, { milestoneId: m1.id, txId: releaseTx.id, at: daysFromNow(-30) }),
    act('implementer', 'Milestone started', `Started “${m2.title}”.`, { milestoneId: m2.id, at: daysFromNow(-20) }),
  );

  return { projects: [project], transactions, activity };
}
