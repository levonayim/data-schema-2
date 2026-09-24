import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import EntityCard from "./EntityCard";
import Minimap from "./Minimap";
import EmptyCanvasState from "./EmptyCanvasState";
import { colorById } from "../lib/colors";
import { computeConnections, entityHeight } from "../lib/connections";
import { connectorPath } from "../lib/bezier";
import { CARD_WIDTH } from "../lib/layout";
import type { EntityNode } from "../types";

const SIMPLIFY_THRESHOLD = 0.35;

export default function Canvas() {
  const entities = useStore((s) => s.entities);
  const camera = useStore((s) => s.camera);
  const setCamera = useStore((s) => s.setCamera);
  const zoomBy = useStore((s) => s.zoomBy);
  const moveEntity = useStore((s) => s.moveEntity);
  const selectEntity = useStore((s) => s.selectEntity);
  const selectedEntityId = useStore((s) => s.selectedEntityId);
  const pending = useStore((s) => s.pending);
  const startPending = useStore((s) => s.startPending);
  const updatePending = useStore((s) => s.updatePending);
  const endPending = useStore((s) => s.endPending);
  const connectAttribute = useStore((s) => s.connectAttribute);
  const setAddEntityOpen = useStore((s) => s.setAddEntityOpen);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ w: 1200, h: 800 });
  const panState = useRef<{ startX: number; startY: number; camX: number; camY: number } | null>(null);
  const dragState = useRef<{ id: string; startX: number; startY: number; ex: number; ey: number } | null>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setViewportSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toWorld = (clientX: number, clientY: number) => {
    const rect = viewportRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - camera.x) / camera.scale,
      y: (clientY - rect.top - camera.y) / camera.scale,
    };
  };

  const onBackgroundPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // Only treat this as a background interaction when the pointerdown originated on the
    // viewport itself (empty canvas), not when it bubbled up from a card, badge, or button.
    if (e.target !== e.currentTarget) return;
    selectEntity(null);
    panState.current = { startX: e.clientX, startY: e.clientY, camX: camera.x, camY: camera.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (panState.current) {
      const dx = e.clientX - panState.current.startX;
      const dy = e.clientY - panState.current.startY;
      setCamera({ x: panState.current.camX + dx, y: panState.current.camY + dy });
    } else if (dragState.current) {
      const dx = (e.clientX - dragState.current.startX) / camera.scale;
      const dy = (e.clientY - dragState.current.startY) / camera.scale;
      moveEntity(dragState.current.id, dragState.current.ex + dx, dragState.current.ey + dy);
    } else if (pending) {
      const w = toWorld(e.clientX, e.clientY);
      updatePending(w.x, w.y);
    }
  };

  const onPointerUp = () => {
    panState.current = null;
    dragState.current = null;
    if (pending) endPending();
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = viewportRef.current!.getBoundingClientRect();
    const pivot = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (e.ctrlKey || e.metaKey) {
      zoomBy(-e.deltaY * 0.01, pivot);
    } else {
      setCamera({ x: camera.x - e.deltaX, y: camera.y - e.deltaY });
    }
  };

  const onDragStart = (e: React.PointerEvent, entity: EntityNode) => {
    dragState.current = { id: entity.id, startX: e.clientX, startY: e.clientY, ex: entity.x, ey: entity.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPortDown = (e: React.PointerEvent, entity: EntityNode, attrId: string) => {
    const w = toWorld(e.clientX, e.clientY);
    startPending(entity.id, attrId, w.x, w.y);
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
  };

  const onPortUp = (_e: React.PointerEvent, entity: EntityNode) => {
    if (pending && pending.fromEntityId !== entity.id) {
      connectAttribute(pending.fromEntityId, pending.fromAttrId, entity.id);
    }
    endPending();
  };

  const connections = computeConnections(entities, (colorId) => colorById(colorId).line);
  const worldToScreen = (x: number, y: number) => ({ x: x * camera.scale + camera.x, y: y * camera.scale + camera.y });
  const simplified = camera.scale < SIMPLIFY_THRESHOLD;

  const bgSize = 22 * camera.scale;
  const bgPos = `${camera.x % bgSize}px ${camera.y % bgSize}px`;

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden touch-none"
      style={{
        background: "var(--bg-canvas)",
        backgroundImage: `radial-gradient(var(--bg-dot) ${Math.max(1, camera.scale)}px, transparent 0)`,
        backgroundSize: `${bgSize}px ${bgSize}px`,
        backgroundPosition: bgPos,
        cursor: panState.current ? "grabbing" : "default",
      }}
      onPointerDown={onBackgroundPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={(e) => {
        if (e.target === viewportRef.current || (e.target as HTMLElement).dataset.canvasBg) setAddEntityOpen(true);
      }}
    >
      <div
        className="absolute top-0 left-0"
        style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`, transformOrigin: "0 0" }}
      >
        <svg
          className="absolute overflow-visible pointer-events-none"
          style={{ left: 0, top: 0, width: 1, height: 1 }}
        >
          {connections.map((c) => {
            const active = selectedEntityId != null && (c.sourceEntityId === selectedEntityId || c.targetEntityId === selectedEntityId);
            const faded = selectedEntityId != null && !active;
            return (
              <path
                key={c.key}
                d={connectorPath(c.x1, c.y1, c.x2, c.y2)}
                fill="none"
                stroke={active ? "var(--line-active)" : "var(--line-default)"}
                strokeWidth={active ? 2 : 1.5}
                opacity={faded ? 0.25 : 0.85}
              />
            );
          })}
          {pending &&
            (() => {
              const src = entities.find((e) => e.id === pending.fromEntityId);
              if (!src) return null;
              const idx = src.attributes.findIndex((a) => a.id === pending.fromAttrId);
              const x1 = src.x + CARD_WIDTH;
              const y1 = src.y + 52 + idx * 36 + 18;
              return (
                <path
                  d={connectorPath(x1, y1, pending.toX, pending.toY)}
                  fill="none"
                  stroke="var(--line-active)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              );
            })()}
        </svg>

        {entities.map((entity) =>
          simplified ? (
            <SimplifiedNode key={entity.id} entity={entity} onClick={() => selectEntity(entity.id)} />
          ) : (
            <EntityCard
              key={entity.id}
              entity={entity}
              scale={camera.scale}
              worldToScreen={worldToScreen}
              onDragStart={onDragStart}
              onPortDown={onPortDown}
              onPortUp={onPortUp}
            />
          )
        )}
      </div>

      {entities.length === 0 && <EmptyCanvasState />}
      {entities.length > 0 && <Minimap viewportSize={viewportSize} />}
    </div>
  );
}

function SimplifiedNode({ entity, onClick }: { entity: EntityNode; onClick: () => void }) {
  const color = colorById(entity.color);
  const h = entityHeight(entity);
  return (
    <div
      className="absolute rounded-md flex items-center justify-center text-center px-1 cursor-pointer"
      style={{
        left: entity.x,
        top: entity.y,
        width: CARD_WIDTH,
        height: Math.max(h, 40),
        background: color.badgeBg,
        border: `2px solid ${color.stripe}`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className="text-[15px] font-semibold truncate" style={{ color: color.text }}>
        {entity.name}
      </span>
      <span
        className="ml-2 rounded-full text-[12px] font-medium px-2 py-0.5 shrink-0"
        style={{ background: "var(--bg-surface)", color: color.text }}
      >
        {entity.attributes.length}
      </span>
    </div>
  );
}
