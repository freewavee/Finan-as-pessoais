import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url?.trim() && anonKey?.trim());
}

export function getSupabaseConfigError(): string | null {
  if (!url?.trim() || !anonKey?.trim()) {
    return (
      "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY " +
      "no arquivo .env (local) e nas Environment Variables da Vercel."
    );
  }
  return null;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const err = getSupabaseConfigError();
  if (err) throw new Error(err);
  if (!client) {
    client = createClient(url!.trim(), anonKey!.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
  }
  return client;
}
