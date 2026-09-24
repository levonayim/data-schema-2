import type { EntityNode } from "../types";
import { CARD_WIDTH, HEADER_H, ROW_H, COLLAPSED_ROWS } from "./layout";

export function entityHeight(e: EntityNode): number {
  const count = e.kind === "valueList" ? e.values?.length ?? 0 : e.attributes.length;
  const rows = e.collapsed ? Math.min(count, COLLAPSED_ROWS) : count;
  const extra = e.collapsed && count > COLLAPSED_ROWS ? 28 : 0;
  return HEADER_H + rows * ROW_H + extra;
}

export interface ConnectionLine {
  key: string;
  sourceEntityId: string;
  targetEntityId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  colorLine: string;
}

export function computeConnections(
  entities: EntityNode[],
  colorOf: (id: string) => string
): ConnectionLine[] {
  const byId = new Map(entities.map((e) => [e.id, e]));
  const lines: ConnectionLine[] = [];
  const incomingGroups = new Map<string, { entityId: string; attrId: string; sourceY: number }[]>();

  for (const e of entities) {
    e.attributes.forEach((a, i) => {
      if (!a.refEntityId) return;
      const target = byId.get(a.refEntityId);
      if (!target) return;
      const sourceY = e.y + HEADER_H + Math.min(i, COLLAPSED_ROWS - 1) * ROW_H + ROW_H / 2;
      const side = target.x >= e.x ? "left" : "right";
      const key = `${target.id}:${side}`;
      const arr = incomingGroups.get(key) ?? [];
      arr.push({ entityId: e.id, attrId: a.id, sourceY });
      incomingGroups.set(key, arr);
    });
  }

  for (const e of entities) {
    e.attributes.forEach((a, i) => {
      if (!a.refEntityId) return;
      const target = byId.get(a.refEntityId);
      if (!target) return;
      const visibleRow = e.collapsed ? Math.min(i, COLLAPSED_ROWS - 1) : i;
      const y1 = e.y + HEADER_H + visibleRow * ROW_H + ROW_H / 2;
      const rightward = target.x >= e.x;
      const x1 = rightward ? e.x + CARD_WIDTH : e.x;

      const side = rightward ? "left" : "right";
      const group = incomingGroups.get(`${target.id}:${side}`) ?? [];
      const idx = group.findIndex((g) => g.entityId === e.id && g.attrId === a.id);
      const th = entityHeight(target);
      const centerY = target.y + th / 2;
      const span = Math.min(th - 24, (group.length - 1) * 16);
      const startY = centerY - span / 2;
      const y2 = group.length > 1 ? startY + idx * (span / (group.length - 1 || 1)) : centerY;
      const x2 = rightward ? target.x : target.x + CARD_WIDTH;

      lines.push({
        key: `${a.id}`,
        sourceEntityId: e.id,
        targetEntityId: target.id,
        x1,
        y1,
        x2,
        y2,
        colorLine: colorOf(target.color),
      });
    });
  }

  return lines;
}
