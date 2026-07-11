import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  authLogin,
  authLogout,
  authRegister,
  authSession,
  ApiError,
} from "../lib/localApi";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const refresh = useCallback(async () => {
    try {
      const data = await authSession();
      if (data?.user?.id) {
        setUser(data.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await authLogin(email, password);
      setUser(data.user);
      setStatus("authenticated");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Falha no login";
      throw new Error(msg);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const data = await authRegister(name, email, password);
        setUser(data.user);
        setStatus("authenticated");
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Falha no registro";
        throw new Error(msg);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ user, status, refresh, login, register, logout }),
    [user, status, refresh, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
