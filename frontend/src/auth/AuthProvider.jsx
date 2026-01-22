import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { AuthContext } from "./AuthContext";

export default function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState(null);
  
  async function refresh() {
    try {
      const me = await api("/api/auth/me");
      setIsAuthed(true);
      setUser(me);
    } catch (err) {
      if (err?.status && err.status !== 401) console.warn("Auth refresh failed:", err);
      setIsAuthed(false);
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }

  async function login(email, password) {
    await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await refresh();
  }

  async function register(email, password) {
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await refresh();
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setIsAuthed(false);
    setUser(null);
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      isAuthed,
      user,
      firstName: user?.first_name || null,
      refresh,
      login,
      register,
      logout,
    }),
    [isReady, isAuthed, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
