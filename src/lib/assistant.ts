import type { GlobalTerms, Milestone, RequiredEvidence } from '../types';
import { uid } from './id';

export interface AssistantInput {
  title: string;
  category: string;
  summary: string;
  requirements: string;
  totalBudget: number;
  estimatedDurationDays: number;
}

export interface AssistantAnalysis {
  clarifications: string[];
  risks: { level: 'info' | 'warn' | 'high'; message: string }[];
}

interface Template {
  key: string;
  title: string;
  description: string;
  weight: number; // share of budget/time
  deliverables: string[];
  acceptanceCriteria: string[];
  evidence: RequiredEvidence[];
}

function templatesFor(category: string, text: string): Template[] {
  const t = (category + ' ' + text).toLowerCase();
  const web = /(website|web app|landing|marketing site|web platform|portal|dashboard)/.test(t);
  const mobile = /(mobile|ios|android|react native|flutter|app store)/.test(t);
  const design = /(brand|logo|design|ui|ux|figma)/.test(t);

  if (mobile) {
    return [
      tpl('discovery', 'Discovery & Technical Specification', 'Finalize product scope, user flows, and a written technical specification for the mobile application.', 0.15,
        ['Signed-off feature list', 'User flow diagrams', 'Technical specification document'],
        ['Specification covers every mandatory feature listed in the brief', 'All primary user flows are documented with screens', 'Target OS versions and devices are explicitly defined'],
        [ev('document', 'Technical specification')]),
      tpl('design', 'UI/UX Design', 'Deliver high-fidelity designs for all core screens with a reusable component library.', 0.2,
        ['High-fidelity screens for all core flows', 'Reusable component library', 'Interactive prototype'],
        ['Every screen in the agreed flow list is designed', 'Design system defines colors, typography, and spacing tokens', 'Prototype demonstrates the primary user journey end-to-end'],
        [ev('deployment-link', 'Prototype link'), ev('document', 'Design source file')]),
      tpl('build-core', 'Core App Build', 'Implement the primary application features and screens against the approved designs.', 0.3,
        ['Implemented core screens', 'Working navigation', 'State management wired to mock/live data'],
        ['All core screens from design are implemented and navigable', 'App builds and runs on the agreed OS versions', 'No blocking crashes in the primary user journey'],
        [ev('repository', 'Source repository'), ev('video', 'Screen recording of core flows')]),
      tpl('integrations', 'Backend & Integrations', 'Connect the app to backend services, authentication, and required third-party APIs.', 0.2,
        ['Authentication implemented', 'Live API integration', 'Error and loading states'],
        ['Users can sign in and persist a session', 'Data is fetched from and written to the live backend', 'Failure states are handled without crashes'],
        [ev('deployment-link', 'Test build (TestFlight/APK)')]),
      tpl('launch', 'QA, Store Submission & Handover', 'Complete QA, prepare store assets, and submit to the app stores with documentation handover.', 0.15,
        ['QA test report', 'Store listing assets', 'Submitted build', 'Handover documentation'],
        ['All critical and high-severity bugs are resolved', 'Store submission is accepted for review', 'Handover docs allow another developer to build the project'],
        [ev('document', 'QA report'), ev('screenshot', 'Store submission confirmation')]),
    ];
  }

  if (design && !web) {
    return [
      tpl('discovery', 'Brand Discovery', 'Research, moodboards, and a written creative direction agreed with the stakeholder.', 0.2,
        ['Creative brief', 'Two moodboard directions'],
        ['Creative direction is documented and approved', 'Moodboards reflect the stated brand values'],
        [ev('document', 'Creative brief')]),
      tpl('concepts', 'Logo & Concepts', 'Deliver primary logo concepts with rationale.', 0.3,
        ['Three logo concepts', 'Written rationale per concept'],
        ['Each concept is delivered in vector format', 'Concepts are legible at small and large sizes'],
        [ev('document', 'Concept presentation')]),
      tpl('system', 'Brand System', 'Colors, typography, and usage guidelines.', 0.3,
        ['Color palette', 'Typography scale', 'Logo usage rules'],
        ['Palette includes accessible contrast pairings', 'Usage guidelines cover clear-space and misuse'],
        [ev('document', 'Brand guidelines PDF')]),
      tpl('handover', 'Asset Handover', 'Export all final assets in required formats.', 0.2,
        ['Vector and raster exports', 'Source files', 'Handover index'],
        ['All assets exported in agreed formats', 'Source files are organized and named consistently'],
        [ev('document', 'Asset package')]),
    ];
  }

  // default: website / generic software
  return [
    tpl('discovery', 'Discovery & Requirements Sign-off', 'Confirm scope, sitemap, and a written requirements document both parties agree on before design begins.', 0.15,
      ['Approved sitemap', 'Written requirements document', 'Content & asset checklist'],
      ['Sitemap lists every page to be delivered', 'Requirements document covers all mandatory features', 'Responsibilities for content and assets are assigned in writing'],
      [ev('document', 'Requirements document')]),
    tpl('design', 'Design & Prototype', 'Deliver a high-fidelity, responsive design for all agreed pages plus an interactive prototype.', 0.2,
      ['High-fidelity design for all pages', 'Mobile and desktop layouts', 'Interactive prototype'],
      ['Every page in the approved sitemap has a design', 'Designs include mobile and desktop breakpoints', 'Prototype links the primary navigation paths'],
      [ev('deployment-link', 'Prototype link'), ev('document', 'Design source file')]),
    tpl('build', 'Front-End Build', 'Implement the approved design as a responsive, functional front-end.', 0.3,
      ['Responsive implementation of all pages', 'Working navigation and interactions', 'Cross-browser compatibility'],
      ['All designed pages are implemented and responsive', 'Site renders correctly on the agreed browsers', 'No broken links in the primary navigation'],
      [ev('deployment-link', 'Staging deployment'), ev('repository', 'Source repository')]),
    tpl('integrations', 'Integrations & CMS', 'Connect forms, analytics, CMS, and any required third-party services.', 0.2,
      ['Working contact/lead forms', 'CMS for editable content', 'Analytics installed'],
      ['Forms deliver submissions to the agreed destination', 'Stakeholder can edit the agreed content areas via the CMS', 'Analytics records page views on all pages'],
      [ev('deployment-link', 'Staging with integrations'), ev('document', 'CMS editing guide')]),
    tpl('launch', 'Launch & Handover', 'Deploy to production, run final QA, and hand over documentation and access.', 0.15,
      ['Production deployment', 'QA checklist', 'Handover documentation & access'],
      ['Site is live on the production domain', 'All critical and high-severity issues are resolved', 'Stakeholder receives full access and handover documentation'],
      [ev('deployment-link', 'Production URL'), ev('document', 'Handover documentation')]),
  ];
}

