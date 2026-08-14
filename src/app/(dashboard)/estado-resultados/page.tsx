"use client"

import { useState, useEffect, useRef } from "react"
import {
  BarChart2, Upload, Download, RefreshCw,
  AlertCircle, CheckCircle2, Building2, ArrowLeft, Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAppSession } from "@/hooks/useAppSession"
import TablaEstadoResultados from "@/components/estado-resultados/TablaEstadoResultados"
import type { EstadoResultados } from "@/lib/estado-resultados/types"

interface EmpresaItem {
  id: string
  razonSocial: string
  nombreComercial: string | null
  nit: string
  softwareContable: string | null
}

// ─── Step 1: Empresa selector ─────────────────────────────────────────────────

function PantallaSelectorEmpresa({
  empresas,
  cargando,
  onSeleccionar,
}: {
  empresas: EmpresaItem[]
  cargando: boolean
  onSeleccionar: (e: EmpresaItem) => void
}) {
  const [busqueda, setBusqueda] = useState("")

  const filtradas = empresas.filter(e => {
    const q = busqueda.toLowerCase()
    return (
      e.razonSocial.toLowerCase().includes(q) ||
      (e.nombreComercial ?? "").toLowerCase().includes(q) ||
      e.nit.includes(q)
    )
  })

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Estado de Resultados</h1>
          <p className="text-sm text-muted-foreground">
            Selecciona la empresa para generar el informe
          </p>
        </div>
      </div>

      {/* Search */}
      {empresas.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar empresa…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* Loading */}
      {cargando && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando empresas…</span>
        </div>
      )}

      {/* Empty */}
      {!cargando && filtradas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Building2 className="h-10 w-10 opacity-20" />
          <p className="text-sm">
            {busqueda ? "Sin resultados para esa búsqueda" : "No hay empresas registradas"}
          </p>
        </div>
      )}

      {/* Grid */}
      {!cargando && filtradas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtradas.map(empresa => (
            <button
              key={empresa.id}
              onClick={() => onSeleccionar(empresa)}
              className="text-left rounded-xl border border-border bg-card hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm transition-all p-4 group"
            >
              {/* Icon + name */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-tight truncate">
                    {empresa.razonSocial}
                  </p>
                  {empresa.nombreComercial && empresa.nombreComercial !== empresa.razonSocial && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {empresa.nombreComercial}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    NIT {empresa.nit}
                  </p>
                </div>
              </div>

              {/* Software badge */}
              <div className="mt-3">
                {empresa.softwareContable ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {empresa.softwareContable.replace(/_/g, " ")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs">
                    Sin software configurado
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Report generator ─────────────────────────────────────────────────

function PantallaGenerarInforme({
  empresa,
  onCambiarEmpresa,
}: {
  empresa: EmpresaItem
  onCambiarEmpresa: () => void
}) {
  const [archivo, setArchivo]       = useState<File | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [resultado, setResultado]   = useState<EstadoResultados | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setArchivo(f)
    setResultado(null)
    setError(null)
  }

  async function handleProcesar() {
    if (!archivo) return
    setProcesando(true)
    setError(null)
    setResultado(null)
    try {
      const base64 = await fileToBase64(archivo)
      const res = await fetch("/api/estado-resultados/procesar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          archivoBase64: base64,
          nombreArchivo: archivo.name,
          softwareContable: empresa.softwareContable ?? "world_office",
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
          empresaNombre: empresa.razonSocial,
        }),
      })
      if (!res.ok) throw new Error("Error al exportar")
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `estado-resultados-${empresa.razonSocial.replace(/\s+/g, "-")}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header con empresa seleccionada */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCambiarEmpresa}
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
          title="Cambiar empresa"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <BarChart2 className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-xl font-bold truncate">Estado de Resultados</h1>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground truncate">
              <span className="font-medium text-foreground">{empresa.razonSocial}</span>
              <span className="mx-1.5">·</span>
              <span>NIT {empresa.nit}</span>
              {empresa.softwareContable && (
                <>
                  <span className="mx-1.5">·</span>
                  <span className="capitalize">{empresa.softwareContable.replace(/_/g, " ")}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Advertencia si no tiene software configurado */}
      {!empresa.softwareContable && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Esta empresa no tiene software contable configurado. El sistema intentará
            procesar el archivo como <strong>World Office</strong>.
          </span>
        </div>
      )}

      {/* Upload card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* File picker */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium mb-1.5">
                Archivo Excel (Libro Auxiliar)
              </label>
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
                className="w-full flex items-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <Upload className="h-4 w-4 shrink-0" />
                {archivo ? (
                  <span className="truncate text-foreground font-medium">{archivo.name}</span>
                ) : (
                  <span>Seleccionar archivo .xlsx…</span>
                )}
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={handleProcesar}
                disabled={!archivo || procesando}
              >
                {procesando ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BarChart2 className="h-4 w-4 mr-2" />
                )}
                {procesando ? "Procesando…" : "Generar"}
              </Button>

              {resultado && (
                <Button variant="outline" onClick={handleExportar} disabled={exportando}>
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
              Informe generado —{" "}
              <span className="font-medium">{resultado.meses.join(" | ")}</span>
            </span>
          </div>
          <TablaEstadoResultados er={resultado} />
        </div>
      )}

      {/* Empty state */}
      {!resultado && !procesando && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Upload className="h-10 w-10 opacity-15" />
          <p className="text-sm text-center">
            Selecciona el archivo Excel del Libro Auxiliar y presiona <strong>Generar</strong>
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function EstadoResultadosPage() {
  useAppSession()

  const [empresas, setEmpresas]               = useState<EmpresaItem[]>([])
  const [cargando, setCargando]               = useState(true)
  const [empresaSeleccionada, setEmpresa]     = useState<EmpresaItem | null>(null)

  useEffect(() => {
    fetch("/api/empresas?limit=100")
      .then(r => r.json())
      .then(data => {
        const lista = (data.empresas ?? data ?? []) as EmpresaItem[]
        setEmpresas(lista)
      })
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [])

  if (!empresaSeleccionada) {
    return (
      <PantallaSelectorEmpresa
        empresas={empresas}
        cargando={cargando}
        onSeleccionar={setEmpresa}
      />
    )
  }

  return (
    <PantallaGenerarInforme
      empresa={empresaSeleccionada}
      onCambiarEmpresa={() => setEmpresa(null)}
    />
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
