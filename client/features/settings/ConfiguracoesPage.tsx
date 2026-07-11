import { useEffect, useState } from "react";
import { Download, Save, User } from "lucide-react";
import { api } from "../../services/api";
import type { Settings } from "../../types";
import { PageHeader } from "../../components/ui/PageHeader";
import { useToast } from "../../lib/toast";

const inputClass =
  "w-full border border-line rounded-lg px-3 py-2 bg-bg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

const SECTIONS = [
  "Perfil",
  "Preferências",
  "Backup",
  "Contas & padrões",
  "Notificações",
  "Sobre",
] as const;

export function Configuracoes() {
  const { show } = useToast();
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("Perfil");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch((e) => show(e.message ?? "Erro ao carregar", "error"));
  }, [show]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await api.updateSettings({
        profileName: settings.profileName,
        profilePhoto: settings.profilePhoto,
        theme: settings.theme,
        language: settings.language,
        currency: settings.currency,
        monthStartDay: settings.monthStartDay,
        notificationsEnabled: settings.notificationsEnabled,
      });
      setSettings(updated);
      show("Configurações salvas.");
    } catch (err: any) {
      show(err.message ?? "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  }

  async function exportBackup() {
    try {
      const data = await api.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financas-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      show("Backup exportado.");
    } catch (err: any) {
      show(err.message ?? "Erro no backup", "error");
    }
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-ink-muted text-sm">Carregando…</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        title="Configurações"
        description="Perfil, preferências e backup — preparado para autenticação futura"
        actions={
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-lg text-sm disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Salvando…" : "Salvar"}
          </button>
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-48 shrink-0 flex md:flex-col gap-1 overflow-x-auto">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`text-left text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                section === s
                  ? "bg-surface-active text-ink"
                  : "text-ink-muted hover:bg-surface-hover"
              }`}
            >
              {s}
            </button>
          ))}
        </aside>

        <div className="flex-1 bg-surface border border-line rounded-xl p-5 space-y-4">
          {section === "Perfil" && (
            <>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center">
                  <User className="text-primary" size={24} />
                </div>
                <div>
                  <p className="font-medium">{settings.profileName}</p>
                  <p className="text-xs text-ink-muted">Usuário local (auth em fase futura)</p>
                </div>
              </div>
              <Field label="Nome">
                <input
                  className={inputClass}
                  value={settings.profileName}
                  onChange={(e) => setSettings({ ...settings, profileName: e.target.value })}
                />
              </Field>
              <Field label="URL da foto (opcional)">
                <input
                  className={inputClass}
                  value={settings.profilePhoto ?? ""}
                  onChange={(e) =>
                    setSettings({ ...settings, profilePhoto: e.target.value || null })
                  }
                  placeholder="https://…"
                />
              </Field>
            </>
          )}

          {section === "Preferências" && (
            <>
              <Field label="Tema">
                <select
                  className={inputClass}
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                >
                  <option value="dark">Escuro</option>
                  <option value="light">Claro (em breve)</option>
                  <option value="system">Sistema</option>
                </select>
              </Field>
              <Field label="Idioma">
                <select
                  className={inputClass}
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English</option>
                </select>
              </Field>
              <Field label="Moeda">
                <select
                  className={inputClass}
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                >
                  <option value="BRL">BRL — Real</option>
                  <option value="USD">USD — Dólar</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </Field>
              <Field label="Primeiro dia do mês financeiro">
                <input
                  type="number"
                  min={1}
                  max={28}
                  className={inputClass}
                  value={settings.monthStartDay}
                  onChange={(e) =>
                    setSettings({ ...settings, monthStartDay: Number(e.target.value) })
                  }
                />
              </Field>
            </>
          )}

          {section === "Backup" && (
            <>
              <p className="text-sm text-ink-muted">
                Exporte um snapshot completo em JSON (contas, lançamentos, metas, investimentos).
                Importação estruturada chega em seguida — o endpoint de export já padroniza o
                formato <code className="text-xs bg-bg px-1 rounded">financas-backup-json</code>.
              </p>
              <button
                onClick={exportBackup}
                className="flex items-center gap-2 border border-line hover:bg-surface-hover px-4 py-2.5 rounded-lg text-sm"
              >
                <Download size={15} /> Exportar backup JSON
              </button>
            </>
          )}

          {section === "Contas & padrões" && (
            <p className="text-sm text-ink-muted leading-relaxed">
              Gerencie contas em <strong className="text-ink">Contas</strong>, categorias padrão na
              tela de Categorias (botão “Criar categorias padrão”) e formas de pagamento em Formas
              de Pagamento. Esta seção centraliza o atalho conceitual para o futuro wizard de
              onboarding.
            </p>
          )}

          {section === "Notificações" && (
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, notificationsEnabled: e.target.checked })
                }
                className="rounded border-line"
              />
              Ativar preferência de notificações (entrega push em fase futura)
            </label>
          )}

          {section === "Sobre" && (
            <div className="text-sm text-ink-muted space-y-2">
              <p>
                <strong className="text-ink">Finanças Pessoais</strong> — v4.0
              </p>
              <p>Stack: React · Vite · localStorage · TypeScript</p>
              <p>
                Plug-and-play: dados no navegador, sem banco externo. Funciona na Vercel sem
                configuração.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block text-ink-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