function ev(type: RequiredEvidence['type'], label: string): RequiredEvidence {
  return { type, label };
}
function tpl(key: string, title: string, description: string, weight: number, deliverables: string[], acceptanceCriteria: string[], evidence: RequiredEvidence[]): Template {
  return { key, title, description, weight, deliverables, acceptanceCriteria, evidence };
}

/** Distribute a total across weights so the parts sum EXACTLY to total (integer amounts). */
function distribute(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floored = raw.map((r) => Math.floor(r));
  let remainder = total - floored.reduce((a, b) => a + b, 0);
  // hand out the remainder to the largest fractional parts
  const fracOrder = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floored];
  for (let k = 0; k < remainder; k++) result[fracOrder[k % result.length].i] += 1;
  return result;
}

export function defaultGlobalTerms(input: AssistantInput): GlobalTerms {
  return {
    reviewPeriodDays: 5,
    revisionLimitPerMilestone: 2,
    scopeChangesRequireBothSignatures: true,
    lateSubmissionGraceDays: 2,
    allowPartialRefunds: true,
    allowSplitDisputeResolution: true,
    cancellationPolicy:
      'Either party may propose cancellation. Released funds for approved milestones are non-refundable. Funds allocated to milestones that have not started are refundable to the Stakeholder. Active milestone funds follow the dispute rules if contested.',
    disputePolicy:
      'A dispute may be opened on a submitted milestone or a contract-rule violation. Disputed funds are locked until an Arbiter resolves them by release, refund, split, return-to-revision, or cancellation.',
    timeoutOutcome: 'escalate-arbiter',
  };
}

