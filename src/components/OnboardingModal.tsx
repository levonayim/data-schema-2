import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { AI_SCHEMA_SUGGESTIONS, TEMPLATES, templateStarterEntities } from "../data/mockSchemas";
import { SEED_ENTITIES } from "../data/seed";
import { cloneEntities } from "../lib/cloneEntities";
import { Sparkle } from "./AIAssistPanel";
import { parseCsvForImport } from "../lib/import";

export default function OnboardingModal() {
  const open = useStore((s) => s.onboardingOpen);
  const setOpen = useStore((s) => s.setOnboardingOpen);
  const createSchema = useStore((s) => s.createSchema);
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setDescription("");
    setShowTemplates(false);
  };

  const goToEditor = (name: string, entities: ReturnType<typeof cloneEntities>) => {
    createSchema(name, entities);
    close();
    navigate("/editor");
  };

  const generateFromAi = () => {
    const name = description.trim() || "AI Generated Schema";
    // demo: seed a plausible starter set rather than call a real model
    const starter = cloneEntities(SEED_ENTITIES.slice(0, 4));
    goToEditor(name, starter);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const preview = parseCsvForImport(text, []);
    const entity = {
      id: `ent_${Math.random().toString(36).slice(2, 9)}`,
      name: "Imported",
      kind: "termSet" as const,
      color: "blue",
      status: "draft" as const,
      version: "v1.0.0",
      x: 0,
      y: 0,
      collapsed: false,
      attributes: preview.ready.map((r) => ({
        id: `attr_${Math.random().toString(36).slice(2, 9)}`,
        name: r.name,
        dataType: r.dataType,
        refEntityId: null,
        required: r.required,
        multiple: r.multiple,
      })),
    };
    goToEditor(file.name.replace(/\.[^.]+$/, ""), [entity]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(10,10,14,0.45)" }} onClick={close}>
      <div
        className="w-full max-w-[560px] rounded-2xl mt-8 sm:mt-0"
        style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-pill)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {showTemplates ? "Start from a template" : "How would you like to build your schema?"}
          </h2>
          <button onClick={close} style={{ color: "var(--text-tertiary)" }}>
            ✕
          </button>
        </div>

        {showTemplates ? (
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  className="text-left rounded-xl border p-3 hover:opacity-90"
                  style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)" }}
                  onClick={() => goToEditor(t.name, templateStarterEntities(t.id))}
                >
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {t.name}
                  </p>
                  <p className="text-[11.5px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
            <button className="mt-4 text-[12.5px] font-medium" style={{ color: "var(--text-secondary)" }} onClick={() => setShowTemplates(false)}>
              ← Back
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)" }}>
              <p className="text-[12.5px] font-semibold flex items-center gap-1.5 mb-2" style={{ color: "var(--text-primary)" }}>
                <Sparkle size={14} />
                Describe your schema with AI Assist
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. We process mortgage applications with borrower details, loan amounts, property info, and status codes..."
                rows={3}
                className="w-full rounded-lg border px-2.5 py-2 text-[12.5px] outline-none resize-none"
                style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1.5 flex-wrap">
                  {AI_SCHEMA_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="text-[11px] rounded-full px-2.5 py-1 border"
                      style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}
                      onClick={() => setDescription(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  className="text-[12.5px] font-semibold text-white px-3 py-1.5 rounded-lg shrink-0"
                  style={{ background: "var(--accent-blue)" }}
                  onClick={generateFromAi}
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>
                or start manually
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                className="rounded-xl border p-4 text-left"
                style={{ borderColor: "var(--border)" }}
                onClick={() => goToEditor("Untitled Term Set", [])}
              >
                <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  + New Term Set
                </p>
                <p className="text-[11.5px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                  Build from scratch at your own pace.
                </p>
              </button>
              <button className="rounded-xl border border-dashed p-4 text-left" style={{ borderColor: "var(--border-strong)" }} onClick={() => fileInputRef.current?.click()}>
                <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  ⇩ Import File
                </p>
                <p className="text-[11.5px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                  Upload a CSV schema file.
                </p>
              </button>
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

            <button className="text-[12.5px] font-medium" style={{ color: "var(--accent-blue-fg)" }} onClick={() => setShowTemplates(true)}>
              Start from a curated template
            </button>
          </div>
        )}

        {!showTemplates && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
            <button className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ color: "var(--text-secondary)" }} onClick={close}>
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40"
              style={{ background: "var(--accent-blue)" }}
              disabled={!description.trim()}
              onClick={generateFromAi}
            >
              Create
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
