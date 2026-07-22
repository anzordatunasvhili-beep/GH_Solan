import type { Dispute, Project, Role } from '../types';
import { daysUntil } from './format';

export interface ActionItem {
  id: string;
  title: string;
  detail: string;
  projectId: string;
  link: string;
  urgency: 'normal' | 'high';
}

const UNDER_REVIEW = ['submitted', 'under-review', 'resubmitted', 'review-expired'];

export function actionItems(projects: Project[], disputes: Dispute[], role: Role): ActionItem[] {
  const items: ActionItem[] = [];
  const add = (i: Omit<ActionItem, 'urgency'> & { urgency?: ActionItem['urgency'] }) =>
    items.push({ urgency: 'normal', ...i });

  for (const p of projects) {
    const link = `/project/${p.id}`;
    const v = p.versions[p.versions.length - 1];
    const signed = (r: Role) => v?.signatures.some((s) => s.party === r);

    if (p.status === 'awaiting-closeout' && (role === 'stakeholder' || role === 'implementer')) {
      const confirmed = role === 'stakeholder' ? p.closeout?.stakeholderConfirmedAt : p.closeout?.implementerConfirmedAt;
      if (!confirmed)
        add({ id: p.id + '-closeout', title: 'Confirm project close-out', detail: p.title, projectId: p.id, link, urgency: 'high' });
    }

    if (role === 'stakeholder') {
      if (p.status === 'awaiting-final-scope-approval')
        add({ id: p.id + '-scope', title: 'Confirm milestone scope', detail: p.title, projectId: p.id, link });
      if (p.status === 'awaiting-signatures' && !signed('stakeholder'))
        add({ id: p.id + '-sign', title: 'Sign the agreement', detail: p.title, projectId: p.id, link, urgency: 'high' });
      if (p.status === 'awaiting-funding')
        add({ id: p.id + '-fund', title: 'Fund the escrow', detail: p.title, projectId: p.id, link, urgency: 'high' });
      for (const m of p.milestones) {
        if (UNDER_REVIEW.includes(m.status))
          add({ id: m.id + '-review', title: `Review “${m.title}”`, detail: p.title, projectId: p.id, link, urgency: m.status === 'review-expired' ? 'high' : 'normal' });
        if (m.pendingExtension)
          add({ id: m.id + '-ext', title: `Approve extension for “${m.title}”`, detail: p.title, projectId: p.id, link });
      }
      for (const a of p.amendments) if (a.status === 'proposed' && a.proposedBy === 'implementer')
        add({ id: a.id + '-amd', title: 'Review proposed amendment', detail: p.title, projectId: p.id, link });
    }

    if (role === 'implementer') {
      if (p.status === 'awaiting-implementer-review' || p.status === 'changes-requested')
        add({ id: p.id + '-approve', title: 'Review & approve scope', detail: p.title, projectId: p.id, link, urgency: 'high' });
      if (p.status === 'awaiting-signatures' && !signed('implementer'))
        add({ id: p.id + '-sign', title: 'Sign the agreement', detail: p.title, projectId: p.id, link, urgency: 'high' });
      for (const m of p.milestones) {
        if (m.status === 'ready-to-start')
          add({ id: m.id + '-start', title: `Start “${m.title}”`, detail: p.title, projectId: p.id, link });
        if (m.status === 'in-progress')
          add({ id: m.id + '-submit', title: `Deliver “${m.title}”`, detail: p.title, projectId: p.id, link, urgency: m.deliveryDeadline && daysUntil(m.deliveryDeadline) <= 2 ? 'high' : 'normal' });
        if (m.status === 'revision-requested')
          add({ id: m.id + '-rev', title: `Submit revision for “${m.title}”`, detail: p.title, projectId: p.id, link, urgency: 'high' });
      }
      for (const a of p.amendments) if (a.status === 'proposed' && a.proposedBy === 'stakeholder')
        add({ id: a.id + '-amd', title: 'Review proposed amendment', detail: p.title, projectId: p.id, link });
    }
  }

  if (role === 'arbiter') {
    for (const d of disputes) if (d.status !== 'resolved') {
      const p = projects.find((x) => x.id === d.projectId);
      add({ id: d.id + '-dsp', title: 'Resolve dispute', detail: p?.title ?? '', projectId: d.projectId, link: '/disputes', urgency: 'high' });
    }
  }

  return items;
}

export function projectProgress(p: Project): number {
  if (p.milestones.length === 0) return 0;
  const paid = p.milestones.filter((m) => m.status === 'paid').length;
  return Math.round((paid / p.milestones.length) * 100);
}

export function currentMilestone(p: Project) {
  return p.milestones.find((m) => !['paid', 'cancelled', 'refunded'].includes(m.status)) ?? p.milestones[p.milestones.length - 1];
}
