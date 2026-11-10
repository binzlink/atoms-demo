import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/Home";
import { StudioPage } from "./pages/Studio";

export function App() {
  return (
    <div className="min-h-dvh bg-white font-sans text-black antialiased">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/studio/:id" element={<StudioPage />} />
      </Routes>
    </div>
  );
}
