import { useState } from "react";
import { useStore } from "../store";

type Resolution = "replace" | "merge" | "skip";

export default function ImportPreviewModal() {
  const preview = useStore((s) => s.importPreview);
  const setImportPreview = useStore((s) => s.setImportPreview);
  const commitImport = useStore((s) => s.commitImport);
  const entities = useStore((s) => s.entities);

  const [openErrors, setOpenErrors] = useState(true);
  const [openWarnings, setOpenWarnings] = useState(true);
  const [openReady, setOpenReady] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [readyChecked, setReadyChecked] = useState<Record<string, boolean>>({});
  const [warnChecked, setWarnChecked] = useState<Record<string, boolean>>({});

  if (!preview) return null;
  const target = entities.find((e) => e.id === preview.targetEntityId);

  const resolutionFor = (name: string) => resolutions[name] ?? "merge";
  const isReadyChecked = (name: string) => readyChecked[name] ?? true;
  const isWarnChecked = (name: string) => warnChecked[name] ?? true;

  const bulkSet = (r: Resolution) => {
    const next: Record<string, Resolution> = {};
    preview.warnings.forEach((w) => (next[w.name] = r));
    setResolutions(next);
  };

  const close = () => setImportPreview(null);

  const importSelected = () => {
    if (!target) {
      close();
      return;
    }
    const accepted = [
      ...preview.ready.filter((r) => isReadyChecked(r.name)).map((r) => ({ name: r.name, dataType: r.dataType, required: r.required, multiple: r.multiple })),
      ...preview.warnings
        .filter((w) => isWarnChecked(w.name) && resolutionFor(w.name) !== "skip" && w.incoming)
        .map((w) => ({ name: w.name, dataType: w.incoming!.dataType, required: w.incoming!.required, multiple: w.incoming!.multiple })),
    ];
    commitImport(target.id, accepted);
  };

  const totalReady = preview.ready.length + preview.warnings.filter((w) => resolutionFor(w.name) !== "skip").length;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(10,10,14,0.45)" }} onClick={close}>
      <div
        className="w-full max-w-[680px] rounded-2xl mt-8 sm:mt-0 max-h-[86vh] flex flex-col"
        style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-pill)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Preview File Import
            </h2>
            <p className="text-[12.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Select the Business Terms to import{target ? ` into ${target.name}` : ""}.
            </p>
          </div>
          <button onClick={close} style={{ color: "var(--text-tertiary)" }}>
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-3">
          {preview.errors.length > 0 && (
            <Section
              tone="error"
              title={`Errors - ${preview.errors.length} - Resolve these errors before importing`}
              open={openErrors}
              onToggle={() => setOpenErrors((v) => !v)}
            >
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ color: "var(--text-tertiary)" }}>
                    <th className="text-left font-medium py-1.5 px-2">Name</th>
                    <th className="text-left font-medium py-1.5 px-2">Schema Objects</th>
                    <th className="text-left font-medium py-1.5 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.errors.map((e) => (
                    <tr key={e.name} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="py-1.5 px-2" style={{ color: "var(--text-primary)" }}>
                        {e.name}
                      </td>
                      <td className="py-1.5 px-2" style={{ color: "var(--text-secondary)" }}>
                        Business Term
                      </td>
                      <td className="py-1.5 px-2" style={{ color: "#c1394a" }}>
                        {e.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {preview.warnings.length > 0 && (
            <Section
              tone="warning"
              title={`Warning - ${preview.warnings.length}`}
              open={openWarnings}
              onToggle={() => setOpenWarnings((v) => !v)}
              headerExtra={
                <div className="flex items-center gap-1">
                  {(["Replace", "Merge", "Skip"] as const).map((label) => (
                    <button
                      key={label}
                      className="text-[11px] font-medium px-2 py-1 rounded-md border"
                      style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        bulkSet(label.toLowerCase() as Resolution);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="space-y-1.5">
                {preview.warnings.map((w) => (
                  <div key={w.name} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <button
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                      onClick={() => setExpanded((e) => (e === w.name ? null : w.name))}
                    >
                      <input
                        type="checkbox"
                        checked={isWarnChecked(w.name)}
                        onChange={(e) => setWarnChecked((s) => ({ ...s, [w.name]: e.target.checked }))}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-[13px] flex-1" style={{ color: "var(--text-primary)" }}>
                        {w.name}
                      </span>
                      <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {w.incoming?.dataType}
                      </span>
                      <span
                        className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(240,168,58,0.16)", color: "#c8811a" }}
                      >
                        Review Conflict · {resolutionFor(w.name)}
                      </span>
                    </button>
                    {expanded === w.name && (
                      <div className="px-2.5 pb-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg p-2" style={{ background: "var(--bg-surface-2)" }}>
                            <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                              Existing
                            </p>
                            <FieldRow label="Data type" value={w.existing?.dataType ?? ""} />
                            <FieldRow label="Required" value={w.existing?.required ? "yes" : "no"} />
                            <FieldRow label="Multiple" value={w.existing?.multiple ? "yes" : "no"} />
                          </div>
                          <div className="rounded-lg p-2" style={{ background: "rgba(240,168,58,0.08)" }}>
                            <p className="text-[11px] font-medium mb-1" style={{ color: "#c8811a" }}>
                              Incoming from file
                            </p>
                            <FieldRow label="Data type" value={w.incoming?.dataType ?? ""} />
                            <FieldRow label="Required" value={w.incoming?.required ? "yes" : "no"} />
                            <FieldRow label="Multiple" value={w.incoming?.multiple ? "yes" : "no"} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          {(["replace", "merge", "skip"] as const).map((r) => (
                            <button
                              key={r}
                              className="text-[11px] font-medium px-2.5 py-1 rounded-md capitalize"
                              style={{
                                background: resolutionFor(w.name) === r ? "var(--accent-blue)" : "var(--bg-surface-2)",
                                color: resolutionFor(w.name) === r ? "#fff" : "var(--text-secondary)",
                              }}
                              onClick={() => setResolutions((s) => ({ ...s, [w.name]: r }))}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section tone="ready" title={`Ready to import - ${preview.ready.length}`} open={openReady} onToggle={() => setOpenReady((v) => !v)}>
            <div className="space-y-1">
              {preview.ready.map((r) => (
                <label key={r.name} className="flex items-center gap-2 px-1 py-1 text-[13px]" style={{ color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={isReadyChecked(r.name)} onChange={(e) => setReadyChecked((s) => ({ ...s, [r.name]: e.target.checked }))} />
                  <span className="flex-1">{r.name}</span>
                  <span className="font-mono text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                    {r.dataType}
                  </span>
                </label>
              ))}
            </div>
          </Section>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ color: "var(--text-secondary)" }} onClick={close}>
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40"
            style={{ background: "var(--accent-blue)" }}
            disabled={totalReady === 0 || !target}
            onClick={importSelected}
          >
            Import Selected
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px] py-0.5">
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function Section({
  tone,
  title,
  open,
  onToggle,
  headerExtra,
  children,
}: {
  tone: "error" | "warning" | "ready";
  title: string;
  open: boolean;
  onToggle: () => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const palette = {
    error: { bg: "rgba(224,71,90,0.1)", fg: "#c1394a" },
    warning: { bg: "rgba(240,168,58,0.12)", fg: "#c8811a" },
    ready: { bg: "rgba(47,212,143,0.12)", fg: "#0f9d63" },
  }[tone];
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer select-none"
        style={{ background: palette.bg, color: palette.fg }}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
      >
        <span className="text-[12.5px] font-semibold flex items-center gap-1.5">
          <span style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
          {title}
        </span>
        {headerExtra}
      </div>
      {open && <div className="px-3 py-2.5">{children}</div>}
    </div>
  );
}
