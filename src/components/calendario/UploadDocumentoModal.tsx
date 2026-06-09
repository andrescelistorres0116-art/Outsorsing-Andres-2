"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paperclip, Upload, X, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DocumentoInfo {
  archivoNombre: string | null;
  fecha: string | null;
  porNombre: string | null;
}

interface UploadDocumentoModalProps {
  open: boolean;
  tipo: "contabilizado" | "declarado";
  obligacionId: string;
  obligacionNombre: string;
  documentoActual: DocumentoInfo;
  onClose: () => void;
  onSuccess: (tipo: "contabilizado" | "declarado", info: DocumentoInfo) => void;
}

const TIPO_LABEL = {
  contabilizado: "Contabilización",
  declarado: "Declaración",
};

const ACCEPT = ".pdf,.xls,.xlsx,.zip";
const ALLOWED_EXTENSIONS = ["pdf", "xls", "xlsx", "zip"];
const MAX_MB = 10;

function extensionOk(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXTENSIONS.includes(ext);
}

function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip",
  };
  return map[ext] ?? "application/octet-stream";
}

async function downloadArchivo(obligacionId: string, tipo: string, nombre: string) {
  const res = await fetch(`/api/obligaciones/${obligacionId}/archivo/${tipo}`)
  if (!res.ok) { alert("No se pudo descargar el archivo"); return; }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

export default function UploadDocumentoModal({
  open,
  tipo,
  obligacionId,
  obligacionNombre,
  documentoActual,
  onClose,
  onSuccess,
}: UploadDocumentoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const label = TIPO_LABEL[tipo];
  const tieneArchivo = !!documentoActual.archivoNombre;

  function reset() {
    setFile(null);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validateAndSet(f: File) {
    setError("");
    if (!extensionOk(f.name)) {
      setError("Tipo de archivo no permitido. Use PDF, XLS, XLSX o ZIP.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) validateAndSet(f);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSet(f);
  }

  async function handleUpload() {
    if (!file) { setError("Selecciona un archivo antes de continuar."); return; }
    setUploading(true);
    setError("");
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(`/api/obligaciones/${obligacionId}/${tipo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivoData: base64,
          archivoNombre: file.name,
          archivoTipo: mimeFromName(file.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al subir el archivo"); return; }

      const fechaStr = data[`${tipo}Fecha`]
        ? String(data[`${tipo}Fecha`]).split("T")[0]
        : new Date().toISOString().split("T")[0];

      onSuccess(tipo, {
        archivoNombre: file.name,
        fecha: fechaStr,
        porNombre: data[`${tipo}Por`]?.name ?? null,
      });
      reset();
      onClose();
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`¿Confirmar que desea eliminar el soporte de ${label.toLowerCase()} y desmarcar esta obligación?`)) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/obligaciones/${obligacionId}/${tipo}`, { method: "DELETE" });
      if (!res.ok) { alert("Error al eliminar el archivo"); return; }
      onSuccess(tipo, { archivoNombre: null, fecha: null, porNombre: null });
      onClose();
    } catch {
      alert("Error de conexión");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Paperclip className="w-5 h-5 text-blue-600" />
            Soporte de {label}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-slate-500 -mt-1 truncate">
          {obligacionNombre}
        </p>

        {/* Current file info */}
        {tieneArchivo && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-sm font-semibold text-green-800 truncate">
                  {documentoActual.archivoNombre}
                </span>
              </div>
              <button
                onClick={() => downloadArchivo(obligacionId, tipo, documentoActual.archivoNombre!)}
                className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 border border-green-300 rounded-lg px-2 py-1 hover:bg-green-100 transition-colors shrink-0"
                title="Descargar archivo"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
              </button>
            </div>
            {(documentoActual.fecha || documentoActual.porNombre) && (
              <p className="text-xs text-green-700">
                {documentoActual.porNombre && <span>Por: <strong>{documentoActual.porNombre}</strong></span>}
                {documentoActual.fecha && <span className="ml-2">· {documentoActual.fecha}</span>}
              </p>
            )}
            <p className="text-xs text-green-600 mt-1">
              Para reemplazar el archivo, selecciona uno nuevo a continuación.
            </p>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-blue-400 bg-blue-50"
              : file
              ? "border-blue-300 bg-blue-50/40"
              : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <Paperclip className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-sm font-medium text-blue-800 truncate max-w-[220px]">
                {file.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-600">
                Arrastra un archivo o haz clic para seleccionar
              </p>
              <p className="text-xs text-slate-400">
                PDF, XLS, XLSX, ZIP · Máx. {MAX_MB} MB
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="gap-2 pt-1">
          {tieneArchivo && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={removing || uploading}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 mr-auto"
            >
              {removing ? "Eliminando..." : "Quitar marca"}
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={uploading || removing}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || removing}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Subiendo...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                {tieneArchivo ? "Reemplazar" : "Subir y marcar"}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix: "data:...;base64,"
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
