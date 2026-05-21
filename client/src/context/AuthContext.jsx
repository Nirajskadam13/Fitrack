import { createContext, useEffect, useState } from "react";
import api from "../lib/axios.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("fittrack_token") || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("fittrack_token");
    if (!storedToken) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((response) => {
        setUser(response.data.user);
      })
      .catch((error) => {
        if (error?.response?.status === 401) {
          localStorage.removeItem("fittrack_token");
          setToken(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem("fittrack_token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("fittrack_token");
    setToken(null);
    setUser(null);
    window.location.href = "/auth";
  };

  const updateProfile = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
