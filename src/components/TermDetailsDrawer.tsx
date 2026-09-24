import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { colorById } from "../lib/colors";
import type { Attribute, EntityNode } from "../types";

export default function TermDetailsDrawer() {
  const termDrawer = useStore((s) => s.termDrawer);
  const closeTermDrawer = useStore((s) => s.closeTermDrawer);
  const entities = useStore((s) => s.entities);
  const updateAttribute = useStore((s) => s.updateAttribute);
  const updateEntityMeta = useStore((s) => s.updateEntityMeta);

  const [tab, setTab] = useState<"terms" | "details">("terms");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [valueDraft, setValueDraft] = useState("");

  useEffect(() => {
    if (!termDrawer) return;
    setTab("terms");
    setQuery("");
    setExpandedId(termDrawer.attrId ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termDrawer?.entityId, termDrawer?.attrId]);

  useEffect(() => {
    if (!termDrawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTermDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termDrawer]);

  const entity = entities.find((e) => e.id === termDrawer?.entityId);

  if (!termDrawer || !entity) return null;

  const color = colorById(entity.color);
  const filtered = entity.attributes.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  const apply = (publish: boolean) => {
    if (publish) updateEntityMeta(entity.id, { status: "published" });
    closeTermDrawer();
  };

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={closeTermDrawer} />
      <div
        className="fixed top-20 right-4 z-40 w-[92vw] max-w-[380px] max-h-[calc(100vh-6.5rem)] rounded-2xl border flex flex-col"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pill)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color.dot }} />
            <h2 className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {entity.name} Details
            </h2>
          </div>
          <button onClick={closeTermDrawer} style={{ color: "var(--text-tertiary)" }}>
            ✕
          </button>
        </div>

        <div className="flex gap-4 px-4 border-b" style={{ borderColor: "var(--border)" }}>
          {(["terms", "details"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-2 pt-1 text-[13px] font-medium relative capitalize"
              style={{ color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)" }}
            >
              {t}
              {tab === t && <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded" style={{ background: "var(--text-primary)" }} />}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {tab === "terms" ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12.5px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Business Terms ({entity.attributes.length})
                </span>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none mb-2"
                style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
              />
              <div className="space-y-1.5">
                {filtered.map((a) => {
                  const isOpen = expandedId === a.id;
                  const typeLabel = a.refEntityId ? entities.find((e) => e.id === a.refEntityId)?.name ?? "ref" : a.dataType;
                  return (
                    <div key={a.id} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                      <button
                        className="w-full flex items-center justify-between px-2.5 py-2 text-left"
                        onClick={() => {
                          setExpandedId(isOpen ? null : a.id);
                          setValueDraft("");
                        }}
                      >
                        <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                          {a.name}
                          {a.primaryKey && (
                            <span className="ml-1.5 text-[10px] font-semibold px-1 py-px rounded" style={{ background: "var(--accent-blue)", color: "#fff" }}>
                              PK
                            </span>
                          )}
                        </span>
                        <span className="text-[12px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                          {typeLabel}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                          <div>
                            <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                              Definition
                            </p>
                            <textarea
                              value={a.definition ?? ""}
                              onChange={(e) => updateAttribute(entity.id, a.id, { definition: e.target.value })}
                              placeholder="What this term means in business terms — not just how it's stored"
                              rows={2}
                              className="w-full rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none resize-none"
                              style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                            />
                          </div>

                          <AllowedValuesEditor
                            entity={entity}
                            attr={a}
                            color={color}
                            entities={entities}
                            valueDraft={valueDraft}
                            setValueDraft={setValueDraft}
                          />

                          <div>
                            <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                              Constraints
                            </p>
                            <div className="flex gap-1.5">
                              <Pill active={!!a.primaryKey} onClick={() => updateAttribute(entity.id, a.id, { primaryKey: !a.primaryKey })}>
                                Primary key
                              </Pill>
                              <Pill active={!!a.foreignKey} onClick={() => updateAttribute(entity.id, a.id, { foreignKey: !a.foreignKey })}>
                                Foreign key
                              </Pill>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                              Sensitivity
                            </p>
                            <div className="flex gap-3">
                              <Checkbox
                                checked={!!a.sensitivity?.personal}
                                onChange={(v) => updateAttribute(entity.id, a.id, { sensitivity: { personal: v, business: !!a.sensitivity?.business } })}
                                label="Personal"
                              />
                              <Checkbox
                                checked={!!a.sensitivity?.business}
                                onChange={(v) => updateAttribute(entity.id, a.id, { sensitivity: { personal: !!a.sensitivity?.personal, business: v } })}
                                label="Business"
                              />
                            </div>
                          </div>

                          <ToggleRow
                            label="Multiplicity"
                            hint="Allow multiple values for this term"
                            checked={!!a.multiple}
                            onChange={(v) => updateAttribute(entity.id, a.id, { multiple: v })}
                          />
                          <ToggleRow
                            label="State"
                            hint="Stateful"
                            checked={!!a.stateful}
                            onChange={(v) => updateAttribute(entity.id, a.id, { stateful: v })}
                          />
                          <ToggleRow
                            label="Required"
                            hint="Must be present"
                            checked={!!a.required}
                            onChange={(v) => updateAttribute(entity.id, a.id, { required: v })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>
                  Name
                </label>
                <input
                  value={entity.name}
                  onChange={(e) => updateEntityMeta(entity.id, { name: e.target.value })}
                  className="w-full rounded-lg border px-2.5 py-1.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>
                  Description
                </label>
                <textarea
                  value={entity.description ?? ""}
                  onChange={(e) => updateEntityMeta(entity.id, { description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none resize-none"
                  style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {(entity.tags ?? []).map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: color.badgeBg, color: color.badgeText }}
                    >
                      {t}
                      <button onClick={() => updateEntityMeta(entity.id, { tags: (entity.tags ?? []).filter((x) => x !== t) })}>×</button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagDraft.trim()) {
                      updateEntityMeta(entity.id, { tags: [...(entity.tags ?? []), tagDraft.trim()] });
                      setTagDraft("");
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="w-full rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none"
                  style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>
                  Owner
                </label>
                <input
                  value={entity.owner ?? ""}
                  onChange={(e) => updateEntityMeta(entity.id, { owner: e.target.value })}
                  placeholder="Who owns/decides this entity's terms"
                  className="w-full rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none"
                  style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                />
              </div>
              {entity.updatedBy && (
                <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  Created by {entity.createdBy} · Last modified by {entity.updatedBy}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3.5 border-t space-y-1.5" style={{ borderColor: "var(--border)" }}>
          <button className="w-full rounded-lg py-2 text-[13px] font-semibold text-white" style={{ background: "var(--accent-blue)" }} onClick={() => apply(false)}>
            Apply changes
          </button>
          <button
            className="w-full rounded-lg py-2 text-[13px] font-semibold border"
            style={{ borderColor: "var(--accent-blue)", color: "var(--accent-blue-fg)" }}
            onClick={() => apply(true)}
          >
            Apply and Publish
          </button>
          <button className="w-full py-1 text-[12.5px]" style={{ color: "var(--text-tertiary)" }} onClick={closeTermDrawer}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

function AllowedValuesEditor({
  entity,
  attr,
  color,
  entities,
  valueDraft,
  setValueDraft,
}: {
  entity: EntityNode;
  attr: Attribute;
  color: ReturnType<typeof colorById>;
  entities: EntityNode[];
  valueDraft: string;
  setValueDraft: (v: string) => void;
}) {
  const updateAttribute = useStore((s) => s.updateAttribute);
  const connectAttribute = useStore((s) => s.connectAttribute);
  const disconnectAttribute = useStore((s) => s.disconnectAttribute);
  const addEntity = useStore((s) => s.addEntity);

  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerFocused, setPickerFocused] = useState(false);

  const linked = attr.refEntityId ? entities.find((e) => e.id === attr.refEntityId) : null;

  const allUsedValues = useMemo(() => {
    const set = new Set<string>();
    entities.forEach((e) => {
      e.attributes.forEach((a) => (a.allowedValues ?? []).forEach((v) => set.add(v)));
      if (e.kind === "valueList") (e.values ?? []).forEach((v) => set.add(v));
    });
    return Array.from(set).sort();
  }, [entities]);

  if (linked) {
    const linkedColor = colorById(linked.color);
    return (
      <div>
        <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>
          Allowed values
        </p>
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5"
            style={{ background: linkedColor.badgeBg, color: linkedColor.badgeText }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: linkedColor.dot }} />
            Linked to {linked.name}
          </span>
          <button
            className="text-[11.5px] font-medium"
            style={{ color: "var(--text-tertiary)" }}
            onClick={() => disconnectAttribute(entity.id, attr.id)}
          >
            Unlink
          </button>
        </div>
      </div>
    );
  }

  const suggestions = allUsedValues
    .filter((v) => !(attr.allowedValues ?? []).includes(v) && v.toLowerCase().includes(valueDraft.trim().toLowerCase()))
    .slice(0, 8);

  const valueLists = entities.filter((e) => e.kind === "valueList");
  const filteredLists = valueLists
    .filter((e) => e.name.toLowerCase().includes(pickerQuery.trim().toLowerCase()))
    .slice(0, 8);

  const commitValue = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed || (attr.allowedValues ?? []).includes(trimmed)) return;
    updateAttribute(entity.id, attr.id, { allowedValues: [...(attr.allowedValues ?? []), trimmed] });
    setValueDraft("");
  };

  const promoteToValueList = () => {
    const listName = `${entity.name} ${attr.name} values`;
    const newId = addEntity(listName, "valueList", [], attr.allowedValues ?? []);
    connectAttribute(entity.id, attr.id, newId);
    updateAttribute(entity.id, attr.id, { allowedValues: [] });
  };

  return (
    <div>
      <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>
        Allowed values
      </p>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {(attr.allowedValues ?? []).map((v) => (
          <span
            key={v}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: color.badgeBg, color: color.badgeText }}
          >
            {v}
            <button
              onClick={() =>
                updateAttribute(entity.id, attr.id, { allowedValues: (attr.allowedValues ?? []).filter((x) => x !== v) })
              }
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          value={valueDraft}
          onChange={(e) => setValueDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitValue(valueDraft);
          }}
          placeholder="Add an allowed value and press Enter"
          className="w-full rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none"
          style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
        />
        {valueDraft.trim() && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-lg border overflow-hidden z-10"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pill)" }}
          >
            {suggestions.map((v) => (
              <button
                key={v}
                className="w-full text-left px-2.5 py-1.5 text-[12.5px]"
                style={{ color: "var(--text-primary)" }}
                onMouseDown={() => commitValue(v)}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {(attr.allowedValues?.length ?? 0) >= 2 && (
        <button
          className="mt-1.5 text-[11.5px] font-medium"
          style={{ color: "var(--accent-blue-fg)" }}
          onClick={promoteToValueList}
        >
          Save as reusable value list
        </button>
      )}

      <p className="text-[10.5px] font-medium mt-2.5 mb-1" style={{ color: "var(--text-tertiary)" }}>
        or link an existing value list
      </p>
      <div className="relative">
        <input
          value={pickerQuery}
          onChange={(e) => setPickerQuery(e.target.value)}
          onFocus={() => setPickerFocused(true)}
          onBlur={() => setPickerFocused(false)}
          placeholder="Search value lists"
          className="w-full rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none"
          style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
        />
        {pickerFocused && (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-lg border overflow-hidden z-10"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pill)" }}
          >
            {filteredLists.length === 0 ? (
              <p className="px-2.5 py-1.5 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                No value lists found
              </p>
            ) : (
              filteredLists.map((e) => {
                const c = colorById(e.color);
                return (
                  <button
                    key={e.id}
                    className="w-full flex items-center gap-1.5 text-left px-2.5 py-1.5 text-[12.5px]"
                    style={{ color: "var(--text-primary)" }}
                    onMouseDown={() => {
                      connectAttribute(entity.id, attr.id, e.id);
                      updateAttribute(entity.id, attr.id, { allowedValues: [] });
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
                    <span className="flex-1 truncate">{e.name}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {e.values?.length ?? 0} values
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-[11.5px] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1"
      style={{
        borderColor: active ? "var(--accent-blue)" : "var(--border-strong)",
        background: active ? "var(--accent-blue)" : "transparent",
        color: active ? "#fff" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[12.5px] font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          {hint}
        </p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="w-9 h-5 rounded-full relative transition-colors shrink-0"
        style={{ background: checked ? "var(--accent-blue)" : "var(--border-strong)" }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? 18 : 2 }}
        />
      </button>
    </div>
  );
}
