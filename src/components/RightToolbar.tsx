import { useState } from "react";
import { useStore } from "../store";
import { exportCSV, exportPNG, exportPrintDocument } from "../lib/export";

const COLLABORATORS = [
  { initials: "C", color: "#2fd48f" },
  { initials: "J", color: "#a06bf0" },
];

export default function RightToolbar() {
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const camera = useStore((s) => s.camera);
  const zoomTo = useStore((s) => s.zoomTo);
  const zoomBy = useStore((s) => s.zoomBy);
  const resetCamera = useStore((s) => s.resetCamera);
  const entities = useStore((s) => s.entities);
  const fileName = useStore((s) => s.fileName);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  const [zoomOpen, setZoomOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const brokenRefs = entities.reduce(
    (acc, e) => acc + e.attributes.filter((a) => a.refEntityId && !entities.some((t) => t.id === a.refEntityId)).length,
    0
  );

  return (
    <div
      className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-2xl p-1.5 max-w-[calc(100vw-2rem)]"
      style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-pill)", border: "1px solid var(--border)" }}
    >
      <button
        title={viewMode === "canvas" ? "Switch to table view" : "Switch to canvas view"}
        onClick={() => setViewMode(viewMode === "canvas" ? "table" : "canvas")}
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ color: "var(--text-secondary)" }}
      >
        {viewMode === "canvas" ? (
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <rect x="1.5" y="2" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.5 6.3h14M6.5 6.3V15" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <rect x="1.5" y="2" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <rect x="3.5" y="4" width="4" height="3" rx="0.6" fill="currentColor" opacity="0.5" />
            <rect x="9" y="4" width="4.5" height="3" rx="0.6" fill="currentColor" opacity="0.5" />
            <rect x="3.5" y="9" width="10" height="3" rx="0.6" fill="currentColor" opacity="0.5" />
          </svg>
        )}
      </button>

      <div className="items-center -space-x-1.5 hidden sm:flex">
        {COLLABORATORS.map((c) => (
          <div
            key={c.initials}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-white border-2"
            style={{ background: c.color, borderColor: "var(--bg-surface)" }}
          >
            {c.initials}
          </div>
        ))}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold border-2"
          style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", borderColor: "var(--bg-surface)" }}
        >
          +4
        </div>
      </div>

      {viewMode === "canvas" && (
        <div className="relative">
          <button
            className="flex items-center gap-1 rounded-xl px-3 h-9 text-[13px] font-medium"
            style={{ color: "var(--text-primary)" }}
            onClick={() => setZoomOpen((v) => !v)}
          >
            {Math.round(camera.scale * 100)}%
            <Chevron />
          </button>
          {zoomOpen && (
            <Dropdown onClose={() => setZoomOpen(false)}>
              <MenuItem label="Zoom in" shortcut="+" onClick={() => { zoomBy(0.15); setZoomOpen(false); }} />
              <MenuItem label="Zoom out" shortcut="−" onClick={() => { zoomBy(-0.15); setZoomOpen(false); }} />
              <MenuItem label="Zoom to 50%" onClick={() => { zoomTo(0.5); setZoomOpen(false); }} />
              <MenuItem label="Zoom to 100%" onClick={() => { zoomTo(1); setZoomOpen(false); }} />
              <MenuItem label="Zoom to fit" onClick={() => { resetCamera(); setZoomOpen(false); }} />
              <MenuItem label="Zoom way out" onClick={() => { zoomTo(0.2); setZoomOpen(false); }} />
            </Dropdown>
          )}
        </div>
      )}

      <div className="relative hidden md:block">
        <button
          className="rounded-xl px-3.5 h-9 text-[13px] font-medium"
          style={{ color: "var(--text-primary)" }}
          onClick={() => setShareOpen((v) => !v)}
        >
          Share
        </button>
        {shareOpen && (
          <Dropdown onClose={() => setShareOpen(false)} align="right">
            <MenuItem label="Export as PNG" onClick={() => { exportPNG(entities, fileName, theme === "dark"); setShareOpen(false); }} />
            <MenuItem label="Export as Excel (.csv)" onClick={() => { exportCSV(entities, fileName); setShareOpen(false); }} />
            <MenuItem label="Export as PDF" onClick={() => { exportPrintDocument(entities, fileName); setShareOpen(false); }} />
          </Dropdown>
        )}
      </div>

      <div className="relative">
        <button
          className="flex items-center gap-1 rounded-xl px-3.5 h-9 text-[13px] font-semibold text-white"
          style={{ background: "var(--accent-blue)" }}
          onClick={() => setValidateOpen((v) => !v)}
        >
          Validate
          <Chevron white />
        </button>
        {validateOpen && (
          <Dropdown onClose={() => setValidateOpen(false)} align="right">
            <div className="px-3 py-2 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
              {brokenRefs === 0 ? "No broken references found." : `${brokenRefs} broken reference(s) found.`}
            </div>
            <MenuItem label="Run full validation" onClick={() => setValidateOpen(false)} />
          </Dropdown>
        )}
      </div>

      <div className="relative">
        <button
          title="Account menu"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
          style={{ background: "#4b4d5c" }}
          onClick={() => setUserOpen((v) => !v)}
        >
          L
        </button>
        {userOpen && (
          <Dropdown onClose={() => setUserOpen(false)} align="right">
            <MenuItem
              label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => {
                toggleTheme();
                setUserOpen(false);
              }}
            />
          </Dropdown>
        )}
      </div>
    </div>
  );
}

function Dropdown({ children, onClose, align = "left" }: { children: React.ReactNode; onClose: () => void; align?: "left" | "right" }) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className={`absolute top-full mt-1.5 rounded-xl border overflow-hidden z-40 min-w-[190px] ${align === "right" ? "right-0" : "left-0"}`}
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pill)" }}
      >
        {children}
      </div>
    </>
  );
}

function MenuItem({ label, shortcut, onClick }: { label: string; shortcut?: string; onClick: () => void }) {
  return (
    <button
      className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] hover:opacity-80 text-left"
      style={{ color: "var(--text-primary)" }}
      onClick={onClick}
    >
      {label}
      {shortcut && <span style={{ color: "var(--text-tertiary)" }}>{shortcut}</span>}
    </button>
  );
}

function Chevron({ white }: { white?: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke={white ? "#fff" : "currentColor"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
