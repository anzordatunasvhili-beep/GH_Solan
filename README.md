# DRIU — Milestone-Based Product Development Escrow

**Define it together. Lock it together. Pay as it is delivered.**

DRIU is a milestone-based escrow platform for product-development agreements between a
**Stakeholder** (who funds the work) and an **Implementer** (who delivers it). An assistant
turns a project brief into measurable milestones, both parties approve the exact scope, the
full budget is secured in escrow, and payments are released only as milestones are delivered
and accepted. An optional **Arbiter** resolves disputes.

> Built for the Superteam Solana Hackathon. This build uses a **simulated on-chain layer**:
> real Phantom/Solflare wallet connection and message signing, deterministic agreement/
> submission hashing, mock devnet transaction signatures with Explorer links, and escrow
> accounting persisted in the browser. The architecture leaves clean seams to swap in real
> on-chain programs.

## Features

- **Guided project creation** — brief → assistant analysis (clarifications + risk checks) →
  editable milestones → review & send.
- **Double approval** — scope is approved by both parties before work begins, and again after
  delivery, before any payment is released.
- **Versioned, signed agreements** — deterministic hashing + wallet `signMessage`; any change
  creates a new version that must be re-signed. Signed versions are immutable.
- **Escrow + staged payments** — the full budget is funded upfront; approving a milestone
  releases only that amount. Funds are tracked as released / active / future / refundable /
  disputed.
- **Full lifecycle** — start, submit (with evidence), review, revision, delivery extensions,
  review timeouts, amendments, cancellation.
- **Disputes** — Arbiter resolves via release / refund / split / return-to-revision / cancel.
- **Transparency** — per-project activity/audit trail, payments history, and notifications.
- **Role switching** — demo all three roles (Stakeholder / Implementer / Arbiter) in one browser.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS (solana.com-inspired dark theme)
- Zustand (state + localStorage persistence)
- React Router
- lucide-react icons

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Build:

```bash
npm run build
npm run preview
```

## Demo flow

1. Connect a wallet (Phantom/Solflare, or the built-in **Demo Wallet**).
2. Create a project or open the seeded "Business Website Development" example.
3. Use the **role switcher** (top bar) to act as both parties:
   send → approve scope (Implementer) → confirm scope (Stakeholder) → both sign → fund →
   start → submit → approve & release.
4. For the dispute path: open a dispute as Stakeholder, then switch to **Arbiter** to
   split-settle the locked funds.

## Project structure

```
src/
  components/   UI primitives, app shell, milestone editor
  lib/          assistant, validation, hashing, wallet, formatting, seed data
  pages/        landing, dashboard, create, project detail, disputes, etc.
  store/        Zustand store (all lifecycle actions + persistence)
  types.ts      domain model
```

## Disclaimer

DRIU reduces risk through structured scope, escrow, staged payments, and verifiable
approvals. It does not guarantee outcomes and does not automatically judge subjective quality
— disagreements are handled through revisions, timeouts, and disputes.
