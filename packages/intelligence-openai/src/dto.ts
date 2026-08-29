import type { PlanningSnapshot } from '@dndgem/intelligence';
import { createAliasMaps } from './alias.js';
import type {
  AliasMaps,
  ProviderAutomaticItemDto,
  ProviderItemConstraintsDto,
  ProviderPlanningDto,
  ProviderPreviousPlacementDto,
  ProviderSourceItemDto,
} from './types.js';

type SnapshotIntent = PlanningSnapshot['intent'];
type SnapshotItem = SnapshotIntent['items'][number];
type SnapshotPrevious = NonNullable<PlanningSnapshot['previous']>;

function itemKey(item: SnapshotItem): string {
  return String(item.id);
}

function constraintsDto(item: SnapshotItem): ProviderItemConstraintsDto {
  const c = item.constraints;
  const dto: {
    -readonly [K in keyof ProviderItemConstraintsDto]?: number;
  } = {};
  if (c.preferredWidth !== undefined) dto.preferredWidth = c.preferredWidth;
  if (c.preferredHeight !== undefined) dto.preferredHeight = c.preferredHeight;
  if (c.minWidth !== undefined) dto.minWidth = c.minWidth;
  if (c.maxWidth !== undefined) dto.maxWidth = c.maxWidth;
  if (c.minHeight !== undefined) dto.minHeight = c.minHeight;
  if (c.maxHeight !== undefined) dto.maxHeight = c.maxHeight;
  if (c.minUsefulWidth !== undefined) dto.minUsefulWidth = c.minUsefulWidth;
  if (c.minUsefulHeight !== undefined) dto.minUsefulHeight = c.minUsefulHeight;
  return Object.freeze(dto);
}

function listSourceIds(intent: SnapshotIntent): readonly string[] {
  const desired = intent.desiredPlacements;
  if (desired === undefined) {
    return [];
  }
  const ids: string[] = [];
  for (const item of intent.items) {
    const key = itemKey(item);
    if (desired[key] !== undefined) {
      ids.push(key);
    }
  }
  return ids;
}

function listAutomaticIds(intent: SnapshotIntent): readonly string[] {
  const desired = intent.desiredPlacements;
  const ids: string[] = [];
  for (const item of intent.items) {
    const key = itemKey(item);
    if (desired?.[key] === undefined) {
      ids.push(key);
    }
  }
  return ids;
}

/**
 * Build a sanitized provider DTO from a PlanningSnapshot.
 * Never includes raw application ids, DOM, HTML, ARIA, URLs, or credentials.
 */
export function buildProviderPlanningDto(snapshot: PlanningSnapshot): {
  readonly dto: ProviderPlanningDto;
  readonly maps: AliasMaps;
} {
  const intent = snapshot.intent;
  const automaticIds = listAutomaticIds(intent);
  const sourceIds = listSourceIds(intent);
  const maps = createAliasMaps(automaticIds, sourceIds);

  const automaticItems: ProviderAutomaticItemDto[] = [];
  for (const id of automaticIds) {
    const item = intent.items.find((entry) => itemKey(entry) === id);
    if (item === undefined) {
      continue;
    }
    const alias = maps.toAlias.get(id)!;
    const prominence = snapshot.prominence?.[id];
    const entry: {
      -readonly [K in keyof ProviderAutomaticItemDto]?: ProviderAutomaticItemDto[K];
    } = {
      alias,
      constraints: constraintsDto(item),
    };
    if (typeof prominence === 'number' && Number.isFinite(prominence)) {
      entry.prominence = prominence;
    }
    automaticItems.push(Object.freeze(entry) as ProviderAutomaticItemDto);
  }

  const sourceItems: ProviderSourceItemDto[] = [];
  for (const id of sourceIds) {
    const rect = intent.desiredPlacements?.[id];
    const alias = maps.toAlias.get(id);
    if (rect === undefined || alias === undefined) {
      continue;
    }
    sourceItems.push(
      Object.freeze({
        alias,
        rect: Object.freeze({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }),
      }),
    );
  }

  let previousAutomatic: readonly ProviderPreviousPlacementDto[] | undefined;
  if (snapshot.previous !== undefined) {
    previousAutomatic = previousAutomaticPlacements(snapshot.previous, automaticIds, maps);
  }

  const dto: {
    -readonly [K in keyof ProviderPlanningDto]?: ProviderPlanningDto[K];
  } = {
    space: Object.freeze({
      width: intent.space.width,
      height: intent.space.height,
    }),
    automaticItems: Object.freeze([...automaticItems]),
    sourceItems: Object.freeze([...sourceItems]),
  };
  if (previousAutomatic !== undefined && previousAutomatic.length > 0) {
    dto.previousAutomatic = previousAutomatic;
  }

  return {
    dto: Object.freeze(dto) as ProviderPlanningDto,
    maps,
  };
}

function previousAutomaticPlacements(
  previous: SnapshotPrevious,
  automaticIds: readonly string[],
  maps: AliasMaps,
): readonly ProviderPreviousPlacementDto[] {
  const automaticSet = new Set(automaticIds);
  const out: ProviderPreviousPlacementDto[] = [];
  for (const [id, rect] of Object.entries(previous.placements)) {
    if (!automaticSet.has(id)) {
      continue;
    }
    const alias = maps.toAlias.get(id);
    if (alias === undefined) {
      continue;
    }
    out.push(
      Object.freeze({
        alias,
        rect: Object.freeze({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }),
      }),
    );
  }
  return Object.freeze(out);
}

/** Detect forbidden raw application ids or content-like fields in serialized DTO JSON. */
export function assertProviderDtoPrivacy(
  serialized: string,
  forbiddenSubstrings: readonly string[],
): void {
  for (const token of forbiddenSubstrings) {
    if (token.length === 0) {
      continue;
    }
    if (serialized.includes(token)) {
      throw new Error(`Provider DTO privacy violation: found "${token}"`);
    }
  }
}
