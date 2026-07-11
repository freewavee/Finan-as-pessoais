import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCommand } from "../contexts/CommandContext";
import { useDensity } from "../contexts/DensityContext";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Atalhos globais estilo Linear.
 * G + letra: navegação sequencial com timeout.
 */
export function useGlobalHotkeys() {
  const navigate = useNavigate();
  const { setOpen, open } = useCommand();
  const { toggleDensity } = useDensity();

  useEffect(() => {
    let pendingG = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const clearG = () => {
      pendingG = false;
      if (gTimer) clearTimeout(gTimer);
      gTimer = null;
    };

    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
        return;
      }

      if (isTypingTarget(e.target) || open) return;

      if (e.key === "/" && !mod) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (e.key.toLowerCase() === "n" && !mod) {
        e.preventDefault();
        navigate("/transacoes?new=1");
        return;
      }

      if (e.key.toLowerCase() === "d" && !mod && e.shiftKey === false && pendingG === false) {
        // density: Alt+D
      }

      if (mod && e.key.toLowerCase() === "d" && e.shiftKey) {
        e.preventDefault();
        toggleDensity();
        return;
      }

      if (e.key.toLowerCase() === "g" && !mod) {
        pendingG = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(clearG, 800);
        return;
      }

      if (pendingG) {
        const map: Record<string, string> = {
          d: "/",
          t: "/transacoes",
          c: "/contas",
          a: "/categorias",
          m: "/metas",
          i: "/investimentos",
          r: "/relatorios",
          f: "/fechamento",
          s: "/config",
        };
        const path = map[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          navigate(path);
        }
        clearG();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearG();
    };
  }, [navigate, setOpen, open, toggleDensity]);
}
