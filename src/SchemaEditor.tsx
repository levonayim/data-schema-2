import { useEffect } from "react";
import { useStore } from "./store";
import Canvas from "./components/Canvas";
import TableView from "./components/TableView";
import LeftSection from "./components/LeftSection";
import CenterToolbar from "./components/CenterToolbar";
import RightToolbar from "./components/RightToolbar";
import AddEntityModal from "./components/AddEntityModal";
import SearchModal from "./components/SearchModal";
import EntityDetailView from "./components/EntityDetailView";
import TermDetailsDrawer from "./components/TermDetailsDrawer";
import ImportPreviewModal from "./components/ImportPreviewModal";

function SchemaEditor() {
  const viewMode = useStore((s) => s.viewMode);
  const leftPanelOpen = useStore((s) => s.leftPanelOpen);
  const closeLeftPanel = useStore((s) => s.closeLeftPanel);
  const detailEntityId = useStore((s) => s.detailEntityId);
  const saveActiveSchema = useStore((s) => s.saveActiveSchema);

  useEffect(() => {
    return () => {
      saveActiveSchema();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {detailEntityId ? (
        <EntityDetailView />
      ) : viewMode === "canvas" ? (
        <Canvas />
      ) : (
        <TableView />
      )}

      {!detailEntityId && viewMode === "canvas" && <CenterToolbar />}
      <RightToolbar />
      <LeftSection />
      <TermDetailsDrawer />

      {leftPanelOpen && (
        <div className="fixed inset-0 z-20 sm:hidden" style={{ background: "rgba(10,10,14,0.35)" }} onClick={closeLeftPanel} />
      )}

      <AddEntityModal />
      <SearchModal />
      <ImportPreviewModal />
    </div>
  );
}

export default SchemaEditor;
