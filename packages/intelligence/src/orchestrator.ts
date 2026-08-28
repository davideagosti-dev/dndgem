import { listAutomaticItemIds } from './normalize.js';
import { createDeterministicPlanningProposal, normalizePlanningProposal } from './planner.js';
import type {
  LayoutPlanner,
  PlannerContext,
  PlannerFallbackReason,
  PlannerRunResult,
  PlanningProposal,
  PlanningSnapshot,
} from './types.js';

function declarationProposal(snapshot: PlanningSnapshot): PlanningProposal {
  return Object.freeze({
    automaticItemOrder: Object.freeze([...listAutomaticItemIds(snapshot.intent)]),
  });
}

function isAbortError(error: unknown): boolean {
  if (error === undefined || error === null || typeof error !== 'object') {
    return false;
  }
  const name = (error as { name?: unknown }).name;
  return name === 'AbortError';
}

function cancelledResult(requestId: number, snapshot: PlanningSnapshot): PlannerRunResult {
  return Object.freeze({
    requestId,
    status: 'cancelled' as const,
    proposal: declarationProposal(snapshot),
    proposalSource: 'declaration' as const,
    fallbackReason: 'cancelled' as const,
  });
}

function fallbackResult(
  requestId: number,
  snapshot: PlanningSnapshot,
  proposal: PlanningProposal,
  proposalSource: 'deterministic' | 'declaration',
  fallbackReason: PlannerFallbackReason,
): PlannerRunResult {
  return Object.freeze({
    requestId,
    status: 'fallback' as const,
    proposal,
    proposalSource,
    fallbackReason,
  });
}

/**
 * Shared planner orchestration boundary (DND-4.3).
 *
 * Responsibilities:
 * - invoke sync or async LayoutPlanner
 * - normalize every successful proposal
 * - observe optional AbortSignal (cancellation ≠ layout validity failure)
 * - fail closed through deterministic → declaration-order fallback
 *
 * Does not call solveLayout / evaluateLayout, fabricate geometry, or mutate
 * Source Intent. Stale-result rejection (request-id compare before apply)
 * remains the session/integration layer's responsibility.
 */
export async function runLayoutPlanner(input: {
  readonly snapshot: PlanningSnapshot;
  readonly planner?: LayoutPlanner;
  readonly context?: PlannerContext;
  /**
   * Optional override for the deterministic fallback planner.
   * Defaults to {@link createDeterministicPlanningProposal}.
   */
  readonly deterministicPlanner?: LayoutPlanner;
}): Promise<PlannerRunResult> {
  const { snapshot } = input;
  const requestId = input.context?.requestId ?? 0;
  const signal = input.context?.signal;
  const deterministicPlanner = input.deterministicPlanner ?? createDeterministicPlanningProposal;
  const context: PlannerContext | undefined =
    input.context !== undefined
      ? input.context
      : requestId !== 0
        ? Object.freeze({ requestId })
        : undefined;

  if (signal?.aborted) {
    return cancelledResult(requestId, snapshot);
  }

  const customPlanner = input.planner;

  if (customPlanner !== undefined) {
    try {
      const raw = await Promise.resolve(customPlanner(snapshot, context));
      if (signal?.aborted) {
        return cancelledResult(requestId, snapshot);
      }
      const proposal = normalizePlanningProposal(snapshot, raw);
      return Object.freeze({
        requestId,
        status: 'ok' as const,
        proposal,
        proposalSource: 'custom' as const,
      });
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) {
        return cancelledResult(requestId, snapshot);
      }
      return runDeterministicFallback(
        snapshot,
        requestId,
        signal,
        deterministicPlanner,
        'planner-throw',
      );
    }
  }

  return runDeterministicFallback(snapshot, requestId, signal, deterministicPlanner, undefined);
}

async function runDeterministicFallback(
  snapshot: PlanningSnapshot,
  requestId: number,
  signal: AbortSignal | undefined,
  deterministicPlanner: LayoutPlanner,
  fromCustomFailure: PlannerFallbackReason | undefined,
): Promise<PlannerRunResult> {
  if (signal?.aborted) {
    return cancelledResult(requestId, snapshot);
  }

  try {
    const raw = await Promise.resolve(deterministicPlanner(snapshot, { requestId, signal }));
    if (signal?.aborted) {
      return cancelledResult(requestId, snapshot);
    }
    const proposal = normalizePlanningProposal(snapshot, raw);
    if (fromCustomFailure !== undefined) {
      return fallbackResult(requestId, snapshot, proposal, 'deterministic', fromCustomFailure);
    }
    return Object.freeze({
      requestId,
      status: 'ok' as const,
      proposal,
      proposalSource: 'deterministic' as const,
    });
  } catch {
    if (signal?.aborted) {
      return cancelledResult(requestId, snapshot);
    }
    const proposal = declarationProposal(snapshot);
    return fallbackResult(
      requestId,
      snapshot,
      proposal,
      'declaration',
      fromCustomFailure ?? 'deterministic-throw',
    );
  }
}

/**
 * Build a LayoutPlanner that always runs through {@link runLayoutPlanner}.
 * Suitable for injection into DOM `createLayoutSession({ planner })` without
 * forcing the DOM package to depend on this package.
 */
export function createOrchestratedLayoutPlanner(planner?: LayoutPlanner): LayoutPlanner {
  return async (snapshot, context) => {
    const result = await runLayoutPlanner({ snapshot, planner, context });
    return result.proposal;
  };
}
