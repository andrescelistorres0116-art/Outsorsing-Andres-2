"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  User,
  Calculator,
  X,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppUser } from "@/lib/app-auth";
import { EMPRESAS_MOCK } from "@/lib/empresas-mock";
import { EmpresaMock } from "@/lib/empresas-mock";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserFormData {
  nombre: string;
  email: string;
  password: string;
  role: "contador" | "cliente";
  empresaIds: number[];
  activo: boolean;
}

const DEFAULT_FORM: UserFormData = {
  nombre: "",
  email: "",
  password: "",
  role: "cliente",
  empresaIds: [],
  activo: true,
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaMock[]>(EMPRESAS_MOCK);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState<UserFormData>(DEFAULT_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData | "general", string>>>({});

  function fetchUsers() {
    fetch("/api/app-users")
      .then((r) => r.json())
      .then((data: AppUser[]) => setUsers(data))
      .catch(() => {});
  }

  useEffect(() => {
    fetchUsers();
    // Load empresas from server first, fall back to localStorage
    fetch("/api/app-empresas")
      .then(async (r) => {
        if (r.status === 200) {
          const data: EmpresaMock[] = await r.json();
          setEmpresas(Array.isArray(data) ? data : []);
          return;
        }
        // 204 = not yet initialized, fall back to localStorage
        try {
          const stored = localStorage.getItem("empresas-data");
          if (stored) setEmpresas(JSON.parse(stored) as EmpresaMock[]);
        } catch {}
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem("empresas-data");
          if (stored) setEmpresas(JSON.parse(stored) as EmpresaMock[]);
        } catch {}
      });
  }, []);

  const filtered = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalContadores = users.filter((u) => u.role === "contador").length;
  const totalClientes = users.filter((u) => u.role === "cliente").length;
  const activosClientes = users.filter((u) => u.role === "cliente" && u.activo).length;

  function openCreate() {
    setEditingUser(null);
    setForm(DEFAULT_FORM);
    setErrors({});
    setShowPassword(false);
    setModalOpen(true);
  }

  function openEdit(user: AppUser) {
    setEditingUser(user);
    setForm({
      nombre: user.nombre,
      email: user.email,
      password: user.password,
      role: user.role === "admin" ? "cliente" : user.role,
      empresaIds: user.empresaIds,
      activo: user.activo,
    });
    setErrors({});
    setShowPassword(false);
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditingUser(null);
    setForm(DEFAULT_FORM);
    setErrors({});
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.nombre.trim()) errs.nombre = "Ingrese el nombre";
    if (!form.email.trim()) errs.email = "Ingrese el correo";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Correo no válido";
    else {
      const dup = users.find(
        (u) => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editingUser?.id
      );
      if (dup) errs.email = "Este correo ya está en uso";
    }
    if (!form.password) errs.password = "Ingrese la contraseña";
    else if (form.password.length < 6) errs.password = "Mínimo 6 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    if (editingUser) {
      const updated: AppUser = {
        ...editingUser,
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        role: editingUser.role === "admin" ? "admin" : form.role,
        empresaIds: form.empresaIds,
        activo: form.activo,
      };
      const res = await fetch("/api/app-users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        fetchUsers();
        handleClose();
      }
    } else {
      const maxId = users
        .map((u) => {
          const n = parseInt(u.id.replace("user-", ""), 10);
          return isNaN(n) ? 0 : n;
        })
        .reduce((a, b) => Math.max(a, b), 0);
      const newUser: AppUser = {
        id: `user-${maxId + 1}`,
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        role: form.role,
        empresaIds: form.empresaIds,
        activo: form.activo,
        creadoEn: new Date().toISOString().split("T")[0],
      };
      const res = await fetch("/api/app-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        fetchUsers();
        handleClose();
      }
    }
  }

  async function handleDelete(user: AppUser) {
    if (user.role === "admin") return;
    const res = await fetch("/api/app-users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id }),
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
  }

  function toggleEmpresa(id: number) {
    setForm((prev) => ({
      ...prev,
      empresaIds: prev.empresaIds.includes(id)
        ? prev.empresaIds.filter((e) => e !== id)
        : [...prev.empresaIds, id],
    }));
  }

  function empresaNombre(id: number): string {
    return empresas.find((e) => e.id === id)?.razonSocial ?? `Empresa #${id}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600 shadow-lg shadow-violet-600/25">
            <UserCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestión de accesos de clientes al portal</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Usuarios",     value: users.length,      color: "text-gray-900",   bg: "bg-white" },
          { label: "Contadores",         value: totalContadores,   color: "text-blue-700",   bg: "bg-blue-50" },
          { label: "Clientes Activos",   value: activosClientes,   color: "text-violet-700", bg: "bg-violet-50" },
          { label: "Clientes Totales",   value: totalClientes,     color: "text-gray-600",   bg: "bg-white" },
        ].map((s) => (
          <Card key={s.label} className={s.bg}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o correo..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresas Asignadas</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Creado</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`hover:bg-violet-50/30 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-9 h-9 rounded-full text-white text-xs font-bold shrink-0 ${user.role === "admin" ? "bg-blue-600" : user.role === "contador" ? "bg-emerald-600" : "bg-violet-500"}`}>
                        {user.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{user.nombre}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-2.5 py-0.5">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : user.role === "contador" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5">
                        <Calculator className="w-3 h-3" /> Contador
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-100 rounded-full px-2.5 py-0.5">
                        <User className="w-3 h-3" /> Cliente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {user.role === "admin" ? (
                      <span className="text-xs text-gray-400 italic">Todas</span>
                    ) : user.empresaIds.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Sin asignar</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.empresaIds.slice(0, 2).map((id) => (
                          <span key={id} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                            {empresaNombre(id)}
                          </span>
                        ))}
                        {user.empresaIds.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                            +{user.empresaIds.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant={user.activo ? "success" : "secondary"} className="text-xs">
                      {user.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {user.creadoEn ? (() => { const [y,m,d] = user.creadoEn.split("-"); return `${d}/${m}/${y}`; })() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <UserCog className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Nombre completo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Carlos Ramírez"
                className={errors.nombre ? "border-red-400" : ""}
              />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Correo electrónico <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="cliente@empresa.com"
                className={errors.email ? "border-red-400" : ""}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className={`pr-10 ${errors.password ? "border-red-400" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Rol */}
            {editingUser?.role !== "admin" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Rol <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((p) => ({ ...p, role: v as "contador" | "cliente" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contador">Contador — accede a Empresas, Accesos y Calendario</SelectItem>
                    <SelectItem value="cliente">Cliente — accede solo a Nómina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Empresas — only for non-admin */}
            {editingUser?.role !== "admin" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Empresas asignadas
                </Label>
                <p className="text-xs text-gray-400">
                  {form.role === "cliente"
                    ? "Empresas que puede ver en Nómina"
                    : "Empresas que puede gestionar (Contador)"}
                </p>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
                  {empresas
                    .filter((e) => {
                      if (e.fechaFinRelacion) {
                        const today = new Date().toISOString().split("T")[0];
                        if (e.fechaFinRelacion <= today) return false;
                      }
                      return e.estado === "ACTIVA";
                    })
                    .map((emp) => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.empresaIds.includes(emp.id)}
                          onChange={() => toggleEmpresa(emp.id)}
                          className="w-4 h-4 rounded border-gray-300 text-violet-600 accent-violet-600 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 font-medium">{emp.razonSocial}</span>
                        <span className="text-xs text-gray-400 ml-auto">{emp.nit}</span>
                      </label>
                    ))}
                </div>
                {form.empresaIds.length > 0 && (
                  <p className="text-xs text-violet-600 font-medium">
                    {form.empresaIds.length} empresa{form.empresaIds.length !== 1 ? "s" : ""} seleccionada{form.empresaIds.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            {/* Estado */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-700">Estado del usuario</p>
                <p className="text-xs text-gray-400">Los usuarios inactivos no pueden iniciar sesión</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
                disabled={editingUser?.role === "admin"}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                  form.activo ? "bg-violet-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.activo ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white">
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
