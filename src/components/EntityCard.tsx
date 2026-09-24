import { useState } from "react";
import type { EntityNode } from "../types";
import { useStore } from "../store";
import { colorById } from "../lib/colors";
import { CARD_WIDTH, HEADER_H, ROW_H, COLLAPSED_ROWS } from "../lib/layout";

interface Props {
  entity: EntityNode;
  scale: number;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  onDragStart: (e: React.PointerEvent, entity: EntityNode) => void;
  onPortDown: (e: React.PointerEvent, entity: EntityNode, attrId: string) => void;
  onPortUp: (e: React.PointerEvent, entity: EntityNode) => void;
}

export default function EntityCard({ entity, onDragStart, onPortDown, onPortUp }: Props) {
  const selectedEntityId = useStore((s) => s.selectedEntityId);
  const hoveredEntityId = useStore((s) => s.hoveredEntityId);
  const selectEntity = useStore((s) => s.selectEntity);
  const focusEntity = useStore((s) => s.focusEntity);
  const hoverEntity = useStore((s) => s.hoverEntity);
  const toggleCollapse = useStore((s) => s.toggleCollapse);
  const disconnectAttribute = useStore((s) => s.disconnectAttribute);
  const removeAttribute = useStore((s) => s.removeAttribute);
  const openTermDrawer = useStore((s) => s.openTermDrawer);
  const entities = useStore((s) => s.entities);
  const [openBadge, setOpenBadge] = useState<string | null>(null);

  const color = colorById(entity.color);
  const isSelected = selectedEntityId === entity.id;
  const isHovered = hoveredEntityId === entity.id;
  const isDimmed = selectedEntityId != null && !isSelected && !isHovered;
  const visibleRows = entity.collapsed ? entity.attributes.slice(0, COLLAPSED_ROWS) : entity.attributes;
  const hiddenCount = entity.attributes.length - visibleRows.length;

  return (
    <div
      className="absolute select-none"
      style={{
        left: entity.x,
        top: entity.y,
        width: CARD_WIDTH,
        zIndex: isSelected || isHovered ? 20 : 10,
      }}
      onMouseEnter={() => hoverEntity(entity.id)}
      onMouseLeave={() => hoverEntity(null)}
      onPointerUp={(e) => onPortUp(e, entity)}
    >
      <div
        className="rounded-xl overflow-hidden border transition-shadow"
        style={{
          background: "var(--bg-surface)",
          borderColor: isSelected ? color.stripe : "var(--border)",
          boxShadow: isSelected ? `0 0 0 3px ${color.badgeBg}, var(--shadow-card)` : "var(--shadow-card)",
          opacity: isDimmed ? 0.45 : 1,
        }}
      >
        <div style={{ height: 4, background: color.stripe }} />
        <div
          className="flex items-center justify-between px-4 cursor-grab active:cursor-grabbing"
          style={{ height: HEADER_H - 4 }}
          onPointerDown={(e) => {
            e.stopPropagation();
            selectEntity(entity.id);
            onDragStart(e, entity);
          }}
          onDoubleClick={() => toggleCollapse(entity.id)}
        >
          <span
            className="font-semibold text-[14px] truncate hover:underline"
            style={{ color: "var(--text-primary)" }}
            title="Edit entity details"
            onClick={(e) => {
              e.stopPropagation();
              openTermDrawer(entity.id);
            }}
          >
            {entity.name}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {entity.status === "draft" && (
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#c8811a" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f0a83a" }} />
                Draft
              </span>
            )}
            <span
              className="rounded-full text-[12px] font-medium px-2 py-0.5 border"
              style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}
            >
              {entity.kind === "valueList" ? entity.values?.length ?? 0 : entity.attributes.length}
            </span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)" }}>
          {entity.kind === "valueList" &&
            (entity.values ?? []).map((v, i) => (
              <div
                key={v + i}
                className="flex items-center justify-between px-4"
                style={{ height: ROW_H, borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
              >
                <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  {v}
                </span>
                <span className="text-[12px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                  string
                </span>
              </div>
            ))}
          {entity.kind === "valueList" && (entity.values ?? []).length === 0 && (
            <div className="px-4 py-2.5 text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
              No values yet.
            </div>
          )}
          {visibleRows.map((a, i) => {
            const ref = a.refEntityId ? entities.find((e) => e.id === a.refEntityId) : null;
            const refColor = ref ? colorById(ref.color) : null;
            return (
              <div
                key={a.id}
                className="group flex items-center justify-between px-4 relative"
                style={{
                  height: ROW_H,
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                <span
                  className="text-[13px] truncate cursor-pointer hover:underline flex items-center gap-1"
                  style={{ color: "var(--text-secondary)" }}
                  title="Edit term details"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTermDrawer(entity.id, a.id);
                  }}
                >
                  {a.name}
                  {a.primaryKey && (
                    <span
                      className="text-[9px] font-bold px-1 rounded shrink-0"
                      style={{ background: "var(--accent-blue)", color: "#fff" }}
                    >
                      PK
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  {ref && refColor ? (
                    <div className="relative">
                      <button
                        className="text-[11px] font-mono px-2 py-[3px] rounded-md cursor-pointer"
                        style={{ background: refColor.badgeBg, color: refColor.badgeText }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenBadge((b) => (b === a.id ? null : a.id));
                        }}
                      >
                        {ref.name}
                      </button>
                      {openBadge === a.id && (
                        <div
                          className="absolute right-0 top-full mt-1 rounded-lg border text-[12px] overflow-hidden z-30"
                          style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pill)" }}
                        >
                          <button
                            className="block w-full text-left px-3 py-2 whitespace-nowrap hover:opacity-80"
                            style={{ color: "var(--text-primary)" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              focusEntity(ref.id);
                              setOpenBadge(null);
                            }}
                          >
                            Go to {ref.name}
                          </button>
                          <button
                            className="block w-full text-left px-3 py-2 whitespace-nowrap hover:opacity-80 border-t"
                            style={{ color: "#e0475a", borderColor: "var(--border)" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              disconnectAttribute(entity.id, a.id);
                              setOpenBadge(null);
                            }}
                          >
                            Disconnect
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[12px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                      {a.dataType}
                    </span>
                  )}
                  <button
                    className="opacity-0 group-hover:opacity-100 text-[11px] w-4 h-4 flex items-center justify-center rounded"
                    style={{ color: "var(--text-tertiary)" }}
                    title="Remove attribute"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttribute(entity.id, a.id);
                    }}
                  >
                    ×
                  </button>
                  <div
                    className="w-2 h-2 rounded-full cursor-crosshair shrink-0"
                    style={{ background: ref ? refColor!.dot : "var(--border-strong)" }}
                    title="Drag to connect"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onPortDown(e, entity, a.id);
                    }}
                  />
                </div>
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <button
              className="w-full text-center text-[12px] py-2"
              style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border)" }}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(entity.id);
              }}
            >
              ••• {hiddenCount} more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
