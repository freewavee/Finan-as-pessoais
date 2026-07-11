import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Landmark, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../lib/navigation";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className = "", onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className={`bg-sidebar border-line flex flex-col ${className}`}>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
          <Landmark className="text-primary" size={18} />
        </div>
        <div className="min-w-0">
          <span className="font-display font-bold text-base text-ink block leading-tight">
            Finanças
          </span>
          <span className="text-[10px] text-ink-muted truncate block">
            {user?.email ?? "Premium"}
          </span>
        </div>
      </div>

      <ul className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {ROUTES.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path} className="relative">
              <NavLink
                to={item.path}
                end={item.path === "/"}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-surface-active text-ink"
                      : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <Icon size={17} className={isActive ? "text-primary" : ""} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="px-3 py-3 border-t border-line space-y-2">
        <button
          type="button"
          onClick={() => logout().then(() => (window.location.href = "/login"))}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-surface-hover hover:text-ink"
        >
          <LogOut size={16} />
          Sair
        </button>
        <p className="px-2 text-[11px] text-ink-muted/70 font-mono">⌘K busca · multi-user</p>
      </div>
    </nav>
  );
}
