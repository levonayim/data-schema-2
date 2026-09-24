import { useRef } from "react";
import { useStore } from "../store";
import { colorById } from "../lib/colors";
import { entityHeight } from "../lib/connections";
import { CARD_WIDTH } from "../lib/layout";

const MAP_W = 200;
const MAP_H = 130;

export default function Minimap({ viewportSize }: { viewportSize: { w: number; h: number } }) {
  const entities = useStore((s) => s.entities);
  const camera = useStore((s) => s.camera);
  const setCamera = useStore((s) => s.setCamera);
  const dragging = useRef(false);

  if (entities.length === 0) return null;

  const xs = entities.flatMap((e) => [e.x, e.x + CARD_WIDTH]);
  const ys = entities.flatMap((e) => [e.y, e.y + entityHeight(e)]);
  const minX = Math.min(...xs) - 80;
  const maxX = Math.max(...xs) + 80;
  const minY = Math.min(...ys) - 80;
  const maxY = Math.max(...ys) + 80;
  const worldW = Math.max(maxX - minX, 1);
  const worldH = Math.max(maxY - minY, 1);
  const s = Math.min(MAP_W / worldW, MAP_H / worldH);

  const toMap = (x: number, y: number) => ({ x: (x - minX) * s, y: (y - minY) * s });

  const viewX = -camera.x / camera.scale;
  const viewY = -camera.y / camera.scale;
  const viewW = viewportSize.w / camera.scale;
  const viewH = viewportSize.h / camera.scale;
  const vp = toMap(viewX, viewY);

  const jumpTo = (clientX: number, clientY: number, rect: DOMRect) => {
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const worldX = mx / s + minX;
    const worldY = my / s + minY;
    setCamera({
      x: -(worldX - viewW / 2) * camera.scale,
      y: -(worldY - viewH / 2) * camera.scale,
    });
  };

  return (
    <div
      className="absolute bottom-4 right-4 rounded-lg overflow-hidden border cursor-pointer hidden sm:block"
      style={{
        width: MAP_W,
        height: MAP_H,
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-pill)",
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture(e.pointerId);
        jumpTo(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        jumpTo(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
      }}
      onPointerUp={() => (dragging.current = false)}
    >
      <svg width={MAP_W} height={MAP_H}>
        {entities.map((e) => {
          const p = toMap(e.x, e.y);
          const w = CARD_WIDTH * s;
          const h = entityHeight(e) * s;
          const c = colorById(e.color);
          return <rect key={e.id} x={p.x} y={p.y} width={Math.max(w, 2)} height={Math.max(h, 2)} rx={1.5} fill={c.stripe} opacity={0.85} />;
        })}
        <rect
          x={vp.x}
          y={vp.y}
          width={viewW * s}
          height={viewH * s}
          fill="rgba(244,107,138,0.08)"
          stroke="#f36ba7"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
