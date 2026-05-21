import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios.js";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", adminKey: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password
      });
      if (response.data.user.role !== "admin") {
        setError("Not an admin account.");
        setLoading(false);
        return;
      }
      localStorage.setItem("admin_fittrack_token", response.data.token);
      localStorage.setItem("admin_key", form.adminKey);
      localStorage.setItem("admin_email", response.data.user.email);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "16px",
          padding: "28px"
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: 600 }}>FitTrack Admin</h1>
        <p style={{ marginTop: "8px", color: "#9ca3af", fontSize: "13px" }}>
          Sign in with your admin account.
        </p>

        <div style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            style={{
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid #1f2937",
              background: "#0f172a",
              color: "#e5e7eb"
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            style={{
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid #1f2937",
              background: "#0f172a",
              color: "#e5e7eb"
            }}
          />
          <input
            type="password"
            placeholder="Admin Key"
            value={form.adminKey}
            onChange={(event) => setForm((prev) => ({ ...prev, adminKey: event.target.value }))}
            style={{
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid #1f2937",
              background: "#0f172a",
              color: "#e5e7eb"
            }}
          />
        </div>

        {error && (
          <p style={{ marginTop: "12px", color: "#f87171", fontSize: "13px" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "18px",
            width: "100%",
            borderRadius: "999px",
            border: "none",
            padding: "10px",
            backgroundColor: "#6366f1",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
