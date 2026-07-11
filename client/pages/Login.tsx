import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Landmark, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") navigate("/", { replace: true });
  }, [status, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-line bg-surface rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
            <Landmark className="text-primary" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-ink">Finanças</h1>
            <p className="text-xs text-ink-muted">Entre na sua conta</p>
          </div>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-soft/40 px-3 py-2 text-xs text-ink-muted">
          <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
          <span>
            Sua conta e lançamentos ficam salvos neste navegador. Ao entrar de novo, tudo
            continua como você deixou.
          </span>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2.5 bg-bg text-ink focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block">Senha</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2.5 bg-bg text-ink focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>

          {error && (
            <p className="text-sm text-expense bg-expense/10 border border-expense/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-sm text-ink-muted mt-6 text-center">
          Não tem conta?{" "}
          <Link to="/register" className="text-link hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
