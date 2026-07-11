import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/** Abre fluxo de criação quando `?new=1` está na URL. */
export function useNewQueryParam(onOpen: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      onOpen();
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, onOpen]);
}
