"use client"

import { useState, useEffect, useRef } from "react"
import { BarChart2, Upload, Download, RefreshCw, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSession } from "@/hooks/useAppSession"
import TablaEstadoResultados from "@/components/estado-resultados/TablaEstadoResultados"
import type { EstadoResultados } from "@/lib/estado-resultados/types"

interface EmpresaItem {
  id: string
  razonSocial: string
  softwareContable: string | null
}

export default function EstadoResultadosPage() {
  const { appSession } = useAppSession()

  const [empresas, setEmpresas]           = useState<EmpresaItem[]>([])
  const [empresaId, setEmpresaId]         = useState<string>("")
  const [archivo, setArchivo]             = useState<File | null>(null)
  const [procesando, setProcesando]       = useState(false)
  const [exportando, setExportando]       = useState(false)
  const [resultado, setResultado]         = useState<EstadoResultados | null>(null)
  const [error, setError]                 = useState<string | null>(null)
  const inputRef                          = useRef<HTMLInputElement>(null)

  // Load empresas
  useEffect(() => {
    fetch("/api/empresas")
      .then(r => r.json())
      .then(data => {
        const lista = (data.empresas ?? data ?? []) as EmpresaItem[]
        setEmpresas(lista.filter(e => e.softwareContable))
        if (lista.length > 0) setEmpresaId(lista[0].id)
      })
      .catch(console.error)
  }, [])

  const empresaSeleccionada = empresas.find(e => e.id === empresaId)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setArchivo(f)
    setResultado(null)
    setError(null)
  }

  async function handleProcesar() {
    if (!archivo || !empresaId) return
    setProcesando(true)
    setError(null)
    setResultado(null)

    try {
      const base64 = await fileToBase64(archivo)
      const res = await fetch("/api/estado-resultados/procesar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId,
          archivoBase64: base64,
          nombreArchivo: archivo.name,
          softwareContable: empresaSeleccionada?.softwareContable ?? "world_office",
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? "Error procesando archivo")
      setResultado(data.estadoResultados)
    } catch (err: any) {
      setError(err.message ?? "Error desconocido")
    } finally {
      setProcesando(false)
    }
  }

  async function handleExportar() {
    if (!resultado) return
    setExportando(true)
    try {
      const res = await fetch("/api/estado-resultados/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estadoResultados: resultado,
          empresaNombre: empresaSeleccionada?.razonSocial ?? "Empresa",
        }),
      })
      if (!res.ok) throw new Error("Error al exportar")

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `estado-resultados-${empresaSeleccionada?.razonSocial ?? "empresa"}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Estado de Resultados</h1>
          <p className="text-sm text-muted-foreground">
            Carga un Libro Auxiliar de World Office para generar el informe
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* Empresa selector */}
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium mb-1.5">Empresa</label>
              <div className="relative">
                <select
                  value={empresaId}
                  onChange={e => {
                    setEmpresaId(e.target.value)
                    setResultado(null)
                    setError(null)
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm pr-8 appearance-none"
                >
                  {empresas.length === 0 && (
                    <option value="">Sin empresas con software contable</option>
                  )}
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.razonSocial}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {empresaSeleccionada?.softwareContable && (
                <p className="text-xs text-muted-foreground mt-1">
                  Software: {empresaSeleccionada.softwareContable.replace(/_/g, " ")}
                </p>
              )}
            </div>

            {/* File picker */}
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium mb-1.5">Archivo Excel (Libro Auxiliar)</label>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full flex items-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <Upload className="h-4 w-4 shrink-0" />
                {archivo ? (
                  <span className="truncate text-foreground">{archivo.name}</span>
                ) : (
                  <span>Seleccionar archivo…</span>
                )}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={handleProcesar}
                disabled={!archivo || !empresaId || procesando}
              >
                {procesando ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BarChart2 className="h-4 w-4 mr-2" />
                )}
                {procesando ? "Procesando…" : "Generar"}
              </Button>

              {resultado && (
                <Button
                  variant="outline"
                  onClick={handleExportar}
                  disabled={exportando}
                >
                  {exportando ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Exportar Excel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {resultado && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Informe generado — {resultado.meses.length} mes(es):{" "}
              <span className="font-medium">
                {resultado.meses.join(", ")}
              </span>
            </span>
          </div>

          <TablaEstadoResultados er={resultado} />
        </div>
      )}

      {/* Empty state */}
      {!resultado && !procesando && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <BarChart2 className="h-12 w-12 opacity-20" />
          <p className="text-sm">
            Selecciona una empresa y un archivo Excel para generar el Estado de Resultados
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
