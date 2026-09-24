import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import EntityListPanel from "./EntityListPanel";
import AIAssistPanel, { Sparkle } from "./AIAssistPanel";

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="10.5" stroke="var(--accent-blue)" strokeWidth="3" />
    </svg>
  );
}

function PanelIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="3" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d={open ? "M7 3v12" : "M7 3v12"} stroke="currentColor" strokeWidth="1.4" />
      {!open && <path d="M11 8L9 9L11 10" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(-1,0)" />}
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="3" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 3v12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="2.5" width="9.5" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 6.5h4M6 9.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="14" cy="13.5" r="3.4" fill="var(--bg-surface)" stroke="currentColor" strokeWidth="1.3" />
      <path d="M14 12.1v2.8M12.6 13.5h2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 12l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function AutoLayoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="2.5" width="6" height="4" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="8.5" width="6" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="10.5" width="6" height="5" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function RailDivider() {
  return <div className="w-8 h-px shrink-0" style={{ background: "var(--border)" }} />;
}

function RailButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="w-14 py-2.5 shrink-0 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors"
      style={{
        background: active ? "var(--accent-blue-soft)" : "transparent",
        color: active ? "var(--accent-blue-fg)" : "var(--text-tertiary)",
      }}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

export default function LeftSection() {
  const navigate = useNavigate();
  const leftPanelOpen = useStore((s) => s.leftPanelOpen);
  const leftPanelMode = useStore((s) => s.leftPanelMode);
  const toggleLeftPanel = useStore((s) => s.toggleLeftPanel);
  const closeLeftPanel = useStore((s) => s.closeLeftPanel);
  const fileName = useStore((s) => s.fileName);
  const setFileName = useStore((s) => s.setFileName);
  const entities = useStore((s) => s.entities);
  const viewMode = useStore((s) => s.viewMode);
  const addEntityOpen = useStore((s) => s.addEntityOpen);
  const setAddEntityOpen = useStore((s) => s.setAddEntityOpen);
  const searchOpen = useStore((s) => s.searchOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const autoLayout = useStore((s) => s.autoLayout);

  const [layoutFlash, setLayoutFlash] = useState(false);
  const runAutoLayout = () => {
    autoLayout();
    setLayoutFlash(true);
    window.setTimeout(() => setLayoutFlash(false), 350);
  };

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(fileName);
  const inputRef = useRef<HTMLInputElement>(null);

  const isolatedCount = useMemo(() => {
    const referenced = new Set<string>();
    entities.forEach((e) => e.attributes.forEach((a) => a.refEntityId && referenced.add(a.refEntityId)));
    return entities.filter((e) => !referenced.has(e.id) && !e.attributes.some((a) => a.refEntityId)).length;
  }, [entities]);

  const commitName = () => {
    setFileName(draftName.trim() || fileName);
    setEditingName(false);
  };

  if (!leftPanelOpen) {
    return (
      <div
        className="absolute top-4 left-4 flex items-center gap-3 pl-4 pr-3 h-14 rounded-2xl z-30 max-w-[calc(100vw-2rem)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-pill)" }}
      >
        <button title="Back to dashboard" onClick={() => navigate("/")} className="shrink-0">
          <Logo />
        </button>
        {editingName ? (
          <input
            ref={inputRef}
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && commitName()}
            className="text-[15px] font-semibold bg-transparent outline-none border-b w-40"
            style={{ color: "var(--text-primary)", borderColor: "var(--accent-blue)" }}
          />
        ) : (
          <button
            className="text-[15px] font-semibold max-w-[45vw] truncate"
            style={{ color: "var(--text-primary)" }}
            onClick={() => {
              setDraftName(fileName);
              setEditingName(true);
            }}
            title="Rename file"
          >
            {fileName}
          </button>
        )}

        <div className="relative">
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => toggleLeftPanel("assist")}
            title="AI Assist"
          >
            <Sparkle size={17} />
          </button>
          {isolatedCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ width: 14, height: 14, background: "#f36ba7" }}
            >
              {isolatedCount}
            </span>
          )}
        </div>

        <button
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ color: "var(--text-secondary)" }}
          onClick={() => toggleLeftPanel("file")}
          title="Expand panel"
        >
          <PanelIcon open={false} />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 h-full flex z-30 max-w-[92vw]">
      <div
        className="w-[64px] shrink-0 flex flex-col items-center pt-4 gap-2 overflow-y-auto no-scrollbar"
        style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}
      >
        <button title="Back to dashboard" onClick={() => navigate("/")} className="mb-1 shrink-0">
          <Logo />
        </button>
        <RailDivider />
        <RailButton icon={<FileIcon />} label="File" active={leftPanelMode === "file"} onClick={() => toggleLeftPanel("file")} />
        <RailDivider />
        <RailButton icon={<AddIcon />} label="Add" active={addEntityOpen} onClick={() => setAddEntityOpen(true)} />
        <RailDivider />
        <RailButton icon={<SearchIcon />} label="Search" active={searchOpen} onClick={() => setSearchOpen(true)} />
        {viewMode === "canvas" && (
          <>
            <RailDivider />
            <RailButton icon={<AutoLayoutIcon />} label="Auto Layout" active={layoutFlash} onClick={runAutoLayout} />
          </>
        )}
        <RailDivider />
        <RailButton
          icon={<Sparkle size={18} />}
          label="AI Assist"
          active={leftPanelMode === "assist"}
          onClick={() => toggleLeftPanel("assist")}
        />
      </div>

      <div
        className="w-[85vw] sm:w-[320px] shrink-0 flex flex-col min-h-0"
        style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          {editingName ? (
            <input
              ref={inputRef}
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === "Enter" && commitName()}
              className="text-[16px] font-semibold bg-transparent outline-none border-b flex-1 min-w-0"
              style={{ color: "var(--text-primary)", borderColor: "var(--accent-blue)" }}
            />
          ) : (
            <button
              className="text-[16px] font-semibold truncate text-left"
              style={{ color: "var(--text-primary)" }}
              onClick={() => {
                setDraftName(fileName);
                setEditingName(true);
              }}
              title="Rename file"
            >
              {fileName}
            </button>
          )}
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ml-2"
            style={{ color: "var(--text-secondary)" }}
            onClick={closeLeftPanel}
            title="Collapse panel"
          >
            <PanelIcon open={true} />
          </button>
        </div>

        {leftPanelMode === "file" ? <EntityListPanel /> : <AIAssistPanel />}
      </div>
    </div>
  );
}
