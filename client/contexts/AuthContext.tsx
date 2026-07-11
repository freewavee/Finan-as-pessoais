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
} from "../lib/supabaseApi";
import { getSupabase, getSupabaseConfigError, isSupabaseConfigured } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  configError: string | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [configError, setConfigError] = useState<string | null>(getSupabaseConfigError());

  const refresh = useCallback(async () => {
    const cfg = getSupabaseConfigError();
    setConfigError(cfg);
    if (cfg) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }
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
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabase();
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name: (session.user.user_metadata?.name as string) ?? null,
          image: (session.user.user_metadata?.avatar_url as string) ?? null,
        });
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await authLogin(email, password);
      setUser(data.user);
      setStatus("authenticated");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Falha no login";
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
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Falha no registro";
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
    () => ({ user, status, configError, refresh, login, register, logout }),
    [user, status, configError, refresh, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
