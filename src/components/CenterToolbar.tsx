import { useStore } from "../store";

export default function CenterToolbar() {
  const setAddEntityOpen = useStore((s) => s.setAddEntityOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const autoLayout = useStore((s) => s.autoLayout);
  const leftPanelOpen = useStore((s) => s.leftPanelOpen);

  return (
    <div
      className={`absolute top-4 -translate-x-1/2 z-20 flex items-center gap-1 rounded-2xl px-1.5 py-1.5 ${
        leftPanelOpen ? "left-1/2 sm:left-[calc(50%+192px)]" : "left-1/2"
      }`}
      style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-pill)", border: "1px solid var(--border)" }}
    >
      <ToolbarButton title="Add entity" onClick={() => setAddEntityOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="3" y="2.5" width="9.5" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6 6.5h4M6 9.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="14" cy="13.5" r="3.4" fill="var(--bg-surface)" stroke="currentColor" strokeWidth="1.3" />
          <path d="M14 12.1v2.8M12.6 13.5h2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </ToolbarButton>
      <Divider />
      <ToolbarButton title="Search" onClick={() => setSearchOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M12 12l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </ToolbarButton>
      <Divider />
      <ToolbarButton title="Auto layout" onClick={autoLayout}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2.5" y="2.5" width="6" height="6" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9.5" y="2.5" width="6" height="4" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9.5" y="8.5" width="6" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
          <rect x="2.5" y="10.5" width="6" height="5" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5" style={{ background: "var(--border)" }} />;
}
