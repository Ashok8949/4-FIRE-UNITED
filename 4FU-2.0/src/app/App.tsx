import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "../components/layout/Shell";
import { Home } from "../pages/Home";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
