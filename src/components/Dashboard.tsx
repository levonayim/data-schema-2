import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { TEMPLATES, templateStarterEntities } from "../data/mockSchemas";

type Tab = "recent" | "drafts" | "published" | "shared";
const PAGE_SIZE = 10;

export default function Dashboard() {
  const schemas = useStore((s) => s.schemas);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const openSchema = useStore((s) => s.openSchema);
  const createSchema = useStore((s) => s.createSchema);
  const setOnboardingOpen = useStore((s) => s.setOnboardingOpen);
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("recent");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    let list = [...schemas];
    if (tab === "drafts") list = list.filter((s) => s.status === "draft");
    if (tab === "published") list = list.filter((s) => s.status === "published");
    if (query.trim()) list = list.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));
    list.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return list;
  }, [schemas, tab, query]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const open = (id: string) => {
    openSchema(id);
    navigate("/editor");
  };

  const openTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    createSchema(t.name, templateStarterEntities(id));
    navigate("/editor");
  };

  const relTime = (iso: string) => {
    const mins = Math.round((Date.now() - +new Date(iso)) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: "var(--bg-canvas)" }}>
      <div className="flex min-h-full">
        <aside
          className="w-[210px] shrink-0 hidden md:flex flex-col py-4 px-3"
          style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 px-2 mb-5">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8.5" stroke="var(--accent-blue)" strokeWidth="2.5" />
            </svg>
            <span className="font-semibold text-[14px]" style={{ color: "var(--text-primary)" }}>
              ABC Bank
            </span>
          </div>

          <NavGroup>
            <NavItem active label="Home" />
            <NavItem label="My Tasks" />
            <NavItem label="Recents" />
            <NavItem label="Drafts" />
            <NavItem label="All" />
          </NavGroup>

          <p className="px-2.5 mt-5 mb-1.5 text-[10.5px] font-semibold tracking-wide" style={{ color: "var(--text-tertiary)" }}>
            PLATFORM
          </p>
          <NavGroup>
            <NavItem label="Data" expanded>
              <NavItem sub active label="Schemas" />
              <NavItem sub label="Feature Management" />
            </NavItem>
            <NavItem label="Workflows" />
            <NavItem label="Models & Assets" />
            <NavItem label="Insights" />
          </NavGroup>
        </aside>

        <div className="flex-1 min-w-0">
          <div
            className="flex items-center justify-between px-5 sm:px-8 h-14 sticky top-0 z-10"
            style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}
          >
            <span className="text-[13.5px] font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span style={{ color: "var(--text-tertiary)" }}>☰</span>
              Schemas
            </span>
            <div className="flex items-center gap-4">
              <button className="text-[12.5px] hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
                Marketplace
              </button>
              <button className="text-[12.5px] hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
                Docs
              </button>
              <button className="text-[12.5px] hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
                AI Assistant
              </button>
              <button title="Toggle theme" onClick={toggleTheme} style={{ color: "var(--text-secondary)" }}>
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold text-white" style={{ background: "#4b4d5c" }}>
                L
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-8 py-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Templates
              </h2>
              <button className="text-[12.5px] font-medium" style={{ color: "var(--accent-blue-fg)" }} onClick={() => setOnboardingOpen(true)}>
                View more templates
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  className="text-left rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
                  onClick={() => openTemplate(t.id)}
                >
                  <div className="h-16" style={{ background: "var(--bg-surface-2)" }} />
                  <div className="p-2.5">
                    <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {t.name}
                    </p>
                    <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="flex gap-4">
                {([
                  ["recent", "Recently viewed"],
                  ["drafts", "Drafts"],
                  ["published", "Published"],
                  ["shared", "Shared"],
                ] as [Tab, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTab(key);
                      setPage(0);
                    }}
                    className="pb-2 text-[13px] font-medium relative"
                    style={{ color: tab === key ? "var(--text-primary)" : "var(--text-tertiary)" }}
                  >
                    {label}
                    {tab === key && <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded" style={{ background: "var(--text-primary)" }} />}
                  </button>
                ))}
              </div>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search"
                className="rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none w-[180px]"
                style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
              />
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[600px]">
                  <thead>
                    <tr style={{ color: "var(--text-tertiary)" }}>
                      <th className="text-left font-medium px-4 py-2.5">Name</th>
                      <th className="text-left font-medium px-4 py-2.5">Version</th>
                      <th className="text-left font-medium px-4 py-2.5">Status</th>
                      <th className="text-left font-medium px-4 py-2.5">Last Updated</th>
                      <th className="text-left font-medium px-4 py-2.5">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((s) => (
                      <tr key={s.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="px-4 py-2.5">
                          <button className="font-medium hover:underline" style={{ color: "var(--accent-blue-fg)" }} onClick={() => open(s.id)}>
                            {s.name}
                          </button>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                          {s.version}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={
                              s.status === "published"
                                ? { background: "rgba(47,212,143,0.16)", color: "#0f9d63" }
                                : { background: "rgba(240,168,58,0.16)", color: "#c8811a" }
                            }
                          >
                            {s.status === "published" ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                          {relTime(s.updatedAt)}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                          {relTime(s.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {pageRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
                          No schemas here yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t text-[12.5px]" style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}>
                <span>
                  Items per page <strong style={{ color: "var(--text-primary)" }}>{PAGE_SIZE}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30">
                    ‹
                  </button>
                  <span>
                    {page + 1} / {totalPages}
                  </span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30">
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-0.5">{children}</div>;
}

function NavItem({
  label,
  active,
  sub,
  expanded,
  children,
}: {
  label: string;
  active?: boolean;
  sub?: boolean;
  expanded?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <button
        className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] ${sub ? "pl-6" : ""}`}
        style={{
          background: active ? "var(--bg-hover)" : "transparent",
          color: active ? "var(--text-primary)" : "var(--text-secondary)",
          fontWeight: active ? 600 : 500,
        }}
      >
        {label}
        {children && <span style={{ color: "var(--text-tertiary)" }}>{expanded ? "⌄" : "›"}</span>}
      </button>
      {children && <div className="mt-0.5">{children}</div>}
    </div>
  );
}
