import type { EntityNode } from "../types";
import { colorById } from "./colors";
import { CARD_WIDTH, HEADER_H, ROW_H } from "./layout";
import { computeConnections } from "./connections";
import { connectorPath } from "./bezier";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCSV(entities: EntityNode[], fileName: string) {
  const rows = [["Entity", "Attribute", "Type", "References"]];
  entities.forEach((e) => {
    e.attributes.forEach((a) => {
      const ref = a.refEntityId ? entities.find((t) => t.id === a.refEntityId)?.name ?? "" : "";
      rows.push([e.name, a.name, a.dataType ?? "", ref]);
    });
  });
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  download(`${fileName}.csv`, csv, "text/csv");
}

export function exportPrintDocument(entities: EntityNode[], fileName: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  const body = entities
    .map(
      (e) => `
      <section style="margin-bottom:24px;break-inside:avoid;">
        <h2 style="font-size:16px;margin:0 0 6px;border-left:6px solid ${colorById(e.color).stripe};padding-left:8px;">${e.name}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead><tr style="text-align:left;color:#666;">
            <th style="padding:4px 8px;border-bottom:1px solid #ddd;">Attribute</th>
            <th style="padding:4px 8px;border-bottom:1px solid #ddd;">Type / Reference</th>
          </tr></thead>
          <tbody>
            ${e.attributes
              .map((a) => {
                const ref = a.refEntityId ? entities.find((t) => t.id === a.refEntityId)?.name : null;
                return `<tr><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;">${a.name}</td><td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;">${
                  ref ? `&rarr; ${ref}` : a.dataType
                }</td></tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </section>`
    )
    .join("");
  win.document.write(`
    <html><head><title>${fileName}</title></head>
    <body style="font-family:ui-sans-serif,system-ui,sans-serif;color:#111;padding:32px;">
      <h1 style="font-size:22px;margin:0 0 20px;">${fileName}</h1>
      ${body}
      <script>window.onload = () => setTimeout(() => window.print(), 200);</script>
    </body></html>
  `);
  win.document.close();
}

export function exportPNG(entities: EntityNode[], fileName: string, dark: boolean) {
  const pad = 80;
  const xs = entities.flatMap((e) => [e.x, e.x + CARD_WIDTH]);
  const ys = entities.flatMap((e) => [e.y, e.y + HEADER_H + e.attributes.length * ROW_H]);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) - minX + pad;
  const h = Math.max(...ys) - minY + pad;

  const canvas = document.createElement("canvas");
  const ratio = Math.min(2, 4000 / Math.max(w, h));
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  ctx.translate(-minX, -minY);

  ctx.fillStyle = dark ? "#17181f" : "#f4f4f5";
  ctx.fillRect(minX, minY, w, h);

  const lineColor = dark ? "#494a56" : "#c7c7cf";
  const connections = computeConnections(entities, (id) => colorById(id).line);
  connections.forEach((c) => {
    const path = new Path2D(connectorPath(c.x1, c.y1, c.x2, c.y2));
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke(path);
  });

  entities.forEach((e) => {
    const color = colorById(e.color);
    const height = HEADER_H + e.attributes.length * ROW_H;
    ctx.fillStyle = dark ? "#1d1e26" : "#ffffff";
    roundRect(ctx, e.x, e.y, CARD_WIDTH, height, 12);
    ctx.fill();
    ctx.strokeStyle = dark ? "#2c2d38" : "#e6e6e9";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = color.stripe;
    roundRectTop(ctx, e.x, e.y, CARD_WIDTH, 4, 12);
    ctx.fill();

    ctx.fillStyle = dark ? "#f2f2f4" : "#17171a";
    ctx.font = "600 14px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(e.name, e.x + 16, e.y + HEADER_H / 2 + 2);

    e.attributes.forEach((a, i) => {
      const y = e.y + HEADER_H + i * ROW_H + ROW_H / 2;
      ctx.strokeStyle = dark ? "#2c2d38" : "#e6e6e9";
      ctx.beginPath();
      ctx.moveTo(e.x, e.y + HEADER_H + i * ROW_H);
      ctx.lineTo(e.x + CARD_WIDTH, e.y + HEADER_H + i * ROW_H);
      ctx.stroke();

      ctx.fillStyle = dark ? "#9a9aa5" : "#6b6b74";
      ctx.font = "13px sans-serif";
      ctx.fillText(a.name, e.x + 16, y);

      const ref = a.refEntityId ? entities.find((t) => t.id === a.refEntityId) : null;
      ctx.font = "12px monospace";
      const label = ref ? ref.name : a.dataType ?? "";
      ctx.fillStyle = ref ? colorById(ref.color).badgeText : dark ? "#6a6a75" : "#a3a3ab";
      const width = ctx.measureText(label).width;
      ctx.fillText(label, e.x + CARD_WIDTH - 16 - width, y);
    });
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}
