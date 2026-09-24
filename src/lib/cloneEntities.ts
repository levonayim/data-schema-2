import type { EntityNode } from "../types";

const nid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/** Deep-clones a set of entities with fresh ids, remapping internal refs and dropping refs to anything not included. */
export function cloneEntities(entities: EntityNode[]): EntityNode[] {
  const idMap = new Map<string, string>();
  entities.forEach((e) => idMap.set(e.id, nid("ent")));

  return entities.map((e) => ({
    ...e,
    id: idMap.get(e.id)!,
    status: "draft",
    version: "v1.0.0",
    attributes: e.attributes.map((a) => ({
      ...a,
      id: nid("attr"),
      refEntityId: a.refEntityId ? idMap.get(a.refEntityId) ?? null : null,
      dataType: a.refEntityId && !idMap.get(a.refEntityId) ? "string" : a.dataType,
    })),
  }));
}
