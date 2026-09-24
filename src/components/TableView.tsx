import { useStore } from "../store";
import EntityRecordCard from "./EntityRecordCard";

export default function TableView() {
  const entities = useStore((s) => s.entities);
  const selectedEntityId = useStore((s) => s.selectedEntityId);
  const leftPanelOpen = useStore((s) => s.leftPanelOpen);

  const entity = entities.find((e) => e.id === selectedEntityId) ?? entities[0];

  return (
    <div
      className={`absolute inset-0 pt-20 pb-6 px-4 sm:px-8 overflow-y-auto transition-[padding] ${leftPanelOpen ? "sm:pl-[404px]" : ""}`}
      style={{ background: "var(--bg-canvas)" }}
    >
      <div className="max-w-[1000px] mx-auto">
        {entity ? (
          <EntityRecordCard entity={entity} />
        ) : (
          <div className="text-center py-24 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            No business term sets yet.
          </div>
        )}
      </div>
    </div>
  );
}
