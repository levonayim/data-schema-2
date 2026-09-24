import type { EntityNode } from "../types";

export interface Dependent {
  entityId: string;
  entityName: string;
  attrId: string;
  attrName: string;
}

/** Attributes anywhere in `entities` whose refEntityId points at `targetEntityId` — i.e. what depends on it. */
export function computeDependents(entities: EntityNode[], targetEntityId: string): Dependent[] {
  const deps: Dependent[] = [];
  entities.forEach((e) => {
    e.attributes.forEach((a) => {
      if (a.refEntityId === targetEntityId) {
        deps.push({ entityId: e.id, entityName: e.name, attrId: a.id, attrName: a.name });
      }
    });
  });
  return deps;
}

/** Dependent count for every entity in one pass, keyed by entity id — cheaper than calling computeDependents per row. */
export function computeDependentCounts(entities: EntityNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  entities.forEach((e) => {
    e.attributes.forEach((a) => {
      if (!a.refEntityId) return;
      counts.set(a.refEntityId, (counts.get(a.refEntityId) ?? 0) + 1);
    });
  });
  return counts;
}
