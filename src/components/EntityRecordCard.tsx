import { Fragment, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import { colorById } from "../lib/colors";
import { computeDependents } from "../lib/impact";
import { DATA_TYPES, type DataType, type EntityNode } from "../types";
import { parseCsvForImport } from "../lib/import";

const PAGE_SIZE = 10;

export default function EntityRecordCard({ entity }: { entity: EntityNode }) {
  const entities = useStore((s) => s.entities);
  const addAttribute = useStore((s) => s.addAttribute);
  const removeAttribute = useStore((s) => s.removeAttribute);
  const duplicateAttribute = useStore((s) => s.duplicateAttribute);
  const updateAttribute = useStore((s) => s.updateAttribute);
  const openTermDrawer = useStore((s) => s.openTermDrawer);
  const setImportPreview = useStore((s) => s.setImportPreview);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [addingName, setAddingName] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<DataType>("string");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const color = colorById(entity.color);
  const dependents = useMemo(() => computeDependents(entities, entity.id), [entities, entity.id]);
  const filtered = entity.attributes.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const commitAdd = () => {
    if (addingName && addingName.trim()) {
      addAttribute(entity.id, { name: addingName.trim(), dataType: addingType, refEntityId: null });
    }
    setAddingName(null);
  };

  return (
    <>
      <div className="rounded-2xl border p-5 sm:p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color.dot }} />
          <h1 className="text-[19px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {entity.name}
          </h1>
          <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            {entity.version}
          </span>
          {entity.status === "draft" && (
            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#c8811a" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f0a83a" }} />
              Draft
            </span>
          )}
        </div>
        {entity.updatedBy && (
          <p className="text-[11.5px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            Created by {entity.createdBy} · Last modified by {entity.updatedBy}
          </p>
        )}
        {entity.owner && (
          <p className="text-[11.5px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            Owner: {entity.owner}
          </p>
        )}
        {dependents.length > 0 && (
          <p className="text-[11.5px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            Used by {dependents.length} term{dependents.length !== 1 ? "s" : ""} —{" "}
            {Array.from(new Set(dependents.map((d) => d.entityName))).join(", ")}. Changing this may break those.
          </p>
        )}
        {entity.description && (
          <p className="text-[13px] mt-2.5 max-w-[640px]" style={{ color: "var(--text-secondary)" }}>
            {entity.description}
          </p>
        )}
        {!!entity.tags?.length && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {entity.tags.map((t) => (
              <span key={t} className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: color.badgeBg, color: color.badgeText }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-6 mb-2 flex-wrap">
        <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Business Terms
        </h3>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search"
            className="rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none w-[160px]"
            style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const text = await file.text();
              const preview = parseCsvForImport(text, entity.attributes);
              setImportPreview({ ...preview, targetEntityId: entity.id, fileName: file.name });
            }}
          />
          <button
            className="rounded-lg border px-3 py-1.5 text-[12.5px] font-medium"
            style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}
            onClick={() => fileInputRef.current?.click()}
          >
            Import file
          </button>
          <button
            className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white"
            style={{ background: "var(--accent-blue)" }}
            onClick={() => setAddingName("")}
          >
            + Add Business Term
          </button>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[640px]">
            <thead>
              <tr style={{ color: "var(--text-tertiary)" }}>
                <th className="w-8" />
                <th className="text-left font-medium px-3 py-2.5">Business Terms</th>
                <th className="text-left font-medium px-3 py-2.5">Data type</th>
                <th className="text-center font-medium px-3 py-2.5 w-20">Required</th>
                <th className="text-center font-medium px-3 py-2.5 w-20">Multiple</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((a) => {
                const ref = a.refEntityId ? entities.find((e) => e.id === a.refEntityId) : null;
                const isExpanded = expandedRef === a.id;
                return (
                  <Fragment key={a.id}>
                    <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-3 py-2">
                        <input type="checkbox" />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="flex items-center gap-1.5 hover:underline"
                          style={{ color: ref ? "var(--accent-blue-fg)" : "var(--text-primary)" }}
                          onClick={() => (ref ? setExpandedRef(isExpanded ? null : a.id) : openTermDrawer(entity.id, a.id))}
                        >
                          {ref && (
                            <span style={{ transform: isExpanded ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform .15s" }}>
                              ›
                            </span>
                          )}
                          {a.name}
                          {a.primaryKey && (
                            <span className="text-[9px] font-bold px-1 rounded" style={{ background: "var(--accent-blue)", color: "#fff" }}>
                              PK
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                        {ref ? `${ref.name} (Complex type)` : a.dataType}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={!!a.required} onChange={(e) => updateAttribute(entity.id, a.id, { required: e.target.checked })} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={!!a.multiple} onChange={(e) => updateAttribute(entity.id, a.id, { multiple: e.target.checked })} />
                      </td>
                      <td className="px-3 py-2 relative">
                        <button className="text-[13px] px-1" style={{ color: "var(--text-tertiary)" }} onClick={() => setRowMenu(rowMenu === a.id ? null : a.id)}>
                          •••
                        </button>
                        {rowMenu === a.id && (
                          <div
                            className="absolute right-2 top-full mt-1 rounded-lg border text-[12.5px] overflow-hidden z-10 w-32"
                            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pill)" }}
                          >
                            <button
                              className="block w-full text-left px-3 py-2 hover:opacity-80"
                              style={{ color: "var(--text-primary)" }}
                              onClick={() => {
                                duplicateAttribute(entity.id, a.id);
                                setRowMenu(null);
                              }}
                            >
                              Duplicate
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 hover:opacity-80 border-t"
                              style={{ color: "#e0475a", borderColor: "var(--border)" }}
                              onClick={() => {
                                removeAttribute(entity.id, a.id);
                                setRowMenu(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {ref && isExpanded && (
                      <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td />
                        <td colSpan={5} className="px-3 pb-3 pt-1">
                          <div className="rounded-lg border ml-4" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)" }}>
                            {ref.attributes.map((na, i) => (
                              <div
                                key={na.id}
                                className="flex items-center justify-between px-3 py-1.5 text-[12.5px]"
                                style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                              >
                                <span style={{ color: "var(--text-secondary)" }}>{na.name}</span>
                                <span className="font-mono" style={{ color: "var(--text-tertiary)" }}>
                                  {na.refEntityId ? entities.find((e) => e.id === na.refEntityId)?.name : na.dataType}
                                </span>
                              </div>
                            ))}
                            {ref.attributes.length === 0 && (
                              <div className="px-3 py-1.5 text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
                                No fields.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {addingName !== null && (
                <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2">
                    <input
                      autoFocus
                      value={addingName}
                      onChange={(e) => setAddingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitAdd();
                        if (e.key === "Escape") setAddingName(null);
                      }}
                      placeholder="Business Term name"
                      className="w-full rounded-lg border px-2 py-1 text-[13px] outline-none"
                      style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={addingType}
                      onChange={(e) => setAddingType(e.target.value as DataType)}
                      className="rounded-lg border px-2 py-1 text-[12.5px] outline-none"
                      style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                    >
                      {DATA_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td colSpan={2} />
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <button className="text-[12px] font-semibold" style={{ color: "var(--accent-blue-fg)" }} onClick={commitAdd}>
                        Add
                      </button>
                      <button className="text-[12px] font-medium" style={{ color: "var(--text-tertiary)" }} onClick={() => setAddingName(null)}>
                        Cancel
                      </button>
                    </div>
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
    </>
  );
}
