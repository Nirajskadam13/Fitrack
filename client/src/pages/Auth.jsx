import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/axios.js";
import { useAuth } from "../hooks/useAuth.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (auth.user) {
      navigate("/dashboard");
    }
  }, [auth.user, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!loginForm.email || !loginForm.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", loginForm);
      auth.login(response.data.token, response.data.user);
      navigate(response.data.user.onboarding_done ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!emailRegex.test(registerForm.email)) {
      setError("Enter a valid email.");
      return;
    }

    if (registerForm.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/register", {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password
      });
      auth.login(response.data.token, response.data.user);
      navigate("/onboarding");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`text-sm font-semibold ${
              mode === "login" ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`text-sm font-semibold ${
              mode === "register"
                ? "text-[var(--accent)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Register
          </button>
        </div>

        {mode === "login" ? (
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Email
              </label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Full Name
              </label>
              <input
                type="text"
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Email
              </label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Password
              </label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Confirm Password
              </label>
              <input
                type="password"
                value={registerForm.confirmPassword}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          Admin?{" "}
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--accent)]"
          >
            Open Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}
