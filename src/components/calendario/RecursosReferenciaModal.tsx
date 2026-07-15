"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Upload, Download, Trash2, Loader2, FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Recurso {
  id: string;
  nombre: string;
  tipo: string;
  tamanio: number;
  subidoEn: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function FileIcon({ tipo }: { tipo: string }) {
  const isSheet = tipo.includes("excel") || tipo.includes("spreadsheet");
  return isSheet
    ? <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
    : <FileText className="w-5 h-5 text-red-500 shrink-0" />;
}

const ALLOWED = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ACCEPT = ".pdf,.xls,.xlsx";

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function RecursosReferenciaModal({ open, onClose }: Props) {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) fetchRecursos();
  }, [open]);

  async function fetchRecursos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recursos-calendario");
      if (res.ok) setRecursos(await res.json());
    } catch {
      setError("No se pudo cargar la lista de documentos.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("Tipo de archivo no permitido. Use PDF, XLS o XLSX.");
      return;
    }
    uploadFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((d, b) => d + String.fromCharCode(b), "")
      );
      const res = await fetch("/api/recursos-calendario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivoData: base64,
          archivoNombre: file.name,
          archivoTipo: file.type,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Error al subir el archivo.");
        return;
      }
      const nuevo: Recurso = await res.json();
      setRecursos((prev) => [nuevo, ...prev]);
    } catch {
      setError("Error de conexión al subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(recurso: Recurso) {
    setDownloadingId(recurso.id);
    try {
      const res = await fetch(`/api/recursos-calendario/${recurso.id}`);
      if (!res.ok) { setError("Error al descargar el archivo."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = recurso.nombre;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Error de conexión al descargar.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await fetch("/api/recursos-calendario", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setRecursos((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Error al eliminar el documento.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Documentos de Referencia
          </DialogTitle>
          <DialogDescription>
            Sube el Calendario Tributario DIAN u otros documentos de consulta.
            Podrás descargarlos o eliminarlos en cualquier momento.
          </DialogDescription>
        </DialogHeader>

        {/* Upload area */}
        <div
          className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
            {uploading
              ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              : <Upload className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {uploading ? "Subiendo..." : "Haz clic para subir un documento"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">PDF, XLS o XLSX · Máximo 15 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 px-1">{error}</p>
        )}

        {/* Document list */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : recursos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No hay documentos subidos todavía.
            </p>
          ) : (
            recursos.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group"
              >
                <FileIcon tipo={r.tipo} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {fmtSize(r.tamanio)} · {fmtDate(r.subidoEn)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => handleDownload(r)}
                    disabled={downloadingId === r.id}
                    title="Descargar"
                  >
                    {downloadingId === r.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    title="Eliminar"
                  >
                    {deletingId === r.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-1 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-sm">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
