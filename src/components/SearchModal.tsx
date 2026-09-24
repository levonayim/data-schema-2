import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import { colorById } from "../lib/colors";
import { Sparkle } from "./AIAssistPanel";

interface Result {
  kind: "entity" | "attribute";
  entityId: string;
  entityName: string;
  color: string;
  attrName?: string;
  detail: string;
}

export default function SearchModal() {
  const open = useStore((s) => s.searchOpen);
  const setOpen = useStore((s) => s.setSearchOpen);
  const entities = useStore((s) => s.entities);
  const selectedEntityId = useStore((s) => s.selectedEntityId);
  const selectEntity = useStore((s) => s.selectEntity);
  const setCamera = useStore((s) => s.setCamera);
  const camera = useStore((s) => s.camera);
  const setViewMode = useStore((s) => s.setViewMode);
  const recentSearches = useStore((s) => s.recentSearches);
  const addRecentSearch = useStore((s) => s.addRecentSearch);
  const setAddEntityOpen = useStore((s) => s.setAddEntityOpen);
  const setOnboardingOpen = useStore((s) => s.setOnboardingOpen);
  const openDetailEntity = useStore((s) => s.openDetailEntity);
  const autoLayout = useStore((s) => s.autoLayout);

  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else setQ("");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const results = useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const out: Result[] = [];
    entities.forEach((e) => {
      if (e.name.toLowerCase().includes(query)) {
        out.push({ kind: "entity", entityId: e.id, entityName: e.name, color: e.color, detail: `${e.attributes.length} attributes` });
      }
      e.attributes.forEach((a) => {
        if (a.name.toLowerCase().includes(query)) {
          out.push({
            kind: "attribute",
            entityId: e.id,
            entityName: e.name,
            color: e.color,
            attrName: a.name,
            detail: a.refEntityId ? `references ${entities.find((t) => t.id === a.refEntityId)?.name ?? "?"}` : a.dataType ?? "",
          });
        }
      });
    });
    return out.slice(0, 30);
  }, [q, entities]);

  if (!open) return null;

  const jump = (entityId: string) => {
    const e = entities.find((en) => en.id === entityId);
    if (!e) return;
    setViewMode("canvas");
    selectEntity(entityId);
    setCamera({ x: -e.x * camera.scale + 400, y: -e.y * camera.scale + 220 });
    if (q.trim()) addRecentSearch(q.trim());
    setOpen(false);
  };

  const flashToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) ?? entities[0];

  const quickActions = [
    {
      label: "Add new Business Term Set",
      action: () => {
        setAddEntityOpen(true);
        setOpen(false);
      },
    },
    ...(selectedEntity
      ? [
          {
            label: "Add new Business Term in",
            chip: selectedEntity.name,
            action: () => {
              openDetailEntity(selectedEntity.id);
              setOpen(false);
            },
          },
          {
            label: "Add new Primary Key in",
            chip: selectedEntity.name,
            action: () => {
              openDetailEntity(selectedEntity.id);
              setOpen(false);
            },
          },
        ]
      : []),
    {
      label: "Generate a diagram",
      action: () => {
        setOnboardingOpen(true);
        setOpen(false);
      },
    },
    { label: "Build a process", action: () => flashToast("Not available in this preview yet.") },
    {
      label: "Clean up diagram",
      action: () => {
        autoLayout();
        setOpen(false);
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4"
      style={{ background: "rgba(10,10,14,0.45)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-pill)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="5" stroke="var(--text-tertiary)" strokeWidth="1.4" />
            <path d="M12 12l3.5 3.5" stroke="var(--text-tertiary)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim() && results.length === 0) {
                addRecentSearch(q.trim());
              }
            }}
            placeholder="Search or describe what you want by adding /"
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: "var(--text-primary)" }}
          />
          <kbd className="text-[11px] px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}>
            Esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {q.trim() === "" ? (
            <>
              {recentSearches.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                    Recent searches
                  </p>
                  {recentSearches.map((r) => (
                    <button
                      key={r}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:opacity-90"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setQ(r)}
                    >
                      <ClockIcon />
                      <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                        {r}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div>
                <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                  Quick actions
                </p>
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:opacity-90"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={qa.action}
                  >
                    <Sparkle size={14} />
                    <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                      {qa.label}
                      {"chip" in qa && qa.chip && (
                        <span
                          className="ml-1.5 text-[11px] font-mono px-1.5 py-[1px] rounded"
                          style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
                        >
                          {qa.chip}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : results.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              No matches for "{q}" — press Enter to save it as a recent search
            </div>
          ) : (
            results.map((r, i) => {
              const c = colorById(r.color);
              return (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:opacity-90"
                  onMouseDown={() => jump(r.entityId)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                  <span className="flex-1 min-w-0">
                    <span className="text-[13.5px] font-medium" style={{ color: "var(--text-primary)" }}>
                      {r.kind === "attribute" ? `${r.entityName}.${r.attrName}` : r.entityName}
                    </span>
                    <span className="block text-[11.5px] truncate" style={{ color: "var(--text-tertiary)" }}>
                      {r.detail}
                    </span>
                  </span>
                  <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ background: c.badgeBg, color: c.badgeText }}>
                    {r.kind}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {toast && (
          <div className="px-4 py-2.5 border-t text-[12.5px]" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="var(--text-tertiary)" strokeWidth="1.2" />
      <path d="M7 4.2V7l2 1.3" stroke="var(--text-tertiary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
