import { useStore } from "../store";
import EntityRecordCard from "./EntityRecordCard";

export default function EntityDetailView() {
  const detailEntityId = useStore((s) => s.detailEntityId);
  const openDetailEntity = useStore((s) => s.openDetailEntity);
  const entities = useStore((s) => s.entities);
  const leftPanelOpen = useStore((s) => s.leftPanelOpen);

  const entity = entities.find((e) => e.id === detailEntityId);
  if (!entity) return null;

  return (
    <div
      className={`absolute inset-0 pt-20 pb-6 px-4 sm:px-8 overflow-y-auto transition-[padding] ${leftPanelOpen ? "sm:pl-[404px]" : ""}`}
      style={{ background: "var(--bg-canvas)" }}
    >
      <div className="max-w-[1000px] mx-auto">
        <button
          className="text-[12.5px] font-medium mb-4 flex items-center gap-1"
          style={{ color: "var(--text-secondary)" }}
          onClick={() => openDetailEntity(null)}
        >
          ← Back to canvas
        </button>

        <EntityRecordCard entity={entity} />
      </div>
    </div>
  );
}