export function generateMilestones(input: AssistantInput): Milestone[] {
  const templates = templatesFor(input.category, input.summary + ' ' + input.requirements);
  const amounts = distribute(input.totalBudget, templates.map((t) => t.weight));
  const durations = distribute(input.estimatedDurationDays, templates.map((t) => t.weight));

  const milestones: Milestone[] = templates.map((t, i) => {
    const id = `milestone-${String(i + 1).padStart(3, '0')}`;
    return {
      id,
      order: i + 1,
      title: t.title,
      description: t.description,
      paymentAmount: amounts[i],
      durationDays: Math.max(3, durations[i]),
      dependencies: i === 0 ? [] : [`milestone-${String(i).padStart(3, '0')}`],
      deliverables: [...t.deliverables],
      acceptanceCriteria: [...t.acceptanceCriteria],
      requiredEvidence: [...t.evidence],
      reviewPeriodDays: 5,
      revisionLimit: 2,
      delayTerms: { gracePeriodDays: 2, actionAfterGracePeriod: 'Stakeholder may request an extension, cancel per the agreement, or open a dispute.' },
      stakeholderScopeApproved: false,
      implementerScopeApproved: false,
      implementerCompletionConfirmed: false,
      stakeholderCompletionApproved: false,
      status: 'draft',
      submissions: [],
      revisionRequests: [],
      revisionCount: 0,
    };
  });
  return milestones;
}

export function analyze(input: AssistantInput, milestones: Milestone[]): AssistantAnalysis {
  const clarifications: string[] = [];
  const risks: AssistantAnalysis['risks'] = [];

  if (input.requirements.trim().length < 160) {
    clarifications.push('The requirements are fairly short. Can you describe the mandatory features and what is explicitly out of scope?');
  }
  if (!/content|copy|text|assets|images/i.test(input.requirements)) {
    clarifications.push('Who is responsible for providing content and assets (copy, images, logos)?');
  }
  if (!/(deadline|launch|date|weeks|months)/i.test(input.requirements) && !input.estimatedDurationDays) {
    clarifications.push('Is there a hard launch date or external deadline we must design milestones around?');
  }
  clarifications.push('Which browsers, devices, or platforms must be officially supported?');

  const total = milestones.reduce((a, m) => a + m.paymentAmount, 0);
  if (total !== input.totalBudget) {
    risks.push({ level: 'high', message: `Milestone payments (${total}) do not match the total budget (${input.totalBudget}).` });
  }
  for (const m of milestones) {
    const share = m.paymentAmount / (input.totalBudget || 1);
    if (share > 0.45) {
      risks.push({ level: 'warn', message: `"${m.title}" holds ${Math.round(share * 100)}% of the budget — consider splitting it to reduce financial exposure per approval.` });
    }
  }
  if (milestones.length > 8) {
    risks.push({ level: 'warn', message: `${milestones.length} milestones may create excessive approvals and micromanagement. Each milestone should be a meaningful, independently reviewable result.` });
  }
  if (milestones.length < 2) {
    risks.push({ level: 'warn', message: 'A single milestone gives the stakeholder little staged protection. Consider at least 3 reviewable milestones.' });
  }
  const totalDuration = milestones.reduce((a, m) => a + m.durationDays, 0);
  if (input.estimatedDurationDays && totalDuration > input.estimatedDurationDays + 3) {
    risks.push({ level: 'warn', message: `Milestone durations sum to ${totalDuration} days but the target duration is ${input.estimatedDurationDays} days. Deadlines may be unrealistic.` });
  }
  risks.push({ level: 'info', message: 'Acceptance criteria are written to be measurable, but creative quality still requires human review via revisions or disputes — the platform does not judge subjective quality automatically.' });

  return { clarifications, risks };
}
