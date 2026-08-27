import type { LayoutIntent, ResolvedLayout } from '@dndgem/core';

/**
 * Minimum structural input for the DND-4.2 deterministic planner.
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
 * Minimum advisory planner output for DND-4.2.
 * INTERNAL — not a frozen public Alpha API.
 */
export interface PlanningProposal {
  readonly automaticItemOrder: readonly string[];
}
