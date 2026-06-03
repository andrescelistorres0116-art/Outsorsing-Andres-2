"use client"

import { useState } from "react"
import {
  Settings,
  Building2,
  Users,
  Shield,
  Bell,
  Upload,
  Eye,
  EyeOff,
  Pencil,
  UserX,
  Clock,
  Key,
  CheckCircle2,
  Save,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_USERS = [
  {
    id: "1",
    nombre: "Ana Rodríguez",
    correo: "ana.rodriguez@contaflow.co",
    rol: "ADMIN",
    estado: "Activo",
    ultimoAcceso: "hoy, 09:14",
  },
  {
    id: "2",
    nombre: "Carlos Mendoza",
    correo: "carlos.mendoza@contaflow.co",
    rol: "ANALYST",
    estado: "Activo",
    ultimoAcceso: "ayer, 16:42",
  },
  {
    id: "3",
    nombre: "Laura Gómez",
    correo: "laura.gomez@contaflow.co",
    rol: "NOMINA",
    estado: "Activo",
    ultimoAcceso: "hace 2 días",
  },
  {
    id: "4",
    nombre: "Pedro Vargas",
    correo: "pedro.vargas@contaflow.co",
    rol: "CLIENT",
    estado: "Inactivo",
    ultimoAcceso: "hace 15 días",
  },
  {
    id: "5",
    nombre: "Sofía Castro",
    correo: "sofia.castro@contaflow.co",
    rol: "ANALYST",
    estado: "Activo",
    ultimoAcceso: "hoy, 11:30",
  },
]

const MOCK_ACCESS_LOGS = [
  { id: "1", usuario: "Ana Rodríguez", empresa: "X TOURS SAS", accion: "Contraseña revelada", tiempo: "hoy 09:14" },
  { id: "2", usuario: "Carlos Mendoza", empresa: "DIAZAR LTDA", accion: "Contraseña revelada", tiempo: "hoy 08:55" },
  { id: "3", usuario: "Ana Rodríguez", empresa: "300 HILOS SAS", accion: "Contraseña revelada", tiempo: "ayer 17:02" },
  { id: "4", usuario: "Laura Gómez", empresa: "TEXTILES DEL NORTE", accion: "Contraseña revelada", tiempo: "ayer 14:30" },
  { id: "5", usuario: "Carlos Mendoza", empresa: "X TOURS SAS", accion: "Contraseña revelada", tiempo: "ayer 11:18" },
  { id: "6", usuario: "Sofía Castro", empresa: "INVERSIONES CASTILLO", accion: "Contraseña revelada", tiempo: "hace 2 días" },
  { id: "7", usuario: "Ana Rodríguez", empresa: "COMERCIAL TORRES", accion: "Contraseña revelada", tiempo: "hace 2 días" },
  { id: "8", usuario: "Carlos Mendoza", empresa: "DIAZAR LTDA", accion: "Contraseña revelada", tiempo: "hace 3 días" },
  { id: "9", usuario: "Laura Gómez", empresa: "300 HILOS SAS", accion: "Contraseña revelada", tiempo: "hace 4 días" },
  { id: "10", usuario: "Sofía Castro", empresa: "X TOURS SAS", accion: "Contraseña revelada", tiempo: "hace 5 días" },
]

// ─── Role badge helper ─────────────────────────────────────────────────────────

function RoleBadge({ rol }: { rol: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ADMIN: { label: "Admin", className: "bg-purple-100 text-purple-800 border-purple-200" },
    ANALYST: { label: "Analista", className: "bg-blue-100 text-blue-800 border-blue-200" },
    NOMINA: { label: "Nómina", className: "bg-green-100 text-green-800 border-green-200" },
    CLIENT: { label: "Cliente", className: "bg-gray-100 text-gray-700 border-gray-200" },
  }
  const config = map[rol] ?? { label: rol, className: "bg-gray-100 text-gray-600 border-gray-200" }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.className}`}
    >
      {config.label}
    </span>
  )
}

// ─── Tab: General ──────────────────────────────────────────────────────────────

function TabGeneral() {
  const [companyName, setCompanyName] = useState("ContaFlow")
  const [timezone, setTimezone] = useState("America/Bogota")
  const [language, setLanguage] = useState("es")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const [saved, setSaved] = useState(false)

  function handleSave() {
    // In a real app, POST to /api/settings
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
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white text-sm font-bold shadow">
                  CF
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  Subir logo
                </Button>
                <span className="text-xs text-gray-400">PNG, JPG · máx 2 MB</span>
              </div>
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

// ─── Tab: Usuarios ─────────────────────────────────────────────────────────────

function TabUsuarios() {
  const [users, setUsers] = useState(MOCK_USERS)

  function toggleUser(id: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo" }
          : u
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {users.filter((u) => u.estado === "Activo").length} usuarios activos
        </p>
        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Users className="w-3.5 h-3.5" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Nombre", "Correo", "Rol", "Estado", "Último acceso", "Acciones"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                          {u.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900 whitespace-nowrap">
                          {u.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{u.correo}</td>
                    <td className="px-5 py-3.5">
                      <RoleBadge rol={u.rol} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          u.estado === "Activo"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {u.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {u.ultimoAcceso}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                          title="Editar usuario"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${
                            u.estado === "Activo"
                              ? "text-gray-400 hover:text-red-600"
                              : "text-gray-400 hover:text-green-600"
                          }`}
                          title={u.estado === "Activo" ? "Desactivar usuario" : "Activar usuario"}
                          onClick={() => toggleUser(u.id)}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
                La autenticación de dos factores estará disponible en una próxima versión de ContaFlow.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos Accesos a Credenciales</CardTitle>
          <CardDescription>
            Registro de los últimos 10 momentos en que se reveló una contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Usuario", "Empresa", "Acción", "Fecha"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_ACCESS_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 text-gray-800 font-medium text-xs">{log.usuario}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{log.empresa}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5 font-medium">
                        <Eye className="w-3 h-3" />
                        {log.accion}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{log.tiempo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default function ConfiguracionPage() {
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
            Administra la plataforma, usuarios y preferencias de ContaFlow.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general">
        <TabsList className="bg-gray-100 h-10">
          <TabsTrigger value="general" className="gap-2 text-sm">
            <Building2 className="w-3.5 h-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2 text-sm">
            <Users className="w-3.5 h-3.5" />
            Usuarios
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

        <TabsContent value="usuarios" className="mt-6">
          <TabUsuarios />
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
