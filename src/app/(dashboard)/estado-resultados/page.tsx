"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  BarChart2, Upload, Download, RefreshCw, AlertCircle,
  Building2, ArrowLeft, Search, Settings, CheckCircle2,
  Trash2, FileSpreadsheet, Calendar, BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppSession } from "@/hooks/useAppSession"
import TablaEstadoResultados from "@/components/estado-resultados/TablaEstadoResultados"
import type { EstadoResultados } from "@/lib/estado-resultados/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmpresaItem {
  id: string
  razonSocial: string
  nombreComercial: string | null
  nit: string
  softwareContable: string | null
}

interface ArchivoMeta {
  id: string
  nombreArchivo: string
  mesesCubiertos: string[]
  createdAt: string
}

interface CatalogoInfo {
  hasCatalogo: boolean
  totalCuentas: number
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

function mesLabel(mes: string): string {
  const [y, m] = mes.split("-")
  const names = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  return `${names[parseInt(m, 10) - 1] ?? m} ${y}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function CalendarioMeses({
  archivos,
  onSeleccionarMes,
  mesSeleccionado,
}: {
  archivos: ArchivoMeta[]
  onSeleccionarMes: (mes: string) => void
  mesSeleccionado: string | null
}) {
  // Build set of all covered months + unique years
  const cubiertos = new Set(archivos.flatMap(a => a.mesesCubiertos))
  const años = Array.from(
    new Set([
      new Date().getFullYear(),
      ...Array.from(cubiertos).map(m => parseInt(m.split("-")[0], 10)),
    ])
  ).sort()

  return (
    <div className="space-y-4">
      {años.map(año => (
        <div key={año}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            {año}
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {MONTH_NAMES.map((name, i) => {
              const mes = `${año}-${String(i + 1).padStart(2, "0")}`
              const cargado = cubiertos.has(mes)
              const seleccionado = mesSeleccionado === mes

              return (
                <button
                  key={mes}
                  disabled={!cargado}
                  onClick={() => cargado && onSeleccionarMes(mes)}
                  title={cargado ? `Ver informe ${mesLabel(mes)}` : `${mesLabel(mes)} — sin datos`}
                  className={[
                    "rounded-md py-1.5 text-xs font-medium transition-all border",
                    cargado
                      ? seleccionado
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer"
                      : "bg-muted/40 text-muted-foreground/40 border-transparent cursor-default",
                  ].join(" ")}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Configuración ───────────────────────────────────────────────────────

function TabConfiguracion({
  empresa,
  archivos,
  cargandoArchivos,
  onArchivoSubido,
  onArchivoEliminado,
  onVerInforme,
}: {
  empresa: EmpresaItem
  archivos: ArchivoMeta[]
  cargandoArchivos: boolean
  onArchivoSubido: (archivo: ArchivoMeta, resultado: EstadoResultados) => void
  onArchivoEliminado: (id: string) => void
  onVerInforme: (mes: string) => void
}) {
  const [subiendo, setSubiendo]               = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [exito, setExito]                     = useState<string | null>(null)
  const [eliminando, setEliminando]           = useState<string | null>(null)
  const [mesCalendario, setMesCal]            = useState<string | null>(null)
  const inputRef                              = useRef<HTMLInputElement>(null)

  // Catalog state
  const [catalogo, setCatalogo]               = useState<CatalogoInfo | null>(null)
  const [cargandoCatalogo, setCargandoCat]    = useState(true)
  const [subiendoCatalogo, setSubiendoCat]    = useState(false)
  const [eliminandoCatalogo, setEliminandoCat] = useState(false)
  const catalogoInputRef                      = useRef<HTMLInputElement>(null)

  // Load catalog status
  useEffect(() => {
    fetch(`/api/estado-resultados/catalogo/${empresa.id}`)
      .then(r => r.json())
      .then(data => setCatalogo(data))
      .catch(console.error)
      .finally(() => setCargandoCat(false))
  }, [empresa.id])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setSubiendo(true)
    setError(null)
    setExito(null)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch(`/api/estado-resultados/archivos/${empresa.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivoBase64:    base64,
          nombreArchivo:    file.name,
          softwareContable: empresa.softwareContable ?? "world_office",
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? "Error al procesar")
      onArchivoSubido(data.archivo, data.estadoResultados)
      setExito(`Archivo procesado: ${data.archivo.mesesCubiertos.map(mesLabel).join(", ")}`)
    } catch (err: any) {
      setError(err.message ?? "Error desconocido")
    } finally {
      setSubiendo(false)
    }
  }

  async function handleEliminar(id: string) {
    setEliminando(id)
    try {
      const res = await fetch(`/api/estado-resultados/archivos/${empresa.id}?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error eliminando")
      onArchivoEliminado(id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEliminando(null)
    }
  }

  async function handleSubirCatalogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setSubiendoCat(true)
    setError(null)
    setExito(null)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch(`/api/estado-resultados/catalogo/${empresa.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivoBase64: base64 }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? "Error al procesar")
      setCatalogo({ hasCatalogo: true, totalCuentas: data.totalCuentas })
      setExito(`Catálogo importado: ${data.totalCuentas.toLocaleString("es-CO")} cuentas registradas`)
    } catch (err: any) {
      setError(err.message ?? "Error desconocido")
    } finally {
      setSubiendoCat(false)
    }
  }

  async function handleEliminarCatalogo() {
    setEliminandoCat(true)
    try {
      await fetch(`/api/estado-resultados/catalogo/${empresa.id}`, { method: "DELETE" })
      setCatalogo({ hasCatalogo: false, totalCuentas: 0 })
      setExito("Catálogo eliminado")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEliminandoCat(false)
    }
  }

  return (
    <div className="space-y-6 pt-4">
      {/* ── Libro Auxiliar upload ── */}
      <div className="flex items-center gap-3">
        <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" />
        <Button onClick={() => inputRef.current?.click()} disabled={subiendo}>
          {subiendo
            ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            : <Upload className="h-4 w-4 mr-2" />}
          {subiendo ? "Procesando…" : "Cargar Libro Auxiliar"}
        </Button>
        <p className="text-xs text-muted-foreground">World Office (.xlsx)</p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {exito && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-3 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{exito}</span>
        </div>
      )}

      {/* ── Catálogo de cuentas ── */}
      <Card>
        <CardContent className="pt-4 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Catálogo de cuentas</p>
            {catalogo?.hasCatalogo && (
              <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400">
                {catalogo.totalCuentas.toLocaleString("es-CO")} cuentas
              </span>
            )}
          </div>

          <input
            ref={catalogoInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleSubirCatalogo}
            className="hidden"
          />

          {cargandoCatalogo ? (
            <div className="flex items-center gap-2 py-1 text-muted-foreground text-sm">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Cargando…
            </div>
          ) : catalogo?.hasCatalogo ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-xs text-muted-foreground flex-1">
                El catálogo está activo. Los archivos que subas usarán esta información
                para clasificar las cuentas automáticamente.
              </p>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => catalogoInputRef.current?.click()}
                  disabled={subiendoCatalogo}
                >
                  {subiendoCatalogo
                    ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                  Actualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEliminarCatalogo}
                  disabled={eliminandoCatalogo}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20"
                >
                  {eliminandoCatalogo
                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-muted-foreground flex-1">
                Sin catálogo. Importa el listado de cuentas contables para que la
                clasificación del Estado de Resultados sea más precisa.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => catalogoInputRef.current?.click()}
                disabled={subiendoCatalogo}
              >
                {subiendoCatalogo
                  ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                Importar catálogo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Meses cargados (calendar) ── */}
      <Card>
        <CardContent className="pt-4 pb-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Meses cargados</p>
            {archivos.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                Haz clic en un mes para ver el informe
              </span>
            )}
          </div>

          {cargandoArchivos ? (
            <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Cargando…
            </div>
          ) : archivos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Aún no hay archivos cargados para esta empresa.
            </p>
          ) : (
            <CalendarioMeses
              archivos={archivos}
              mesSeleccionado={mesCalendario}
              onSeleccionarMes={mes => {
                setMesCal(mes)
                onVerInforme(mes)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Archivos cargados ── */}
      {archivos.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Archivos cargados</p>
          <div className="space-y-2">
            {archivos.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.nombreArchivo}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.mesesCubiertos.map(mesLabel).join(" · ")}
                    <span className="mx-1.5">·</span>
                    {formatDate(a.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleEliminar(a.id)}
                  disabled={eliminando === a.id}
                  className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded"
                  title="Eliminar"
                >
                  {eliminando === a.id
                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Estado de Resultados ────────────────────────────────────────────────

const TODOS_ID = "__todos__"

function TabEstadoResultados({
  empresa,
  archivos,
  resultadoInicial,
  mesInicial,
}: {
  empresa: EmpresaItem
  archivos: ArchivoMeta[]
  resultadoInicial: EstadoResultados | null
  mesInicial: string | null
}) {
  // "__todos__" = consolidated view; any other value = specific archive ID
  const [seleccion, setSeleccion]   = useState<string>(TODOS_ID)
  const [resultado, setResultado]   = useState<EstadoResultados | null>(null)
  const [cargando, setCargando]     = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)

  // When archivos list changes (e.g. after upload), refresh the consolidated view
  useEffect(() => {
    if (archivos.length === 0) { setResultado(null); return }

    // If a new file was just uploaded and we have a pending result, use it
    // but only if we're in the consolidated view (switch to it if not)
    if (resultadoInicial && mesInicial) {
      // After upload → reload consolidated to include the new file
      setSeleccion(TODOS_ID)
      return
    }

    // Otherwise just keep whatever is selected
  }, [archivos])

  // Load resultado whenever selection or archivos change
  useEffect(() => {
    if (archivos.length === 0) return

    setCargando(true)
    setError(null)

    const url = seleccion === TODOS_ID
      ? `/api/estado-resultados/archivos/${empresa.id}/consolidado`
      : `/api/estado-resultados/archivos/${empresa.id}/${seleccion}`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setResultado(data.estadoResultados as EstadoResultados)
      })
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))
  }, [seleccion, archivos, empresa.id])

  async function handleExportar() {
    if (!resultado) return
    setExportando(true)
    try {
      const res = await fetch("/api/estado-resultados/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estadoResultados: resultado,
          empresaNombre:    empresa.razonSocial,
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

  if (archivos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 pt-4">
        <BarChart2 className="h-10 w-10 opacity-15" />
        <p className="text-sm text-center">
          No hay informes cargados aún.
          <br />
          Ve a la pestaña <strong>Configuración</strong> para cargar un archivo.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Period selector + export */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 min-w-0">
          <label className="block text-xs text-muted-foreground mb-1">Período</label>
          <select
            value={seleccion}
            onChange={e => setSeleccion(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            {/* Consolidated option first */}
            <option value={TODOS_ID}>
              Todos los períodos ({archivos.length} {archivos.length === 1 ? "archivo" : "archivos"})
            </option>
            {/* Individual archives */}
            {archivos.map(a => (
              <option key={a.id} value={a.id}>
                {a.mesesCubiertos.map(mesLabel).join(" – ")}
                {" · "}
                {a.nombreArchivo}
              </option>
            ))}
          </select>
        </div>

        {resultado && (
          <Button variant="outline" size="sm" onClick={handleExportar} disabled={exportando}>
            {exportando
              ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              : <Download className="h-3.5 w-3.5 mr-1.5" />}
            Exportar Excel
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {cargando && (
        <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground text-sm">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Cargando informe…
        </div>
      )}
      {!cargando && resultado && (
        <>
          {seleccion === TODOS_ID && archivos.length > 1 && (
            <p className="text-xs text-muted-foreground -mb-2">
              Vista consolidada ({archivos.length} archivos). Selecciona un período específico para ver el detalle de movimientos al hacer clic en una celda.
            </p>
          )}
          <TablaEstadoResultados
            er={resultado}
            empresaId={empresa.id}
            archivoId={
              seleccion !== TODOS_ID
                ? seleccion
                : archivos.length === 1
                ? archivos[0].id
                : undefined
            }
          />
        </>
      )}
    </div>
  )
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
      <div className="flex items-center gap-3">
        <BarChart2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Estado de Resultados</h1>
          <p className="text-sm text-muted-foreground">Selecciona la empresa para ver o cargar informes</p>
        </div>
      </div>

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

      {cargando && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando empresas…</span>
        </div>
      )}

      {!cargando && filtradas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Building2 className="h-10 w-10 opacity-20" />
          <p className="text-sm">{busqueda ? "Sin resultados" : "No hay empresas registradas"}</p>
        </div>
      )}

      {!cargando && filtradas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtradas.map(empresa => (
            <button
              key={empresa.id}
              onClick={() => onSeleccionar(empresa)}
              className="text-left rounded-xl border border-border bg-card hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm transition-all p-4 group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-tight truncate">{empresa.razonSocial}</p>
                  {empresa.nombreComercial && empresa.nombreComercial !== empresa.razonSocial && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{empresa.nombreComercial}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono mt-1">NIT {empresa.nit}</p>
                </div>
              </div>
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

// ─── Step 2: Empresa view with tabs ──────────────────────────────────────────

function PantallaEmpresa({
  empresa,
  onCambiarEmpresa,
}: {
  empresa: EmpresaItem
  onCambiarEmpresa: () => void
}) {
  const [archivos, setArchivos]         = useState<ArchivoMeta[]>([])
  const [cargandoArchivos, setCargando] = useState(true)
  const [tabActivo, setTabActivo]       = useState("configuracion")
  // Result passed from config tab → results tab (to avoid a second fetch)
  const [resultadoPendiente, setResultadoPendiente] = useState<EstadoResultados | null>(null)
  const [mesPendiente, setMesPendiente]             = useState<string | null>(null)

  // Load archive list on mount
  useEffect(() => {
    setCargando(true)
    fetch(`/api/estado-resultados/archivos/${empresa.id}`)
      .then(r => r.json())
      .then(data => setArchivos(data.archivos ?? []))
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [empresa.id])

  const handleArchivoSubido = useCallback((archivo: ArchivoMeta, resultado: EstadoResultados) => {
    setArchivos(prev => [archivo, ...prev])
    // Pre-load the result and switch to the report tab
    setResultadoPendiente(resultado)
    setMesPendiente(archivo.mesesCubiertos[0] ?? null)
    setTabActivo("informe")
  }, [])

  const handleArchivoEliminado = useCallback((id: string) => {
    setArchivos(prev => prev.filter(a => a.id !== id))
  }, [])

  const handleVerInforme = useCallback((mes: string) => {
    setMesPendiente(mes)
    setTabActivo("informe")
  }, [])

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCambiarEmpresa}
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
          title="Cambiar empresa"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-xl font-bold truncate">Estado de Resultados</h1>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground truncate">
              <span className="font-medium text-foreground">{empresa.razonSocial}</span>
              <span className="mx-1.5">·</span>NIT {empresa.nit}
              {empresa.softwareContable && (
                <><span className="mx-1.5">·</span>
                <span className="capitalize">{empresa.softwareContable.replace(/_/g, " ")}</span></>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tabActivo} onValueChange={setTabActivo}>
        <TabsList className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm p-1 h-auto gap-1">
          <TabsTrigger
            value="configuracion"
            className="text-sm gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Settings className="h-3.5 w-3.5" />
            Configuración
          </TabsTrigger>
          <TabsTrigger
            value="informe"
            className="text-sm gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Estado de Resultados
            {archivos.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-xs font-semibold leading-none">
                {archivos.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracion">
          <TabConfiguracion
            empresa={empresa}
            archivos={archivos}
            cargandoArchivos={cargandoArchivos}
            onArchivoSubido={handleArchivoSubido}
            onArchivoEliminado={handleArchivoEliminado}
            onVerInforme={handleVerInforme}
          />
        </TabsContent>

        <TabsContent value="informe">
          <TabEstadoResultados
            empresa={empresa}
            archivos={archivos}
            resultadoInicial={resultadoPendiente}
            mesInicial={mesPendiente}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function EstadoResultadosPage() {
  useAppSession()

  const [empresas, setEmpresas]           = useState<EmpresaItem[]>([])
  const [cargandoEmpresas, setCargando]   = useState(true)
  const [empresaSeleccionada, setEmpresa] = useState<EmpresaItem | null>(null)

  useEffect(() => {
    fetch("/api/empresas?limit=100")
      .then(r => r.json())
      .then(data => {
        const todas = (data.empresas ?? data ?? []) as EmpresaItem[]
        // Solo mostrar empresas con software contable configurado
        setEmpresas(todas.filter(e => !!e.softwareContable))
      })
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [])

  if (!empresaSeleccionada) {
    return (
      <PantallaSelectorEmpresa
        empresas={empresas}
        cargando={cargandoEmpresas}
        onSeleccionar={setEmpresa}
      />
    )
  }

  return (
    <PantallaEmpresa
      empresa={empresaSeleccionada}
      onCambiarEmpresa={() => setEmpresa(null)}
    />
  )
}
