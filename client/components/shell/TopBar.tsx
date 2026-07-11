import { Menu, Rows3, Rows4 } from "lucide-react";
import { Breadcrumb } from "./Breadcrumb";
import { SearchTrigger } from "./SearchTrigger";
import { IconButton } from "../ui/IconButton";
import { useDensity } from "../../contexts/DensityContext";

interface TopBarProps {
  pathname: string;
  onMenuClick: () => void;
}

export function TopBar({ pathname, onMenuClick }: TopBarProps) {
  const { density, toggleDensity, isCompact } = useDensity();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-sidebar/80 backdrop-blur-md safe-top">
      <div className="flex items-center gap-3 px-4 md:px-6 h-14">
        <IconButton label="Abrir menu" className="md:hidden" onClick={onMenuClick}>
          <Menu size={20} />
        </IconButton>

        <div className="hidden sm:block min-w-0 flex-shrink">
          <Breadcrumb pathname={pathname} />
        </div>

        <div className="flex-1 flex justify-center max-w-md mx-auto w-full">
          <SearchTrigger />
        </div>

        <IconButton
          label={isCompact ? "Modo confortável" : "Modo compacto"}
          onClick={toggleDensity}
          title={`Densidade: ${density}`}
        >
          {isCompact ? <Rows4 size={18} /> : <Rows3 size={18} />}
        </IconButton>
      </div>
    </header>
  );
}
