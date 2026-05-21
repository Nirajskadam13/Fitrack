import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const hasToken = () => Boolean(localStorage.getItem("admin_fittrack_token"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={hasToken() ? <Navigate to="/dashboard" replace /> : <AdminLogin />}
        />
        <Route
          path="/dashboard"
          element={hasToken() ? <AdminDashboard /> : <Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
