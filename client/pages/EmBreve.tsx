import { LucideIcon } from "lucide-react";

interface EmBreveProps {
  title: string;
  icon: LucideIcon;
  description: string;
}

export function EmBreve({ title, icon: Icon, description }: EmBreveProps) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center mb-4">
        <Icon size={22} className="text-primary" />
      </div>
      <h1 className="font-display font-bold text-xl mb-2">{title}</h1>
      <p className="text-ink-muted text-sm max-w-sm">{description}</p>
    </div>
  );
}
