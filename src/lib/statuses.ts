import type { MilestoneStatus, ProjectStatus } from '../types';

export interface StatusMeta {
  label: string;
  // tailwind classes for chip
  cls: string;
  dot: string;
}

const NEUTRAL = 'bg-white/8 text-white/70 border border-white/10';
const PURPLE = 'bg-sol-purple/15 text-sol-purple border border-sol-purple/30';
const GREEN = 'bg-sol-green/15 text-sol-green border border-sol-green/30';
const BLUE = 'bg-sol-blue/15 text-sol-blue border border-sol-blue/30';
const AMBER = 'bg-amber-400/15 text-amber-300 border border-amber-400/30';
const RED = 'bg-red-500/15 text-red-300 border border-red-500/30';

export const PROJECT_STATUS: Record<ProjectStatus, StatusMeta> = {
  'draft': { label: 'Draft', cls: NEUTRAL, dot: 'bg-white/40' },
  'assistant-review': { label: 'Assistant Review', cls: PURPLE, dot: 'bg-sol-purple' },
  'stakeholder-editing': { label: 'Editing', cls: PURPLE, dot: 'bg-sol-purple' },
  'awaiting-implementer-review': { label: 'Awaiting Implementer', cls: AMBER, dot: 'bg-amber-300' },
  'changes-requested': { label: 'Changes Requested', cls: AMBER, dot: 'bg-amber-300' },
  'awaiting-final-scope-approval': { label: 'Awaiting Scope Approval', cls: AMBER, dot: 'bg-amber-300' },
  'awaiting-signatures': { label: 'Awaiting Signatures', cls: BLUE, dot: 'bg-sol-blue' },
  'awaiting-funding': { label: 'Awaiting Funding', cls: BLUE, dot: 'bg-sol-blue' },
  'funded': { label: 'Funded', cls: GREEN, dot: 'bg-sol-green' },
  'active': { label: 'Active', cls: GREEN, dot: 'bg-sol-green' },
  'paused': { label: 'Paused', cls: AMBER, dot: 'bg-amber-300' },
  'in-dispute': { label: 'In Dispute', cls: RED, dot: 'bg-red-400' },
  'awaiting-closeout': { label: 'Awaiting Close-out', cls: BLUE, dot: 'bg-sol-blue' },
  'completed': { label: 'Completed', cls: GREEN, dot: 'bg-sol-green' },
  'cancelled': { label: 'Cancelled', cls: NEUTRAL, dot: 'bg-white/40' },
  'refunded': { label: 'Refunded', cls: NEUTRAL, dot: 'bg-white/40' },
};

export const MILESTONE_STATUS: Record<MilestoneStatus, StatusMeta> = {
  'draft': { label: 'Draft', cls: NEUTRAL, dot: 'bg-white/40' },
  'awaiting-scope-approval': { label: 'Awaiting Scope Approval', cls: AMBER, dot: 'bg-amber-300' },
  'changes-requested': { label: 'Changes Requested', cls: AMBER, dot: 'bg-amber-300' },
  'scope-approved': { label: 'Scope Approved', cls: BLUE, dot: 'bg-sol-blue' },
  'locked': { label: 'Locked', cls: PURPLE, dot: 'bg-sol-purple' },
  'blocked-by-dependency': { label: 'Blocked by Dependency', cls: NEUTRAL, dot: 'bg-white/40' },
  'ready-to-start': { label: 'Ready to Start', cls: GREEN, dot: 'bg-sol-green' },
  'in-progress': { label: 'In Progress', cls: BLUE, dot: 'bg-sol-blue' },
  'submitted': { label: 'Submitted', cls: PURPLE, dot: 'bg-sol-purple' },
  'under-review': { label: 'Under Review', cls: AMBER, dot: 'bg-amber-300' },
  'revision-requested': { label: 'Revision Requested', cls: AMBER, dot: 'bg-amber-300' },
  'resubmitted': { label: 'Resubmitted', cls: PURPLE, dot: 'bg-sol-purple' },
  'approved': { label: 'Approved', cls: GREEN, dot: 'bg-sol-green' },
  'payment-processing': { label: 'Payment Processing', cls: BLUE, dot: 'bg-sol-blue' },
  'paid': { label: 'Paid', cls: GREEN, dot: 'bg-sol-green' },
  'delivery-overdue': { label: 'Delivery Overdue', cls: RED, dot: 'bg-red-400' },
  'review-expired': { label: 'Review Expired', cls: RED, dot: 'bg-red-400' },
  'disputed': { label: 'Disputed', cls: RED, dot: 'bg-red-400' },
  'cancelled': { label: 'Cancelled', cls: NEUTRAL, dot: 'bg-white/40' },
  'refunded': { label: 'Refunded', cls: NEUTRAL, dot: 'bg-white/40' },
};

export const ROLE_LABEL: Record<string, string> = {
  stakeholder: 'Stakeholder',
  implementer: 'Implementer',
  arbiter: 'Arbiter',
  assistant: 'Assistant',
  system: 'System',
};
