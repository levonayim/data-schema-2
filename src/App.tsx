import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useStore } from "./store";
import Dashboard from "./components/Dashboard";
import SchemaEditor from "./SchemaEditor";
import OnboardingModal from "./components/OnboardingModal";

function App() {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor" element={<SchemaEditor />} />
      </Routes>
      <OnboardingModal />
      <Analytics />
      <SpeedInsights />
    </HashRouter>
  );
}

export default App;
