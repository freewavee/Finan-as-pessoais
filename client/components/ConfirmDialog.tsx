import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex gap-3">
        {danger && (
          <div className="w-9 h-9 rounded-full bg-expense/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-expense" />
          </div>
        )}
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
      <div className="flex gap-3 mt-5">
        <button
          onClick={onCancel}
          className="flex-1 border border-line hover:bg-surface-hover text-ink py-2.5 rounded-md text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 font-semibold py-2.5 rounded-md text-sm transition-colors ${
            danger ? "bg-expense hover:bg-expense/90 text-white" : "bg-primary hover:bg-primary-hover text-white"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
