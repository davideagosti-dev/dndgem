import type { LayoutIntent, ResolvedLayout } from '@dndgem/core';

/**
 * Minimum structural input for layout planners.
 * INTERNAL — not a frozen public Alpha API.
 */
export interface PlanningSnapshot {
  readonly intent: LayoutIntent;
  /**
   * Optional prior resolved layout (stability signal only).
   * The planner does not treat this as Source Intent or placement origin.
   */
  readonly previous?: ResolvedLayout;
  /**
   * Advisory prominence weights keyed by item id.
   * Higher values are processed earlier among automatic items.
   * Unknown ids are ignored; missing entries default to 0.
   */
  readonly prominence?: Readonly<Record<string, number>>;
}

/**
 * Minimum advisory planner output.
 * INTERNAL — not a frozen public Alpha API.
 */
export interface PlanningProposal {
  readonly automaticItemOrder: readonly string[];
}

/**
 * Invoke-time planner runtime context (DND-4.3).
 * AbortSignal is runtime-only and must never be serialized into PlanningSnapshot.
 */
export interface PlannerContext {
  readonly requestId: number;
  readonly signal?: AbortSignal;
}

/**
 * Provider-neutral planner contract (DND-4.3).
 * May be synchronous or asynchronous. Sync planners must remain sync — do not
 * wrap them as async solely to satisfy this type.
 */
export type LayoutPlanner = (
  snapshot: PlanningSnapshot,
  context?: PlannerContext,
) => PlanningProposal | Promise<PlanningProposal>;

/**
 * Minimal orchestration diagnostics (internal / private).
 */
export type PlannerRunStatus = 'ok' | 'fallback' | 'cancelled';

export type PlannerFallbackReason =
  'planner-throw' | 'planner-reject' | 'deterministic-throw' | 'cancelled';

export type PlannerProposalSource = 'custom' | 'deterministic' | 'declaration';

export interface PlannerRunResult {
  readonly requestId: number;
  readonly status: PlannerRunStatus;
  readonly proposal: PlanningProposal;
  readonly proposalSource: PlannerProposalSource;
  readonly fallbackReason?: PlannerFallbackReason;
}
