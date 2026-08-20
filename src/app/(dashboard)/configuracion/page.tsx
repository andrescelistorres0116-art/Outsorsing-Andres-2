"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Settings,
  Building2,
  Shield,
  Bell,
  Upload,
  Eye,
  EyeOff,
  Clock,
  Key,
  CheckCircle2,
  Save,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// ─── Tab: General ──────────────────────────────────────────────────────────────

function TabGeneral() {
  const [companyName, setCompanyName] = useState("Orbita AC")
  const [timezone, setTimezone] = useState("America/Bogota")
  const [language, setLanguage] = useState("es")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const [saved, setSaved] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState("")
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedName = localStorage.getItem("company_name")
    const savedLogo = localStorage.getItem("company_logo")
    if (savedName) setCompanyName(savedName)
    if (savedLogo) setLogoPreview(savedLogo)
  }, [])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setLogoError("Solo se permiten archivos PNG o JPG.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("El logo no puede superar 2 MB.")
      return
    }
    setLogoError("")
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    localStorage.setItem("company_name", companyName)
    if (logoPreview) {
      localStorage.setItem("company_logo", logoPreview)
    } else {
      localStorage.removeItem("company_logo")
    }
    window.dispatchEvent(
      new CustomEvent("company-settings-updated", {
        detail: { name: companyName, logo: logoPreview },
      })
    )
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Company info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Información de la Empresa
          </CardTitle>
          <CardDescription>
            Datos generales que aparecen en reportes y notificaciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Nombre de la empresa</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  {logoPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-12 h-12 rounded-xl object-cover shadow"
                      />
                      <button
                        onClick={() => { setLogoPreview(null); setLogoError("") }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
                        title="Quitar logo"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white text-sm font-bold shadow">
                      CF
                    </div>
                  )}
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => logoRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {logoPreview ? "Cambiar logo" : "Subir logo"}
                </Button>
                <span className="text-xs text-gray-400">PNG, JPG · máx 2 MB</span>
              </div>
              {logoError && (
                <p className="text-xs text-red-600 mt-1">{logoError}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración Regional</CardTitle>
          <CardDescription>Idioma, zona horaria y formato de fecha.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Zona horaria</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="America/Bogota">Colombia / Bogotá (UTC-5)</option>
                <option value="America/Caracas">Venezuela (UTC-4)</option>
                <option value="America/Lima">Peru / Lima (UTC-5)</option>
                <option value="America/Mexico_City">México (UTC-6)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFormat">Formato de fecha</Label>
              <select
                id="dateFormat"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Guardado
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Tab: Seguridad ────────────────────────────────────────────────────────────

function TabSeguridad() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("60")
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState("")

  function handleChangePassword() {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwError("Todos los campos son obligatorios.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("La nueva contraseña y la confirmación no coinciden.")
      return
    }
    if (newPassword.length < 8) {
      setPwError("La nueva contraseña debe tener al menos 8 caracteres.")
      return
    }
    setPwError("")
    setPwSaved(true)
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setTimeout(() => setPwSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso a la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="oldPassword">Contraseña actual</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowOld(!showOld)}
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />
          </div>
          {pwError && (
            <p className="text-xs text-red-600 font-medium">{pwError}</p>
          )}
          <Button
            onClick={handleChangePassword}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {pwSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Contraseña actualizada
              </>
            ) : (
              "Actualizar contraseña"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Sesión
          </CardTitle>
          <CardDescription>
            Configura el tiempo de inactividad antes de cerrar sesión automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-1.5 w-48">
              <Label htmlFor="sessionTimeout">Tiempo de inactividad</Label>
              <select
                id="sessionTimeout"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="120">2 horas</option>
                <option value="480">8 horas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Autenticación de Dos Factores (2FA)
          </CardTitle>
          <CardDescription>
            Agrega una capa adicional de seguridad a tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <Shield className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Próximamente</p>
              <p className="text-xs text-blue-600 mt-0.5">
                La autenticación de dos factores estará disponible en una próxima versión de Orbita AC.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

// ─── Tab: Notificaciones ───────────────────────────────────────────────────────

interface NotifToggle {
  id: string
  label: string
  description: string
  value: boolean
}

function TabNotificaciones() {
  const [toggles, setToggles] = useState<NotifToggle[]>([
    {
      id: "alerta_proxima",
      label: "Alertas de obligaciones próximas (3 días)",
      description:
        "Recibe un correo electrónico cuando una obligación tributaria vence en 3 días o menos.",
      value: true,
    },
    {
      id: "alerta_vencida",
      label: "Alertas de obligaciones vencidas",
      description:
        "Notificación inmediata cuando una obligación supera su fecha de vencimiento sin completarse.",
      value: true,
    },
    {
      id: "resumen_diario",
      label: "Resumen diario por correo",
      description:
        "Recibe cada mañana un resumen con las obligaciones del día y las tareas pendientes.",
      value: false,
    },
    {
      id: "cierre_nomina",
      label: "Recordatorios de cierre de nómina",
      description:
        "Aviso previo al cierre de cada periodo de nómina para que los clientes envíen sus novedades a tiempo.",
      value: true,
    },
  ])

  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, value: !t.value } : t))
    )
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            Notificaciones por Correo
          </CardTitle>
          <CardDescription>
            Controla qué alertas recibes en tu bandeja de entrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {toggles.map((t, idx) => (
            <div key={t.id}>
              {idx > 0 && <Separator />}
              <div className="flex items-start justify-between gap-6 px-6 py-5">
                <div className="space-y-0.5 flex-1">
                  <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.description}</p>
                </div>
                <Switch
                  checked={t.value}
                  onCheckedChange={() => toggle(t.id)}
                  aria-label={t.label}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Guardado
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar notificaciones
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function ConfiguracionContent() {
  const params = useSearchParams();
  const defaultTab = params.get("tab") ?? "general";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
          <Settings className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Administra la plataforma, usuarios y preferencias de Orbita AC.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-gray-100 h-10">
          <TabsTrigger value="general" className="gap-2 text-sm">
            <Building2 className="w-3.5 h-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="seguridad" className="gap-2 text-sm">
            <Shield className="w-3.5 h-3.5" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="gap-2 text-sm">
            <Bell className="w-3.5 h-3.5" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <TabGeneral />
        </TabsContent>


        <TabsContent value="seguridad" className="mt-6">
          <TabSeguridad />
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-6">
          <TabNotificaciones />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={null}>
      <ConfiguracionContent />
    </Suspense>
  )
}
