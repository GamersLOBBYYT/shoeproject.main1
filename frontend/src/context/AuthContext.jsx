import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // null = checking, false = guest, object = authenticated
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      setUser(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (!cancelled) setUser(data);
      } catch {
        // 401 simply means the visitor is not logged in — expected for guests
        if (!cancelled) setUser(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  }, []);

  const processGoogleSession = useCallback(async (sessionId) => {
    const { data } = await api.post("/auth/google/session", { session_id: sessionId });
    setUser(data);
    return data;
  }, []);

  const googleLogin = useCallback(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout request failed (clearing local session anyway):", e);
    }
    setUser(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, googleLogin, processGoogleSession }),
    [user, loading, login, register, logout, googleLogin, processGoogleSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
