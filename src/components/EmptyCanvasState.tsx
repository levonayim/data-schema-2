import { useRef } from "react";
import { useStore } from "../store";
import { parseCsvForImport } from "../lib/import";

export default function EmptyCanvasState() {
  const setAddEntityOpen = useStore((s) => s.setAddEntityOpen);
  const setOnboardingOpen = useStore((s) => s.setOnboardingOpen);
  const addEntity = useStore((s) => s.addEntity);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const preview = parseCsvForImport(text, []);
    if (preview.ready.length === 0) return;
    addEntity(
      file.name.replace(/\.[^.]+$/, "") || "Imported",
      "termSet",
      preview.ready.map((r) => ({ name: r.name, dataType: r.dataType, refEntityId: null, required: r.required, multiple: r.multiple }))
    );
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-3 pointer-events-auto px-4 text-center">
        <button
          className="w-11 h-11 rounded-xl border-2 flex items-center justify-center text-[22px] font-light"
          style={{ borderColor: "var(--border-strong)", color: "var(--text-tertiary)" }}
          onClick={() => setAddEntityOpen(true)}
        >
          +
        </button>
        <h2 className="text-[17px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Start building your Schema
        </h2>
        <div className="flex flex-col gap-2 w-[220px] mt-1">
          <button
            className="rounded-lg py-2 text-[13px] font-semibold text-white"
            style={{ background: "var(--accent-blue)" }}
            onClick={() => fileInputRef.current?.click()}
          >
            Import file
          </button>
          <button
            className="rounded-lg py-2 text-[13px] font-medium border"
            style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}
            onClick={() => setOnboardingOpen(true)}
          >
            Start from a template
          </button>
        </div>
        <p className="text-[12px] mt-1 max-w-[280px]" style={{ color: "var(--text-tertiary)" }}>
          or double-click anywhere on the canvas to add a new Business Term Set or Value List
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
