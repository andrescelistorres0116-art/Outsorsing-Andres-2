"use client";

import { Building2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (tipo: "empresa" | "persona_natural") => void;
}

export default function TipoClienteModal({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg">¿Qué tipo de cliente deseas registrar?</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Selecciona el tipo para continuar con el formulario correspondiente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 pt-2 pb-1">
          {/* Empresa */}
          <button
            onClick={() => onSelect("empresa")}
            className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 p-6 text-center transition-all hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Empresa</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                S.A.S, LTDA, S.A,<br />Persona Jurídica
              </p>
            </div>
          </button>

          {/* Persona Natural */}
          <button
            onClick={() => onSelect("persona_natural")}
            className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 p-6 text-center transition-all hover:border-violet-400 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-100 group-hover:bg-violet-200 transition-colors">
              <User className="w-7 h-7 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Persona Natural</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                Natural o<br />independiente
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
