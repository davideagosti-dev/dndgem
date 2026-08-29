/**
 * Experiment harness evaluator — MAY call Core solve/evaluate AFTER proposals exist.
 * Production OpenAI planner MUST NOT call these.
 */
import {
  createAutoLayoutProposal,
  solveLayout,
  type LayoutIntent,
  type ResolvedLayout,
  type ValidityState,
} from '@dndgem/core';
import {
  createDeterministicPlanningProposal,
  normalizePlanningProposal,
  type PlanningProposal,
  type PlanningSnapshot,
} from '@dndgem/intelligence';
import type { CoreOutcomeLike } from './rubric.js';

export interface PipelineResult {
  readonly proposal: PlanningProposal;
  readonly normalizedProposal: PlanningProposal;
  readonly unplacedItemIds: readonly string[];
  readonly unplacedCount: number;
  readonly validity: ValidityState;
  readonly scoreTotal: number;
  readonly resolved: ResolvedLayout;
  readonly placementOrigins: Readonly<Record<string, 'source' | 'generated'>>;
  readonly effectiveDesiredPlacements: LayoutIntent['desiredPlacements'];
}

export function runCorePipeline(
  snapshot: PlanningSnapshot,
  rawProposal: PlanningProposal,
): PipelineResult {
  const normalizedProposal = normalizePlanningProposal(snapshot, rawProposal);
  const auto = createAutoLayoutProposal({
    intent: snapshot.intent,
    previous: snapshot.previous,
    automaticItemOrder: normalizedProposal.automaticItemOrder,
  });
  const solved = solveLayout({
    intent: auto.effectiveIntent,
    previous: snapshot.previous,
  });

  return Object.freeze({
    proposal: Object.freeze({
      automaticItemOrder: Object.freeze([...rawProposal.automaticItemOrder]),
    }),
    normalizedProposal,
    unplacedItemIds: Object.freeze([...auto.unplacedItemIds]),
    unplacedCount: auto.unplacedItemIds.length,
    validity: solved.evaluation.state,
    scoreTotal: solved.evaluation.score.total,
    resolved: solved.resolved,
    placementOrigins: auto.placementOrigins,
    effectiveDesiredPlacements: auto.effectiveIntent.desiredPlacements,
  });
}

/** Baseline A — Phase 3 declaration-order Auto-Layout (no planner order). */
export function evaluateBaselineA(snapshot: PlanningSnapshot): PipelineResult {
  const declaration = Object.freeze({
    automaticItemOrder: Object.freeze(
      snapshot.intent.items
        .map((item) => String(item.id))
        .filter((id) => snapshot.intent.desiredPlacements?.[id] === undefined),
    ),
  });
  return runCorePipeline(snapshot, declaration);
}

/** Baseline B — DND-4.2 deterministic prominence planner (primary control). */
export function evaluateBaselineB(snapshot: PlanningSnapshot): PipelineResult {
  const raw = createDeterministicPlanningProposal(snapshot);
  return runCorePipeline(snapshot, raw);
}

export function toOutcomeLike(result: PipelineResult): CoreOutcomeLike {
  return {
    unplacedCount: result.unplacedCount,
    validity: result.validity,
    scoreTotal: result.scoreTotal,
  };
}

export function sourcePlacementsPreserved(
  snapshot: PlanningSnapshot,
  result: PipelineResult,
): boolean {
  const desired = snapshot.intent.desiredPlacements;
  if (desired === undefined) {
    return true;
  }
  for (const [id, rect] of Object.entries(desired)) {
    if (result.placementOrigins[id] !== 'source') {
      return false;
    }
    const effective = result.effectiveDesiredPlacements?.[id];
    if (
      effective === undefined ||
      effective.x !== rect.x ||
      effective.y !== rect.y ||
      effective.width !== rect.width ||
      effective.height !== rect.height
    ) {
      return false;
    }
  }
  return true;
}
