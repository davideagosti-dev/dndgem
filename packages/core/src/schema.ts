/**
 * Layout persistence schema version principle (ADR-0006).
 * Increment when serialized layout shapes become incompatible.
 * DND-1.2 establishes the constant; persistence I/O is deferred.
 */
export const LAYOUT_SCHEMA_VERSION = 1 as const;

export type LayoutSchemaVersion = typeof LAYOUT_SCHEMA_VERSION;
