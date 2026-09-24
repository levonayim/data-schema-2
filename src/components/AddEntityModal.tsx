import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { DATA_TYPES, type DataType, type EntityKind } from "../types";
import { parseCsvForImport } from "../lib/import";

interface DraftAttr {
  key: string;
  name: string;
  kind: "type" | "ref";
  dataType: DataType;
  refEntityId: string;
  primaryKey: boolean;
  required: boolean;
}

const mkAttr = (): DraftAttr => ({
  key: Math.random().toString(36).slice(2),
  name: "",
  kind: "type",
  dataType: "string",
  refEntityId: "",
  primaryKey: false,
  required: false,
});

export default function AddEntityModal() {
  const open = useStore((s) => s.addEntityOpen);
  const setOpen = useStore((s) => s.setAddEntityOpen);
  const entities = useStore((s) => s.entities);
  const addEntity = useStore((s) => s.addEntity);

  const [entityKind, setEntityKind] = useState<EntityKind>("termSet");
  const [name, setName] = useState("");
  const [attrs, setAttrs] = useState<DraftAttr[]>([mkAttr()]);
  const [values, setValues] = useState<string[]>([""]);
  const [menuOpenKey, setMenuOpenKey] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setOpen(false);
    setEntityKind("termSet");
    setName("");
    setAttrs([mkAttr()]);
    setValues([""]);
    setMenuOpenKey(null);
    setImportNotice(null);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const preview = parseCsvForImport(text, []);
    if (preview.ready.length === 0) {
      setImportNotice(`No usable rows found${preview.errors.length ? ` (${preview.errors.length} had errors)` : ""}. Expect CSV columns: name, type[, required, multiple].`);
      return;
    }
    setAttrs(
      preview.ready.map((r) => ({
        key: Math.random().toString(36).slice(2),
        name: r.name,
        kind: "type",
        dataType: r.dataType ?? "string",
        refEntityId: "",
        primaryKey: false,
        required: r.required,
      }))
    );
    if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, ""));
    setImportNotice(
      `Imported ${preview.ready.length} term${preview.ready.length === 1 ? "" : "s"}${preview.errors.length ? ` — skipped ${preview.errors.length} with errors` : ""}.`
    );
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) return;
    if (entityKind === "valueList") {
      addEntity(name.trim(), "valueList", [], values.map((v) => v.trim()).filter(Boolean));
    } else {
      const cleaned = attrs.filter((a) => a.name.trim());
      addEntity(
        name.trim(),
        "termSet",
        cleaned.map((a) => ({
          name: a.name.trim(),
          dataType: a.kind === "type" ? a.dataType : null,
          refEntityId: a.kind === "ref" ? a.refEntityId || null : null,
          primaryKey: a.primaryKey,
          required: a.required,
        }))
      );
    }
    close();
  };

  const move = (i: number, dir: -1 | 1) => {
    setAttrs((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(10,10,14,0.45)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl mt-8 sm:mt-0 max-h-[86vh] flex flex-col"
        style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-pill)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Add Entity
          </h2>
          <button onClick={close} style={{ color: "var(--text-tertiary)" }}>
            ✕
          </button>
        </div>

        <div className="px-5 pt-4 overflow-y-auto space-y-4">
          <div className="flex rounded-lg p-0.5 w-fit" style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border)" }}>
            {(["termSet", "valueList"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setEntityKind(k)}
                className="px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold transition-colors"
                style={{
                  background: entityKind === k ? "var(--accent-blue)" : "transparent",
                  color: entityKind === k ? "#fff" : "var(--text-secondary)",
                }}
              >
                {k === "termSet" ? "Business Term Set" : "Value List"}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={entityKind === "termSet" ? "e.g. billingAccount" : "e.g. namePrefix"}
              className="w-full rounded-lg border px-3 py-2 text-[13.5px] outline-none"
              style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
            />
          </div>

          {entityKind === "termSet" ? (
            <div>
              <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Business Terms
              </label>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {attrs.map((a, i) => (
                  <div
                    key={a.key}
                    className="flex items-center gap-1.5 px-2.5 py-2"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                  >
                    <input
                      value={a.name}
                      onChange={(e) =>
                        setAttrs((list) => list.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))
                      }
                      placeholder="Business Term name"
                      className="flex-1 min-w-0 rounded-lg border px-2.5 py-1.5 text-[13px] outline-none"
                      style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                    />
                    {a.kind === "type" ? (
                      <select
                        value={a.dataType}
                        onChange={(e) =>
                          setAttrs((list) => list.map((x, xi) => (xi === i ? { ...x, dataType: e.target.value as DataType } : x)))
                        }
                        className="rounded-lg border px-2 py-1.5 text-[12.5px] outline-none w-[100px] shrink-0"
                        style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                      >
                        {DATA_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={a.refEntityId}
                        onChange={(e) =>
                          setAttrs((list) => list.map((x, xi) => (xi === i ? { ...x, refEntityId: e.target.value } : x)))
                        }
                        className="rounded-lg border px-2 py-1.5 text-[12.5px] outline-none w-[100px] shrink-0"
                        style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                      >
                        {entities.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <IconBtn title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowIcon dir="up" />
                    </IconBtn>
                    <IconBtn title="Move down" disabled={i === attrs.length - 1} onClick={() => move(i, 1)}>
                      <ArrowIcon dir="down" />
                    </IconBtn>
                    <IconBtn
                      title="Primary key"
                      active={a.primaryKey}
                      onClick={() =>
                        setAttrs((list) => list.map((x, xi) => (xi === i ? { ...x, primaryKey: !x.primaryKey } : x)))
                      }
                    >
                      <KeyIcon />
                    </IconBtn>
                    <IconBtn
                      title="Required"
                      active={a.required}
                      onClick={() => setAttrs((list) => list.map((x, xi) => (xi === i ? { ...x, required: !x.required } : x)))}
                    >
                      <CircleIcon filled={a.required} />
                    </IconBtn>
                    <IconBtn
                      title="Reference another entity"
                      active={a.kind === "ref"}
                      onClick={() =>
                        setAttrs((list) =>
                          list.map((x, xi) =>
                            xi === i ? { ...x, kind: x.kind === "ref" ? "type" : "ref", refEntityId: x.refEntityId || entities[0]?.id || "" } : x
                          )
                        )
                      }
                    >
                      <LinkIcon />
                    </IconBtn>

                    <div className="relative shrink-0">
                      <IconBtn title="More" onClick={() => setMenuOpenKey((k) => (k === a.key ? null : a.key))}>
                        <DotsIcon />
                      </IconBtn>
                      {menuOpenKey === a.key && (
                        <div
                          className="absolute right-0 top-full mt-1 rounded-lg border text-[12.5px] overflow-hidden z-10 w-32"
                          style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-pill)" }}
                        >
                          <button
                            className="block w-full text-left px-3 py-2 hover:opacity-80"
                            style={{ color: "var(--text-primary)" }}
                            onClick={() => {
                              setAttrs((list) => {
                                const idx = list.findIndex((x) => x.key === a.key);
                                const copy = { ...list[idx], key: Math.random().toString(36).slice(2) };
                                const next = [...list];
                                next.splice(idx + 1, 0, copy);
                                return next;
                              });
                              setMenuOpenKey(null);
                            }}
                          >
                            Duplicate
                          </button>
                          <button
                            className="block w-full text-left px-3 py-2 hover:opacity-80 border-t"
                            style={{ color: "#e0475a", borderColor: "var(--border)" }}
                            onClick={() => {
                              setAttrs((list) => (list.length > 1 ? list.filter((x) => x.key !== a.key) : list));
                              setMenuOpenKey(null);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="mt-2 text-[12.5px] font-medium"
                style={{ color: "var(--accent-blue-fg)" }}
                onClick={() => setAttrs((a) => [...a, mkAttr()])}
              >
                + Add Business Term
              </button>
            </div>
          ) : (
            <div>
              <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Values
              </label>
              <div className="space-y-1.5">
                {values.map((v, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      value={v}
                      onChange={(e) => setValues((list) => list.map((x, xi) => (xi === i ? e.target.value : x)))}
                      placeholder="e.g. Mr"
                      className="flex-1 rounded-lg border px-2.5 py-1.5 text-[13px] outline-none"
                      style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                    />
                    <IconBtn title="Remove" onClick={() => setValues((list) => (list.length > 1 ? list.filter((_, xi) => xi !== i) : list))}>
                      ×
                    </IconBtn>
                  </div>
                ))}
              </div>
              <button
                className="mt-2 text-[12.5px] font-medium"
                style={{ color: "var(--accent-blue-fg)" }}
                onClick={() => setValues((v) => [...v, ""])}
              >
                + Add value
              </button>
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
            <button
              className="w-full rounded-lg border py-2 text-[13px] font-medium"
              style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              ⇪ Import file
            </button>
            {importNotice && (
              <p className="text-[11.5px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                {importNotice}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 mt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ color: "var(--text-secondary)" }} onClick={close}>
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40"
            style={{ background: "var(--accent-blue)" }}
            disabled={!name.trim()}
            onClick={submit}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 disabled:opacity-30 text-[13px]"
      style={{
        background: active ? "var(--accent-blue)" : "transparent",
        color: active ? "#fff" : "var(--text-tertiary)",
      }}
    >
      {children}
    </button>
  );
}

function ArrowIcon({ dir }: { dir: "up" | "down" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: dir === "down" ? "rotate(180deg)" : undefined }}>
      <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="4" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.6 6.4L10 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 2.5L9.5 4M6.7 3.8L8.2 5.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CircleIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M5 7L7 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.3 8.3L2.8 9.8a1.7 1.7 0 01-2.4-2.4L2 5.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7.7 3.7L9.2 2.2a1.7 1.7 0 012.4 2.4L10 6.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="2" cy="6" r="1" />
      <circle cx="6" cy="6" r="1" />
      <circle cx="10" cy="6" r="1" />
    </svg>
  );
}
