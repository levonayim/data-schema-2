import { useMemo, useState } from "react";
import { useStore } from "../store";
import { colorById } from "../lib/colors";
import { computeDependentCounts } from "../lib/impact";
import { needsAttention } from "../lib/physical";

type SortKey = "updated" | "name" | "terms";

export default function EntityListPanel() {
  const entities = useStore((s) => s.entities);
  const selectedEntityId = useStore((s) => s.selectedEntityId);
  const focusEntity = useStore((s) => s.focusEntity);
  const [tab, setTab] = useState<"terms" | "values">("terms");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortOpen, setSortOpen] = useState(false);

  const sorted = useMemo(() => {
    const list = entities.filter((e) => (tab === "values" ? e.kind === "valueList" : e.kind === "termSet"));
    if (sortKey === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "terms") list.sort((a, b) => b.attributes.length - a.attributes.length);
    return list;
  }, [entities, sortKey, tab]);

  const dependentCounts = useMemo(() => computeDependentCounts(entities), [entities]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex gap-5 px-5 border-b" style={{ borderColor: "var(--border)" }}>
        {(["terms", "values"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="pb-3 pt-1 text-[13px] font-medium relative"
            style={{ color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)" }}
          >
            {t === "terms" ? "Business Term Set" : "Value List"}
            {tab === t && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded" style={{ background: "var(--text-primary)" }} />
            )}
          </button>
        ))}
      </div>

      <div className="px-5 py-3 relative">
        <button
          className="text-[13px] flex items-center gap-1.5 font-medium"
          style={{ color: "var(--text-secondary)" }}
          onClick={() => setSortOpen((v) => !v)}
        >
          Sort by
          <span style={{ color: "var(--text-primary)" }}>
            {sortKey === "updated" ? "Latest Updated" : sortKey === "name" ? "Name" : "Term Count"}
          </span>
          <ChevronDown />
        </button>
        {sortOpen && (
          <div
            className="absolute left-5 top-full mt-1 rounded-lg border text-[13px] overflow-hidden z-30 w-44"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pill)" }}
          >
            {([
              ["updated", "Latest Updated"],
              ["name", "Name"],
              ["terms", "Term Count"],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                className="block w-full text-left px-3 py-2 hover:opacity-80"
                style={{ color: "var(--text-primary)" }}
                onClick={() => {
                  setSortKey(key);
                  setSortOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4">
        {sorted.map((e) => {
          const color = colorById(e.color);
          const relCount = e.attributes.filter((a) => a.refEntityId).length;
          const usedByCount = dependentCounts.get(e.id) ?? 0;
          const needsVerificationCount = e.attributes.filter(needsAttention).length;
          const isSelected = selectedEntityId === e.id;
          return (
            <button
              key={e.id}
              onClick={() => focusEntity(e.id)}
              className="w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-colors"
              style={{ background: isSelected ? "var(--bg-hover)" : "transparent" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color.dot }} />
                  <span className="font-semibold text-[13.5px] truncate" style={{ color: "var(--text-primary)" }}>
                    {e.name}
                  </span>
                </div>
                {e.status === "draft" && (
                  <span className="flex items-center gap-1 text-[11px] font-medium shrink-0" style={{ color: "#c8811a" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f0a83a" }} />
                    Draft
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1 pl-4 text-[12px]">
                <span style={{ color: "var(--text-tertiary)" }}>
                  {e.kind === "valueList" ? `${e.values?.length ?? 0} values` : `${e.attributes.length} terms`}
                  {relCount > 0 && (
                    <>
                      {"  "}
                      <span style={{ color: "var(--accent-blue-fg)" }}>
                        {relCount} relationship{relCount !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                  {usedByCount > 0 && (
                    <>
                      {"  "}
                      <span title="Referenced by other terms elsewhere" style={{ color: "var(--text-secondary)" }}>
                        used by {usedByCount}
                      </span>
                    </>
                  )}
                </span>
                <span style={{ color: "var(--text-tertiary)" }}>{e.version}</span>
              </div>
              {needsVerificationCount > 0 && (
                <div className="pl-4 mt-1.5">
                  <span
                    className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(240, 168, 58, 0.15)", color: "#c8811a" }}
                    title="Terms whose physical source has never been or is no longer recently verified, or were flagged for review"
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#f0a83a" }} />
                    {needsVerificationCount} need{needsVerificationCount === 1 ? "s" : ""} verification
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
