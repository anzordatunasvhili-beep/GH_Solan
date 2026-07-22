import type { GlobalTerms, Milestone } from '../types';

export interface ValidationIssue {
  level: 'error' | 'warn';
  message: string;
  milestoneId?: string;
}

export function validateAgreement(
  milestones: Milestone[],
  globalTerms: GlobalTerms,
  totalBudget: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const sum = milestones.reduce((a, m) => a + m.paymentAmount, 0);
  if (sum !== totalBudget) {
    issues.push({ level: 'error', message: `Milestone payments total ${sum} but the budget is ${totalBudget}. They must match exactly.` });
  }
  if (milestones.length === 0) {
    issues.push({ level: 'error', message: 'The project has no milestones.' });
  }

  const ids = new Set(milestones.map((m) => m.id));
  for (const m of milestones) {
    if (!m.title.trim()) issues.push({ level: 'error', message: 'A milestone is missing a title.', milestoneId: m.id });
    if (!m.description.trim()) issues.push({ level: 'error', message: `"${m.title || m.id}" has no description.`, milestoneId: m.id });
    if (m.deliverables.filter((d) => d.trim()).length === 0) issues.push({ level: 'error', message: `"${m.title}" has no deliverables.`, milestoneId: m.id });
    if (m.acceptanceCriteria.filter((c) => c.trim()).length === 0) issues.push({ level: 'error', message: `"${m.title}" has no acceptance criteria.`, milestoneId: m.id });
    if (!(m.paymentAmount > 0)) issues.push({ level: 'error', message: `"${m.title}" must have a payment amount greater than zero.`, milestoneId: m.id });
    if (!(m.durationDays > 0)) issues.push({ level: 'error', message: `"${m.title}" must have a duration.`, milestoneId: m.id });
    if (!(m.reviewPeriodDays > 0)) issues.push({ level: 'error', message: `"${m.title}" must have a review period.`, milestoneId: m.id });
    for (const dep of m.dependencies) {
      if (!ids.has(dep)) issues.push({ level: 'error', message: `"${m.title}" depends on an unknown milestone (${dep}).`, milestoneId: m.id });
    }
  }

  if (hasCycle(milestones)) {
    issues.push({ level: 'error', message: 'Circular dependencies detected between milestones.' });
  }

  if (!globalTerms.cancellationPolicy.trim()) issues.push({ level: 'error', message: 'Cancellation rules are required.' });
  if (!globalTerms.disputePolicy.trim()) issues.push({ level: 'error', message: 'Dispute rules are required.' });
  if (!globalTerms.scopeChangesRequireBothSignatures) issues.push({ level: 'warn', message: 'Scope changes should require both signatures for safety.' });

  return issues;
}

function hasCycle(milestones: Milestone[]): boolean {
  const graph = new Map(milestones.map((m) => [m.id, m.dependencies]));
  const state = new Map<string, 0 | 1 | 2>(); // 0 unvisited, 1 visiting, 2 done
  const visit = (id: string): boolean => {
    const s = state.get(id) ?? 0;
    if (s === 1) return true;
    if (s === 2) return false;
    state.set(id, 1);
    for (const dep of graph.get(id) ?? []) {
      if (graph.has(dep) && visit(dep)) return true;
    }
    state.set(id, 2);
    return false;
  };
  for (const m of milestones) if (visit(m.id)) return true;
  return false;
}

export function isValid(issues: ValidationIssue[]): boolean {
  return !issues.some((i) => i.level === 'error');
}
