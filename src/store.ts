import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Attribute,
  ChatMessage,
  EntityKind,
  EntityNode,
  LeftPanelMode,
  SchemaFile,
  Theme,
  ViewMode,
} from "./types";
import { SEED_ENTITIES } from "./data/seed";
import { MOCK_SCHEMAS } from "./data/mockSchemas";
import { colorForIndex } from "./lib/colors";
import { CARD_WIDTH } from "./lib/layout";
import { entityHeight } from "./lib/connections";
import type { ImportPreview } from "./lib/import";

const nid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/** Bump this whenever seed.ts changes in a way that should override a browser's persisted state. */
const STORE_VERSION = 5;

function partializeStore(s: AppState) {
  return {
    schemas: s.schemas,
    activeSchemaId: s.activeSchemaId,
    entities: s.entities,
    theme: s.theme,
    fileName: s.fileName,
    recentSearches: s.recentSearches,
  };
}

function buildAssistantReply(userText: string, entities: EntityNode[], isRegeneration = false): ChatMessage {
  const lower = userText.toLowerCase();
  if (/entit|schema|map|structure/.test(lower)) {
    const rows = entities.slice(0, 5).map((e) => [e.name, e.attributes.find((a) => a.primaryKey)?.name ?? "—", e.attributes.slice(0, 3).map((a) => a.name).join(", ")]);
    return {
      id: nid("msg"),
      role: "assistant",
      text: isRegeneration
        ? "Here's another pass at the current structure:"
        : "Here's a quick breakdown of the structure so far:",
      table: { headers: ["Entity", "Primary Key", "Key Attributes"], rows },
      ts: Date.now(),
    };
  }
  const variants = [
    "Got it — I can't make live changes yet in this preview, but that request has been noted. Try the Add Entity or Auto Layout tools on the canvas toolbar in the meantime.",
    "Noted. This preview build doesn't wire AI edits back into the schema yet — the canvas toolbar (Add Entity, Search, Auto Layout) covers that for now.",
  ];
  return {
    id: nid("msg"),
    role: "assistant",
    text: isRegeneration ? variants[1] : variants[0],
    ts: Date.now(),
  };
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

interface PendingConnection {
  fromEntityId: string;
  fromAttrId: string;
  toX: number;
  toY: number;
}

const ORIGINATIONS_SCHEMA_ID = nid("sch");

interface AppState {
  // multi-schema registry (dashboard) + which one is live in the editor
  schemas: SchemaFile[];
  activeSchemaId: string;

  entities: EntityNode[];
  theme: Theme;
  fileName: string;
  viewMode: ViewMode;
  leftPanelOpen: boolean;
  leftPanelMode: LeftPanelMode;
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  camera: Camera;
  chat: ChatMessage[];
  recentSearches: string[];
  searchOpen: boolean;
  addEntityOpen: boolean;
  shareOpen: boolean;
  onboardingOpen: boolean;
  detailEntityId: string | null;
  termDrawer: { entityId: string; attrId?: string } | null;
  importPreview: ImportPreview | null;
  pending: PendingConnection | null;

  toggleTheme: () => void;
  setFileName: (name: string) => void;
  setViewMode: (v: ViewMode) => void;
  toggleLeftPanel: (mode?: LeftPanelMode) => void;
  closeLeftPanel: () => void;
  selectEntity: (id: string | null) => void;
  focusEntity: (id: string) => void;
  hoverEntity: (id: string | null) => void;
  moveEntity: (id: string, x: number, y: number) => void;
  toggleCollapse: (id: string) => void;
  setCamera: (c: Partial<Camera>) => void;
  zoomBy: (delta: number, pivot?: { x: number; y: number }) => void;
  zoomTo: (scale: number) => void;
  resetCamera: () => void;
  addEntity: (name: string, kind: EntityKind, attributes: Omit<Attribute, "id">[], values?: string[]) => string;
  deleteEntity: (id: string) => void;
  addAttribute: (entityId: string, attribute: Omit<Attribute, "id">) => void;
  removeAttribute: (entityId: string, attrId: string) => void;
  updateAttribute: (entityId: string, attrId: string, patch: Partial<Attribute>) => void;
  reorderAttribute: (entityId: string, attrId: string, dir: -1 | 1) => void;
  duplicateAttribute: (entityId: string, attrId: string) => void;
  updateEntityMeta: (entityId: string, patch: Partial<EntityNode>) => void;
  connectAttribute: (entityId: string, attrId: string, targetEntityId: string) => void;
  disconnectAttribute: (entityId: string, attrId: string) => void;
  autoLayout: () => void;
  sendChat: (text: string) => void;
  regenerateLast: () => void;
  setSearchOpen: (v: boolean) => void;
  addRecentSearch: (q: string) => void;
  setAddEntityOpen: (v: boolean) => void;
  setShareOpen: (v: boolean) => void;
  setOnboardingOpen: (v: boolean) => void;
  openDetailEntity: (id: string | null) => void;
  openTermDrawer: (entityId: string, attrId?: string) => void;
  closeTermDrawer: () => void;
  setImportPreview: (p: ImportPreview | null) => void;
  commitImport: (entityId: string, accepted: { name: string; dataType: Attribute["dataType"]; required: boolean; multiple: boolean }[]) => void;
  startPending: (fromEntityId: string, fromAttrId: string, toX: number, toY: number) => void;
  updatePending: (toX: number, toY: number) => void;
  endPending: () => void;

  // multi-schema
  saveActiveSchema: () => void;
  openSchema: (id: string) => void;
  createSchema: (name: string, entities?: EntityNode[]) => string;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      schemas: [
        { id: ORIGINATIONS_SCHEMA_ID, name: "Originations Term Sets", version: "v1.30.1", status: "draft", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), entities: SEED_ENTITIES },
        ...MOCK_SCHEMAS.map((s) => ({ ...s, entities: s.entities ?? [] })),
      ],
      activeSchemaId: ORIGINATIONS_SCHEMA_ID,

      entities: SEED_ENTITIES,
      theme: "light",
      fileName: "Originations Term Sets",
      viewMode: "canvas",
      leftPanelOpen: true,
      leftPanelMode: "file",
      selectedEntityId: SEED_ENTITIES[0]?.id ?? null,
      hoveredEntityId: null,
      camera: { x: 0, y: 0, scale: 1 },
      chat: [
        {
          id: nid("msg"),
          role: "assistant",
          text: "Hi! I can help you tidy up this schema — try asking me to connect two entities, rename a field, or find something that looks broken.",
          ts: Date.now(),
        },
      ],
      recentSearches: [],
      searchOpen: false,
      addEntityOpen: false,
      shareOpen: false,
      onboardingOpen: false,
      detailEntityId: null,
      termDrawer: null,
      importPreview: null,
      pending: null,

      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setFileName: (name) => set({ fileName: name || "Untitled Term Set" }),
      setViewMode: (v) => set({ viewMode: v }),
      toggleLeftPanel: (mode) =>
        set((s) => {
          if (mode && mode !== s.leftPanelMode) return { leftPanelOpen: true, leftPanelMode: mode };
          return { leftPanelOpen: !s.leftPanelOpen, leftPanelMode: mode ?? s.leftPanelMode };
        }),
      closeLeftPanel: () => set({ leftPanelOpen: false }),
      selectEntity: (id) => set({ selectedEntityId: id }),
      focusEntity: (id) =>
        set((s) => {
          const e = s.entities.find((en) => en.id === id);
          if (!e) return { selectedEntityId: id };
          const viewW = typeof window !== "undefined" ? window.innerWidth : 1280;
          const viewH = typeof window !== "undefined" ? window.innerHeight : 800;
          // LeftSection's icon rail (64px) + entity list (320px) when open at desktop widths.
          const leftOffset = s.leftPanelOpen && viewW >= 640 ? 384 : 0;
          const centerX = leftOffset + (viewW - leftOffset) / 2;
          const centerY = viewH / 2;
          const scale = s.camera.scale;
          return {
            selectedEntityId: id,
            camera: {
              ...s.camera,
              x: centerX - (e.x + CARD_WIDTH / 2) * scale,
              y: centerY - (e.y + entityHeight(e) / 2) * scale,
            },
          };
        }),
      hoverEntity: (id) => set({ hoveredEntityId: id }),
      moveEntity: (id, x, y) =>
        set((s) => ({ entities: s.entities.map((e) => (e.id === id ? { ...e, x, y } : e)) })),
      toggleCollapse: (id) =>
        set((s) => ({ entities: s.entities.map((e) => (e.id === id ? { ...e, collapsed: !e.collapsed } : e)) })),
      setCamera: (c) => set((s) => ({ camera: { ...s.camera, ...c } })),
      zoomBy: (delta, pivot) =>
        set((s) => {
          const next = Math.min(2.5, Math.max(0.1, s.camera.scale + delta));
          if (!pivot) return { camera: { ...s.camera, scale: next } };
          const ratio = next / s.camera.scale;
          const x = pivot.x - (pivot.x - s.camera.x) * ratio;
          const y = pivot.y - (pivot.y - s.camera.y) * ratio;
          return { camera: { x, y, scale: next } };
        }),
      zoomTo: (scale) => set((s) => ({ camera: { ...s.camera, scale: Math.min(2.5, Math.max(0.1, scale)) } })),
      resetCamera: () => set({ camera: { x: 0, y: 0, scale: 1 } }),

      addEntity: (name, kind, attributes, values) => {
        const id = nid("ent");
        const s0 = get();
        const idx = s0.entities.length;
        const color = colorForIndex(idx).id;
        const centerX = -s0.camera.x / s0.camera.scale + 260;
        const centerY = -s0.camera.y / s0.camera.scale + 200;
        const rows = attributes.length;
        const h = 52 + rows * 36;

        const overlaps = (x: number, y: number) =>
          s0.entities.some((e) => {
            const eh = entityHeight(e);
            return x < e.x + CARD_WIDTH + 40 && x + CARD_WIDTH + 40 > e.x && y < e.y + eh + 40 && y + h + 40 > e.y;
          });

        let x = centerX;
        let y = centerY;
        for (let attempt = 0; attempt < 24 && overlaps(x, y); attempt++) {
          const angle = attempt * 2.4;
          const radius = 60 + attempt * 34;
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
        }

        const node: EntityNode = {
          id,
          name,
          kind,
          color,
          status: "draft",
          version: "v1.0.0",
          x,
          y,
          collapsed: false,
          attributes: attributes.map((a) => ({ ...a, id: nid("attr") })),
          values: kind === "valueList" ? values ?? [] : undefined,
        };
        set((s) => ({ entities: [...s.entities, node], selectedEntityId: id }));
        return id;
      },
      deleteEntity: (id) =>
        set((s) => ({
          entities: s.entities
            .filter((e) => e.id !== id)
            .map((e) => ({
              ...e,
              attributes: e.attributes.map((a) => (a.refEntityId === id ? { ...a, refEntityId: null } : a)),
            })),
          selectedEntityId: s.selectedEntityId === id ? null : s.selectedEntityId,
          detailEntityId: s.detailEntityId === id ? null : s.detailEntityId,
        })),
      addAttribute: (entityId, attribute) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId ? { ...e, attributes: [...e.attributes, { ...attribute, id: nid("attr") }] } : e
          ),
        })),
      removeAttribute: (entityId, attrId) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId ? { ...e, attributes: e.attributes.filter((a) => a.id !== attrId) } : e
          ),
        })),
      updateAttribute: (entityId, attrId, patch) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId
              ? { ...e, attributes: e.attributes.map((a) => (a.id === attrId ? { ...a, ...patch } : a)) }
              : e
          ),
        })),
      reorderAttribute: (entityId, attrId, dir) =>
        set((s) => ({
          entities: s.entities.map((e) => {
            if (e.id !== entityId) return e;
            const i = e.attributes.findIndex((a) => a.id === attrId);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= e.attributes.length) return e;
            const next = [...e.attributes];
            [next[i], next[j]] = [next[j], next[i]];
            return { ...e, attributes: next };
          }),
        })),
      duplicateAttribute: (entityId, attrId) =>
        set((s) => ({
          entities: s.entities.map((e) => {
            if (e.id !== entityId) return e;
            const i = e.attributes.findIndex((a) => a.id === attrId);
            if (i < 0) return e;
            const copy: Attribute = { ...e.attributes[i], id: nid("attr"), name: `${e.attributes[i].name} copy` };
            const next = [...e.attributes];
            next.splice(i + 1, 0, copy);
            return { ...e, attributes: next };
          }),
        })),
      updateEntityMeta: (entityId, patch) =>
        set((s) => ({
          entities: s.entities.map((e) => (e.id === entityId ? { ...e, ...patch, updatedAt: Date.now() } : e)),
        })),
      connectAttribute: (entityId, attrId, targetEntityId) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId
              ? {
                  ...e,
                  attributes: e.attributes.map((a) =>
                    a.id === attrId ? { ...a, refEntityId: targetEntityId, dataType: null } : a
                  ),
                }
              : e
          ),
        })),
      disconnectAttribute: (entityId, attrId) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId
              ? {
                  ...e,
                  attributes: e.attributes.map((a) =>
                    a.id === attrId ? { ...a, refEntityId: null, dataType: "string" } : a
                  ),
                }
              : e
          ),
        })),
      autoLayout: () =>
        set((s) => {
          const cols = Math.ceil(Math.sqrt(s.entities.length));
          const gapX = 420;
          const gapY = 320;
          const entities = s.entities.map((e, i) => ({
            ...e,
            x: (i % cols) * gapX,
            y: Math.floor(i / cols) * gapY,
          }));
          return { entities, camera: { x: 0, y: 0, scale: 0.8 } };
        }),
      sendChat: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const userMsg: ChatMessage = { id: nid("msg"), role: "user", text: trimmed, ts: Date.now() };
        set((s) => ({ chat: [...s.chat, userMsg] }));
        window.setTimeout(() => {
          set((s) => ({ chat: [...s.chat, buildAssistantReply(trimmed, s.entities)] }));
        }, 500);
      },
      regenerateLast: () => {
        const lastUser = [...get().chat].reverse().find((m) => m.role === "user");
        window.setTimeout(() => {
          set((s) => ({ chat: [...s.chat, buildAssistantReply(lastUser?.text ?? "", s.entities, true)] }));
        }, 350);
      },
      setSearchOpen: (v) => set({ searchOpen: v }),
      addRecentSearch: (q) =>
        set((s) => ({
          recentSearches: [q, ...s.recentSearches.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 6),
        })),
      setAddEntityOpen: (v) => set({ addEntityOpen: v }),
      setShareOpen: (v) => set({ shareOpen: v }),
      setOnboardingOpen: (v) => set({ onboardingOpen: v }),
      openDetailEntity: (id) => set({ detailEntityId: id }),
      openTermDrawer: (entityId, attrId) => set({ termDrawer: { entityId, attrId } }),
      closeTermDrawer: () => set({ termDrawer: null }),
      setImportPreview: (p) => set({ importPreview: p }),
      commitImport: (entityId, accepted) =>
        set((s) => ({
          entities: s.entities.map((e) => {
            if (e.id !== entityId) return e;
            let attrs = [...e.attributes];
            accepted.forEach((row) => {
              const i = attrs.findIndex((a) => a.name.toLowerCase() === row.name.toLowerCase());
              if (i >= 0) {
                attrs[i] = { ...attrs[i], dataType: row.dataType, required: row.required, multiple: row.multiple, refEntityId: null };
              } else {
                attrs = [...attrs, { id: nid("attr"), name: row.name, dataType: row.dataType, refEntityId: null, required: row.required, multiple: row.multiple }];
              }
            });
            return { ...e, attributes: attrs };
          }),
          importPreview: null,
        })),
      startPending: (fromEntityId, fromAttrId, toX, toY) =>
        set({ pending: { fromEntityId, fromAttrId, toX, toY } }),
      updatePending: (toX, toY) =>
        set((s) => (s.pending ? { pending: { ...s.pending, toX, toY } } : {})),
      endPending: () => set({ pending: null }),

      saveActiveSchema: () =>
        set((s) => ({
          schemas: s.schemas.map((sc) =>
            sc.id === s.activeSchemaId
              ? { ...sc, name: s.fileName, entities: s.entities, updatedAt: new Date().toISOString() }
              : sc
          ),
        })),
      openSchema: (id) => {
        get().saveActiveSchema();
        const target = get().schemas.find((s) => s.id === id);
        if (!target) return;
        set({
          activeSchemaId: id,
          fileName: target.name,
          entities: target.entities,
          selectedEntityId: target.entities[0]?.id ?? null,
          detailEntityId: null,
          termDrawer: null,
          viewMode: "canvas",
          camera: { x: 0, y: 0, scale: 1 },
        });
      },
      createSchema: (name, entities = []) => {
        get().saveActiveSchema();
        const id = nid("sch");
        const schema: SchemaFile = {
          id,
          name,
          version: "v1.0.0",
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          entities,
        };
        set((s) => ({ schemas: [schema, ...s.schemas] }));
        get().openSchema(id);
        return id;
      },
    }),
    {
      name: "erd-mock-store",
      version: STORE_VERSION,
      // seed.ts is a moving target during development — when STORE_VERSION is bumped, discard
      // whatever's in localStorage instead of merging it, so seed changes always show up on reload.
      migrate: (persisted, version) =>
        (version === STORE_VERSION ? persisted : undefined) as ReturnType<typeof partializeStore>,
      partialize: partializeStore,
    }
  )
);
