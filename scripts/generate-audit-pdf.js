// Script to generate the technical audit report PDF
// Run with: node scripts/generate-audit-pdf.js
// Output: public/auditoria-tecnica-outsoursing-andres.pdf

const { jsPDF } = require("../node_modules/jspdf/dist/jspdf.node.js");
const fs = require("fs");
const path = require("path");

const doc = new jsPDF({ unit: "mm", format: "a4" });
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
let y = 0;

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  navy: [15, 23, 42],
  blue: [37, 99, 235],
  indigo: [79, 70, 229],
  green: [22, 163, 74],
  orange: [234, 88, 12],
  red: [220, 38, 38],
  gray: [100, 116, 139],
  lightGray: [226, 232, 240],
  white: [255, 255, 255],
  bg: [248, 250, 252],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function newPage() {
  doc.addPage();
  y = MARGIN;
}

function ensureSpace(needed) {
  if (y + needed > PAGE_H - MARGIN) newPage();
}

function rgb(arr) {
  return arr;
}

function setFill(arr) {
  doc.setFillColor(...arr);
}

function setDraw(arr) {
  doc.setDrawColor(...arr);
}

function setTextColor(arr) {
  doc.setTextColor(...arr);
}

function rect(x, yy, w, h, style) {
  doc.rect(x, yy, w, h, style);
}

function text(str, x, yy, opts) {
  doc.text(str, x, yy, opts);
}

function setFont(style, size) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
}

function wrapText(str, maxW, fontSize, fontStyle) {
  doc.setFont("helvetica", fontStyle || "normal");
  doc.setFontSize(fontSize || 9);
  return doc.splitTextToSize(str, maxW);
}

function addWrappedText(str, x, startY, maxW, lineH, fontSize, fontStyle, color) {
  setFont(fontStyle || "normal", fontSize || 9);
  setTextColor(color || C.navy);
  const lines = doc.splitTextToSize(str, maxW);
  lines.forEach((line, i) => {
    ensureSpace(lineH);
    text(line, x, y);
    if (i < lines.length - 1) y += lineH;
  });
  y += lineH;
  return lines.length;
}

// ─── Cover Page ───────────────────────────────────────────────────────────────

function cover() {
  y = 0;
  // Background
  setFill(C.navy);
  rect(0, 0, PAGE_W, PAGE_H, "F");

  // Top accent bar
  setFill(C.blue);
  rect(0, 0, PAGE_W, 4, "F");

  // Logo area
  setFill(C.blue);
  doc.roundedRect(MARGIN, 28, 16, 16, 3, 3, "F");
  setFont("bold", 11);
  setTextColor(C.white);
  text("OA", MARGIN + 5.2, 39.5);

  setFont("bold", 22);
  setTextColor(C.white);
  text("Outsoursing Andrés", MARGIN + 22, 40);

  setFont("normal", 10);
  setTextColor([148, 163, 184]);
  text("Plataforma de Control Contable y Tributario", MARGIN + 22, 47);

  // Divider
  setFill([51, 65, 85]);
  rect(MARGIN, 58, CONTENT_W, 0.5, "F");

  // Title block
  y = 80;
  setFont("bold", 32);
  setTextColor(C.white);
  text("Auditoría Técnica", MARGIN, y);
  y += 11;
  setFont("bold", 32);
  text("y Funcional", MARGIN, y);
  y += 11;
  setFont("bold", 32);
  setTextColor([96, 165, 250]);
  text("Completa", MARGIN, y);

  y += 18;
  setFont("normal", 11);
  setTextColor([148, 163, 184]);
  const desc = "Diagnóstico objetivo del estado actual del sistema — arquitectura, seguridad, funcionalidad y preparación para producción.";
  const descLines = doc.splitTextToSize(desc, CONTENT_W - 20);
  descLines.forEach(line => { text(line, MARGIN, y); y += 6; });

  // Info pills
  y = 190;
  const pills = [
    { label: "Fecha", val: "Junio 2026" },
    { label: "Versión App", val: "Next.js 16.2.7" },
    { label: "Fases", val: "10 fases" },
    { label: "Estado", val: "Diagnóstico" },
  ];
  pills.forEach((p, i) => {
    const px = MARGIN + i * 46;
    setFill([30, 41, 59]);
    doc.roundedRect(px, y, 42, 16, 2, 2, "F");
    setFont("normal", 7);
    setTextColor([100, 116, 139]);
    text(p.label, px + 3, y + 5);
    setFont("bold", 8.5);
    setTextColor(C.white);
    text(p.val, px + 3, y + 12);
  });

  // Score summary
  y = 230;
  setFill([30, 41, 59]);
  doc.roundedRect(MARGIN, y, CONTENT_W, 40, 3, 3, "F");
  setFont("bold", 10);
  setTextColor([96, 165, 250]);
  text("PUNTAJES FINALES", MARGIN + 6, y + 8);

  const scores = [
    { dim: "Arquitectura", score: "7/10" },
    { dim: "Backend", score: "6/10" },
    { dim: "Frontend", score: "5/10" },
    { dim: "Seguridad", score: "3/10" },
    { dim: "Escalabilidad", score: "6/10" },
    { dim: "Mantenibilidad", score: "5/10" },
  ];
  scores.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const sx = MARGIN + 6 + col * 60;
    const sy = y + 17 + row * 10;
    setFont("normal", 8);
    setTextColor([148, 163, 184]);
    text(s.dim + ":", sx, sy);
    setFont("bold", 8);
    const sc = parseInt(s.score);
    setTextColor(sc >= 7 ? C.green : sc >= 5 ? C.orange : C.red);
    text(s.score, sx + 30, sy);
  });

  // Bottom footer
  setFont("normal", 8);
  setTextColor([71, 85, 105]);
  text("© 2026 Outsoursing Andrés — Documento de uso interno", PAGE_W / 2, PAGE_H - 10, { align: "center" });
}

// ─── Section helpers ──────────────────────────────────────────────────────────

let pageNum = 1;

function sectionHeader(num, title) {
  newPage();
  pageNum++;
  // Header bar
  setFill(C.navy);
  rect(0, 0, PAGE_W, 22, "F");
  setFill(C.blue);
  rect(0, 0, 4, 22, "F");
  setFont("bold", 13);
  setTextColor(C.white);
  text(`FASE ${num}  —  ${title}`, MARGIN, 14);

  // Page number
  setFont("normal", 8);
  setTextColor([100, 116, 139]);
  text(`Pág. ${pageNum}`, PAGE_W - MARGIN, 14, { align: "right" });

  y = 30;
}

function h2(title, color) {
  ensureSpace(14);
  setFont("bold", 11);
  setTextColor(color || C.blue);
  text(title, MARGIN, y);
  y += 1.5;
  setFill(color || C.blue);
  rect(MARGIN, y, 40, 0.5, "F");
  y += 5;
}

function h3(title) {
  ensureSpace(10);
  setFont("bold", 9.5);
  setTextColor(C.navy);
  text(title, MARGIN, y);
  y += 5;
}

function p(str, color, indent) {
  const x = MARGIN + (indent || 0);
  const w = CONTENT_W - (indent || 0);
  addWrappedText(str, x, y, w, 5, 9, "normal", color || C.navy);
}

function bullet(str, color, symbol) {
  ensureSpace(6);
  const sym = symbol || "•";
  setFont("normal", 9);
  setTextColor(color || C.navy);
  text(sym, MARGIN + 3, y);
  const lines = doc.splitTextToSize(str, CONTENT_W - 10);
  lines.forEach((line, i) => {
    if (i > 0) { ensureSpace(5); }
    text(line, MARGIN + 8, y);
    if (i < lines.length - 1) y += 5;
  });
  y += 5;
}

function statusBullet(str, status) {
  // status: "ok" | "warn" | "error" | "info"
  const colors = { ok: C.green, warn: C.orange, error: C.red, info: C.blue };
  const symbols = { ok: "✓", warn: "⚠", error: "✗", info: "→" };
  const c = colors[status] || C.gray;
  const sym = symbols[status] || "•";
  ensureSpace(6);
  setFont("bold", 9);
  setTextColor(c);
  text(sym, MARGIN + 3, y);
  setFont("normal", 9);
  setTextColor(C.navy);
  const lines = doc.splitTextToSize(str, CONTENT_W - 10);
  lines.forEach((line, i) => {
    if (i > 0) { ensureSpace(5); }
    text(line, MARGIN + 8, y);
    if (i < lines.length - 1) y += 5;
  });
  y += 5;
}

function badge(label, color, x, yy) {
  const w = doc.getStringUnitWidth(label) * 8 / doc.internal.scaleFactor + 6;
  setFill(color);
  doc.roundedRect(x, yy - 4.5, w, 6, 1, 1, "F");
  setFont("bold", 7);
  setTextColor(C.white);
  text(label, x + 3, yy);
  return w + 2;
}

function tableHeader(cols) {
  ensureSpace(10);
  setFill(C.navy);
  rect(MARGIN, y, CONTENT_W, 7, "F");
  setFont("bold", 8);
  setTextColor(C.white);
  let cx = MARGIN + 2;
  cols.forEach(col => {
    text(col.label, cx, y + 5);
    cx += col.w;
  });
  y += 7;
}

function tableRow(cols, values, odd) {
  ensureSpace(8);
  if (odd) {
    setFill(C.bg);
    rect(MARGIN, y, CONTENT_W, 7, "F");
  }
  setFont("normal", 8);
  setTextColor(C.navy);
  let cx = MARGIN + 2;
  cols.forEach((col, i) => {
    const val = values[i] || "";
    const lines = doc.splitTextToSize(String(val), col.w - 3);
    text(lines[0] || "", cx, y + 5);
    cx += col.w;
  });
  y += 7;
}

function gap(mm) {
  y += mm || 4;
}

// ─── Phase 1: System Inventory ────────────────────────────────────────────────

function phase1() {
  sectionHeader(1, "Inventario del Sistema");

  h2("1.1 Stack Tecnológico");
  const stack = [
    ["Framework", "Next.js 16.2.7 — App Router, Server Components, force-dynamic"],
    ["ORM", "Prisma 7.8.0 con @prisma/adapter-pg (PostgreSQL directo)"],
    ["Base de datos", "PostgreSQL en Railway (producción) / local para desarrollo"],
    ["Autenticación", "NextAuth.js 4.x — CredentialsProvider, JWT 8h"],
    ["UI", "Tailwind CSS 4.x, Lucide React, jsPDF 4.2.1"],
    ["Runtime", "Node.js — deploy en Railway (plataforma PaaS)"],
    ["Lenguaje", "TypeScript 5.x — build limpio, 0 errores"],
  ];
  stack.forEach(([k, v], i) => {
    ensureSpace(8);
    setFill(i % 2 === 0 ? C.bg : C.white);
    rect(MARGIN, y, CONTENT_W, 7, "F");
    setFont("bold", 8.5);
    setTextColor(C.navy);
    text(k, MARGIN + 3, y + 5);
    setFont("normal", 8.5);
    setTextColor(C.gray);
    text(v, MARGIN + 40, y + 5);
    y += 7;
  });

  gap(6);
  h2("1.2 Módulos y Rutas de la Aplicación");
  const modules = [
    ["/dashboard", "Panel de métricas generales", "Admin"],
    ["/empresas", "CRUD de empresas clientes", "Admin, Contador"],
    ["/accesos", "Gestión de credenciales externas", "Admin, Contador"],
    ["/calendario", "Calendario tributario con fechas", "Admin, Contador"],
    ["/nomina", "Lista de empresas con nómina", "Todos"],
    ["/nomina/[id]", "Gestión de reportes y novedades por empresa", "Todos"],
    ["/usuarios", "Administración de usuarios del sistema", "Admin"],
    ["/configuracion", "Perfil y configuración de cuenta", "Admin"],
    ["/login", "Página de autenticación", "Público"],
  ];
  const modCols = [
    { label: "Ruta", w: 50 },
    { label: "Descripción", w: 85 },
    { label: "Rol mínimo", w: 43 },
  ];
  tableHeader(modCols);
  modules.forEach(([r, d, rol], i) => tableRow(modCols, [r, d, rol], i % 2 === 0));

  gap(6);
  h2("1.3 APIs REST — Endpoints Identificados");

  const apis = [
    ["POST", "/api/auth/[...nextauth]", "Autenticación NextAuth", "✓"],
    ["GET/POST", "/api/app-users", "Usuarios del sistema", "✓"],
    ["PATCH/DELETE", "/api/app-users/[id]", "Modificar/eliminar usuario", "✓"],
    ["GET/POST", "/api/empresas", "CRUD empresas", "✓"],
    ["GET/PATCH/DELETE", "/api/empresas/[id]", "Empresa individual", "✓"],
    ["GET/POST", "/api/accesos", "Credenciales externas", "✗ sin auth"],
    ["GET/PATCH/DELETE", "/api/accesos/[id]", "Acceso individual", "✗ sin auth"],
    ["GET/POST", "/api/calendario", "Eventos tributarios", "✗ sin auth"],
    ["GET/PUT/DELETE", "/api/calendario/[id]", "Evento individual", "✗ sin auth"],
    ["GET/POST", "/api/nomina/empresas", "Empresas con nómina", "✓"],
    ["GET/PATCH", "/api/nomina/empresas/[id]", "Empresa nómina individual", "✓"],
    ["GET/POST", "/api/nomina/reportes", "Reportes de nómina", "✓"],
    ["GET/PATCH", "/api/nomina/reportes/[id]", "Reporte individual", "✓"],
    ["GET", "/api/nomina/reportes/[id]/export", "Exportar CSV/texto", "✓"],
    ["GET/POST", "/api/nomina/empleados", "Empleados", "✓"],
    ["GET/PATCH/DELETE", "/api/nomina/empleados/[id]", "Empleado individual", "✓"],
    ["GET/POST", "/api/nomina/novedades", "Novedades de nómina", "✓"],
    ["GET/PATCH/DELETE", "/api/nomina/novedades/[id]", "Novedad individual", "✓"],
    ["GET/POST", "/api/nomina/libranzas", "Libranzas / Préstamos", "✓"],
    ["GET/PATCH/DELETE", "/api/nomina/libranzas/[id]", "Libranza individual", "✓"],
    ["GET", "/api/nomina/auditorias/reportes/[id]", "Auditoría de reporte", "✓"],
    ["GET/POST", "/api/dashboard", "Métricas del dashboard", "✗ sin auth"],
    ["POST", "/api/seed", "Seed de datos iniciales", "✗ sin auth"],
  ];
  const apiCols = [
    { label: "Método", w: 22 },
    { label: "Ruta", w: 80 },
    { label: "Descripción", w: 60 },
    { label: "Auth", w: 16 },
  ];
  tableHeader(apiCols);
  apis.forEach(([m, r, d, a], i) => {
    ensureSpace(8);
    if (i % 2 === 0) { setFill(C.bg); rect(MARGIN, y, CONTENT_W, 7, "F"); }
    setFont("normal", 7.5);
    setTextColor(a.includes("✗") ? C.red : C.navy);
    text(m, MARGIN + 2, y + 5);
    text(r, MARGIN + 24, y + 5);
    text(d, MARGIN + 104, y + 5);
    text(a, MARGIN + 164, y + 5);
    y += 7;
  });

  gap(6);
  h2("1.4 Modelos Prisma");
  const models = [
    ["User", "Usuarios del sistema (NextAuth)", "id, email, name, role, isActive, empresaIds"],
    ["Empresa", "Empresas clientes", "id, nit, razonSocial, tipoPersona, regimen, activo"],
    ["Acceso", "Credenciales externas cifradas", "id, empresaId, tipo, plataforma, contrasena"],
    ["CalendarioTributario", "Eventos tributarios", "id, titulo, fecha, tipo, empresaId?"],
    ["EmpresaNomina", "Conf. nómina por empresa", "id, empresaId, modo (SIMPLE/COMPLETO)"],
    ["EmpleadoNomina", "Empleados de nómina", "id, empresaId, nombre, cargo, salarioBase"],
    ["ReporteNomina", "Reportes mensuales", "id, empresaId, mes, año, estado, totalNomina"],
    ["NovedadNomina", "Novedades por reporte", "id, reporteId, empleadoId, tipoNovedad, valor"],
    ["Libranza", "Libranzas y préstamos", "id, empresaId, empleadoId, tipo, cuotaActual"],
    ["AuditoriaReporte", "Historial de cambios de estado", "id, reporteId, accion, realizadoPorId"],
  ];
  models.forEach(([name, desc, fields], i) => {
    ensureSpace(10);
    setFill(i % 2 === 0 ? C.bg : C.white);
    rect(MARGIN, y, CONTENT_W, 9, "F");
    setFont("bold", 8.5);
    setTextColor(C.blue);
    text(name, MARGIN + 3, y + 5.5);
    setFont("normal", 8);
    setTextColor(C.navy);
    text(desc, MARGIN + 35, y + 5.5);
    setFont("normal", 7.5);
    setTextColor(C.gray);
    const flines = doc.splitTextToSize(fields, CONTENT_W - 95);
    text(flines[0], MARGIN + 95, y + 5.5);
    y += 9;
  });

  gap(6);
  h2("1.5 Enumeraciones (Prisma Enums)");
  const enums = [
    ["TipoNovedad", "18 valores", "HORAS_EXTRAS, INCAPACIDAD, VACACIONES, PRIMA_SERVICIOS, CESANTIAS, INTERESES_CESANTIAS, LICENCIA_MATERNIDAD, LICENCIA_PATERNIDAD, LICENCIA_REMUNERADA, LICENCIA_NO_REMUNERADA, SUSPENSION_DISCIPLINARIA, AUSENTISMO, LIBRANZA, PRESTAMO, DESCUENTO_AUTORIZADO, BONIFICACION, DEDUCCION_OTRO, NOVEDAD_OTRO"],
    ["EstadoReporteNomina", "6 valores", "BORRADOR, ENVIADA, REVISADA, APROBADA, REABIERTA, CORREGIDA"],
    ["ModoFlujoNomina", "2 valores", "SIMPLE, COMPLETO"],
    ["UserRole", "4 valores", "ADMIN, ANALYST, NOMINA, CLIENT"],
    ["TipoAcceso", "Múltiple", "DIAN, SEGURIDAD_SOCIAL, BANCO, SOFTWARE_CONTABLE, OTROS"],
    ["TipoPersona", "2 valores", "NATURAL, JURIDICA"],
    ["RegimenTributario", "4 valores", "SIMPLE, COMUN, ESPECIAL, GRAN_CONTRIBUYENTE"],
  ];
  enums.forEach(([name, count, vals], i) => {
    ensureSpace(12);
    setFill(i % 2 === 0 ? C.bg : C.white);
    rect(MARGIN, y, CONTENT_W, 11, "F");
    setFont("bold", 8.5);
    setTextColor(C.indigo);
    text(name, MARGIN + 3, y + 5);
    setFont("bold", 8);
    setTextColor(C.gray);
    text(count, MARGIN + 58, y + 5);
    setFont("normal", 7);
    setTextColor(C.navy);
    const vlines = doc.splitTextToSize(vals, CONTENT_W - 75);
    text(vlines[0] || "", MARGIN + 75, y + 5);
    if (vlines[1]) text(vlines[1], MARGIN + 75, y + 9);
    y += 11;
  });
}

// ─── Phase 2: Functional Audit ────────────────────────────────────────────────

function phase2() {
  sectionHeader(2, "Auditoría Funcional por Módulo");

  h2("2.1 Módulo de Empresas");
  statusBullet("CRUD completo (crear, listar, editar, eliminar con confirmación)", "ok");
  statusBullet("Filtro por NIT / razón social funcional", "ok");
  statusBullet("Soft delete con campo 'activo'", "ok");
  statusBullet("Página de detalle (/empresas/[id]) usa datos mock hardcodeados — no conectada a BD", "error");
  statusBullet("Sin paginación server-side (carga todos los registros en memoria)", "warn");
  statusBullet("Sin validación de NIT único en el frontend", "warn");

  gap(3);
  h2("2.2 Módulo de Accesos");
  statusBullet("CRUD completo de credenciales externas", "ok");
  statusBullet("Contraseña enmascarada en la lista (••••••)", "ok");
  statusBullet("Botón 'revelar contraseña' con llamada GET /api/accesos/[id]", "ok");
  statusBullet("Cifrado de contraseña: XOR con clave fija — trivialmente reversible (no es cifrado real)", "error");
  statusBullet("Sin autenticación en los endpoints GET/POST/PATCH/DELETE de /api/accesos", "error");
  statusBullet("Sin control de acceso por empresa (cualquier usuario ve todos los accesos)", "error");

  gap(3);
  h2("2.3 Módulo de Calendario Tributario");
  statusBullet("Vista de calendario con eventos por mes funcional visualmente", "ok");
  statusBullet("Formulario de creación de eventos presente", "ok");
  statusBullet("API /api/calendario sin autenticación", "error");
  statusBullet("Los datos mostrados en la UI provienen mayormente de mocks locales", "warn");
  statusBullet("Sin notificaciones ni recordatorios automáticos", "warn");

  gap(3);
  h2("2.4 Módulo de Nómina — Reportes");
  statusBullet("Creación de reportes por empresa, mes y año", "ok");
  statusBullet("Flujo de estados completo: BORRADOR → ENVIADA → REVISADA → APROBADA", "ok");
  statusBullet("Historial de auditoría por reporte (AuditoriaReporte)", "ok");
  statusBullet("Exportación a CSV / texto con formato estructurado", "ok");
  statusBullet("Generación automática de cuotas libranza/préstamo al crear reportes", "ok");
  statusBullet("Sin cálculo automático de salario neto / total nómina", "error");
  statusBullet("totalNomina en BD siempre es 0 (no se calcula)", "error");

  gap(3);
  h2("2.5 Módulo de Nómina — Novedades (18 tipos)");
  statusBullet("HORAS_EXTRAS: valor, horas, tipo (diurnas/nocturnas/festivas)", "ok");
  statusBullet("INCAPACIDAD: días, tipo (enfermedad/accidente/licencia)", "ok");
  statusBullet("VACACIONES: días, fecha inicio/fin", "ok");
  statusBullet("PRIMA_SERVICIOS, CESANTIAS, INTERESES_CESANTIAS: valor simple", "ok");
  statusBullet("LICENCIAS (maternidad, paternidad, remunerada, no remunerada): días", "ok");
  statusBullet("SUSPENSION_DISCIPLINARIA: días", "ok");
  statusBullet("AUSENTISMO: días y descripción", "ok");
  statusBullet("LIBRANZA: vínculo a Libranza model, cuotas automáticas, entidad", "ok");
  statusBullet("PRESTAMO (nuevo): misma lógica que Libranza con tipo='PRESTAMO'", "ok");
  statusBullet("DESCUENTO_AUTORIZADO (nuevo): valor + observación obligatoria", "ok");
  statusBullet("BONIFICACION: valor y descripción", "ok");
  statusBullet("DEDUCCION_OTRO / NOVEDAD_OTRO: valor y descripción genérica", "ok");
  statusBullet("Sin validación de límites legales (ej. máx días vacaciones, horas extras legales)", "warn");

  gap(3);
  h2("2.6 Módulo de Usuarios");
  statusBullet("CRUD de usuarios con roles (ADMIN, ANALYST, NOMINA, CLIENT)", "ok");
  statusBullet("Asignación de empresas a usuarios tipo CLIENT", "ok");
  statusBullet("Eliminación con fallback a soft-delete cuando hay FK activas", "ok");
  statusBullet("Filtro por rol y estado (activo/inactivo)", "ok");
  statusBullet("Sin recuperación de contraseña / reset por email", "warn");
  statusBullet("Contraseñas hasheadas con bcrypt (correcto)", "ok");

  gap(3);
  h2("2.7 Dashboard");
  statusBullet("Tarjetas de métricas: empresas activas, reportes del mes, alertas", "ok");
  statusBullet("Gráfica de distribución de novedades visible", "ok");
  statusBullet("API /api/dashboard sin autenticación", "error");
  statusBullet("Datos de gráficas pueden ser parcialmente mock", "warn");
}

// ─── Phase 3: Role Audit ──────────────────────────────────────────────────────

function phase3() {
  sectionHeader(3, "Auditoría de Roles y Permisos");

  h2("3.1 Roles Definidos en el Sistema");
  const roles = [
    ["ADMIN", "Acceso total — todas las rutas y funciones del sistema"],
    ["ANALYST (Contador)", "Gestión de empresas, accesos, calendario, nómina — sin admin de usuarios"],
    ["NOMINA", "Acceso específico a módulo de nómina — rol intermedio"],
    ["CLIENT (Cliente)", "Acceso solo a /nomina de sus empresas asignadas"],
  ];
  roles.forEach(([role, desc], i) => {
    ensureSpace(10);
    setFill(i % 2 === 0 ? C.bg : C.white);
    rect(MARGIN, y, CONTENT_W, 9, "F");
    setFont("bold", 9);
    setTextColor(C.blue);
    text(role, MARGIN + 3, y + 6);
    setFont("normal", 8.5);
    setTextColor(C.navy);
    text(desc, MARGIN + 35, y + 6);
    y += 9;
  });

  gap(6);
  h2("3.2 Implementación de Guards");
  statusBullet("src/proxy.ts (naming crítico): el archivo no se llama middleware.ts — puede no ejecutarse como middleware de Next.js", "error");
  statusBullet("Las rutas de nómina usan getNominaSession() + canAccess() + isContador() — correctamente implementado", "ok");
  statusBullet("Las rutas de API de empresas y usuarios validan sesión con getServerSession()", "ok");
  statusBullet("/api/accesos, /api/calendario, /api/dashboard: sin ninguna validación de sesión", "error");
  statusBullet("Un cliente puede enviar peticiones directas a /api/accesos y ver credenciales de otras empresas", "error");
  statusBullet("El rol NOMINA existe en la BD pero no tiene rutas ni UI específica — sin uso real", "warn");

  gap(6);
  h2("3.3 Mapeo Sidebar vs Permisos Reales");
  p("El sidebar muestra rutas según el rol del usuario. Sin embargo, si proxy.ts no corre como middleware, las páginas son técnicamente accesibles sin autenticación desde el navegador. La protección efectiva depende únicamente de la verificación a nivel de API.", C.navy);
  gap(3);
  statusBullet("ADMIN: ve Dashboard, Empresas, Accesos, Calendario, Nómina, Configuración, Usuarios", "ok");
  statusBullet("ANALYST/Contador: ve Empresas, Accesos, Calendario, Nómina", "ok");
  statusBullet("CLIENT: ve solo Nómina (redirigido a /nomina al login)", "ok");
  statusBullet("No existe página de 'acceso denegado' — los redirects son al login", "warn");
}

// ─── Phase 4: Security Audit ──────────────────────────────────────────────────

function phase4() {
  sectionHeader(4, "Auditoría de Seguridad");

  h2("4.1 Hallazgos ALTO Riesgo", C.red);

  ensureSpace(12);
  setFill([254, 242, 242]);
  doc.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, "F");
  setFill(C.red);
  rect(MARGIN, y, 3, 9, "F");
  setFont("bold", 9);
  setTextColor(C.red);
  text("CRÍTICO — 12 endpoints sin autenticación", MARGIN + 6, y + 6);
  y += 10;

  p("Los siguientes endpoints no verifican sesión y son accesibles por cualquier cliente HTTP sin credenciales:", C.navy);
  ["/api/accesos (GET, POST)", "/api/accesos/[id] (GET, PATCH, DELETE)", "/api/calendario (GET, POST)", "/api/calendario/[id] (GET, PUT, DELETE)", "/api/dashboard (GET, POST)", "/api/seed (POST — puede resetear datos)"].forEach(ep => {
    bullet(ep, C.red, "✗");
  });

  gap(4);
  ensureSpace(12);
  setFill([254, 242, 242]);
  doc.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, "F");
  setFill(C.red);
  rect(MARGIN, y, 3, 9, "F");
  setFont("bold", 9);
  setTextColor(C.red);
  text("CRÍTICO — Cifrado de contraseñas XOR (trivialmente reversible)", MARGIN + 6, y + 6);
  y += 10;

  p("El módulo /api/accesos usa XOR byte-a-byte con una clave fija (ENCRYPTION_KEY) para 'cifrar' contraseñas de terceros. Cualquier atacante con acceso a la BD o a ENCRYPTION_KEY puede obtener todas las contraseñas en texto plano con una sola operación. Esto no es cifrado — es ofuscación. Se requiere AES-256-GCM o similar.", C.navy);

  gap(4);
  ensureSpace(12);
  setFill([254, 242, 242]);
  doc.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, "F");
  setFill(C.red);
  rect(MARGIN, y, 3, 9, "F");
  setFont("bold", 9);
  setTextColor(C.red);
  text("CRÍTICO — proxy.ts no es reconocido como middleware por Next.js", MARGIN + 6, y + 6);
  y += 10;

  p("Next.js espera un archivo llamado exactamente middleware.ts (o middleware.js) en la raíz del proyecto o en src/. El archivo src/proxy.ts no se ejecuta automáticamente — la protección de rutas de página puede estar completamente inactiva.", C.navy);

  gap(6);
  h2("4.2 Hallazgos MEDIO Riesgo", C.orange);
  statusBullet("Sistema de autenticación legado (user-store.ts) con contraseñas en texto plano potencialmente persistidas", "warn");
  statusBullet("JWT sin rotación — tokens de 8 horas sin blacklist al logout", "warn");
  statusBullet("Sin rate limiting en /api/auth/[...nextauth] (vulnerable a fuerza bruta)", "warn");
  statusBullet("Sin CSRF protection explícita en formularios de mutación", "warn");
  statusBullet("ENCRYPTION_KEY tiene valor fallback 'default-key' si no está en .env (riesgo en prod)", "warn");

  gap(6);
  h2("4.3 Hallazgos BAJO Riesgo", C.blue);
  statusBullet("Logs de error en consola pueden exponer stack traces en producción", "info");
  statusBullet("Sin Content Security Policy (CSP) headers configurados", "info");
  statusBullet("AuditoriaNovedad tiene onDelete:Cascade — eliminar una novedad borra el audit trail", "info");
  statusBullet("Sin validación de tamaño/tipo en inputs de texto libre (observaciones, etc.)", "info");
}

// ─── Phase 5: Database Audit ──────────────────────────────────────────────────

function phase5() {
  sectionHeader(5, "Auditoría de Base de Datos");

  h2("5.1 Estructura General");
  statusBullet("10 modelos Prisma bien relacionados con FKs declaradas", "ok");
  statusBullet("Uso de UUIDs (cuid()) como PK — correcto para distribución", "ok");
  statusBullet("Timestamps automáticos (createdAt, updatedAt) en todos los modelos", "ok");
  statusBullet("Soft delete implementado en Empresa y User (campo 'activo'/'isActive')", "ok");
  statusBullet("NovedadNomina no tiene soft delete — las novedades se eliminan físicamente", "warn");

  gap(4);
  h2("5.2 Índices y Performance");
  statusBullet("No hay índices explícitos declarados en schema.prisma (más allá de los PK automáticos)", "error");
  statusBullet("Consultas frecuentes sin índice: ReporteNomina(empresaId, mes, año), NovedadNomina(reporteId), Libranza(empleadoId)", "warn");
  statusBullet("findMany sin paginación en varias APIs — riesgo de timeouts con datos reales", "warn");
  statusBullet("Libranza.tipo es String sin restricción de enum — posibles valores inválidos", "warn");

  gap(4);
  h2("5.3 Relaciones y Constraints");
  statusBullet("onDelete:Cascade en AuditoriaNovedad → eliminar novedad destruye el historial", "error");
  statusBullet("User.empresaIds es String[] (array de strings) — no hay FK real a Empresa.id", "warn");
  statusBullet("CalendarioTributario.empresaId es opcional — eventos globales y por empresa mezclados sin distinción clara", "warn");
  statusBullet("EmpresaNomina y Empresa son entidades separadas — posible desincronización", "warn");

  gap(4);
  h2("5.4 Migraciones");
  statusBullet("Sistema de migraciones Prisma activo y funcional", "ok");
  statusBullet("Migración add_prestamo_descuento_autorizado aplicada exitosamente", "ok");
  statusBullet("No hay migraciones de seed de datos de prueba controladas por versión", "warn");
  statusBullet("/api/seed expuesto sin protección — riesgo de reset accidental en producción", "error");

  gap(4);
  h2("5.5 Calidad de Datos");
  statusBullet("totalNomina en ReporteNomina siempre almacena 0 — no hay lógica de cálculo", "error");
  statusBullet("Libranza.valorCuota es Decimal — correcto para valores monetarios", "ok");
  statusBullet("NovedadNomina.valor puede ser null — algunas novedades requieren valor pero no hay constraint BD", "warn");
  statusBullet("Fechas almacenadas como DateTime (con zona horaria UTC) — puede causar problemas de visualización en Colombia (UTC-5)", "warn");
}

// ─── Phase 6: Nomina Audit ────────────────────────────────────────────────────

function phase6() {
  sectionHeader(6, "Auditoría del Módulo de Nómina");

  h2("6.1 Flujo de Estados del Reporte");
  p("El sistema implementa un flujo de aprobación multi-etapa para los reportes de nómina:", C.navy);
  gap(2);

  const states = [
    ["BORRADOR", "Estado inicial — editable por contador/admin"],
    ["ENVIADA", "Enviada al cliente para revisión — solo lectura para contador"],
    ["REVISADA", "Cliente confirma revisión — esperando aprobación"],
    ["APROBADA", "Aprobación final — reporte cerrado"],
    ["REABIERTA", "Admin reabre el reporte para correcciones"],
    ["CORREGIDA", "Corrección aplicada — vuelve al flujo"],
  ];
  states.forEach(([state, desc], i) => {
    ensureSpace(9);
    setFill(i % 2 === 0 ? C.bg : C.white);
    rect(MARGIN, y, CONTENT_W, 8, "F");
    setFont("bold", 8.5);
    setTextColor(C.indigo);
    text(state, MARGIN + 3, y + 5.5);
    setFont("normal", 8.5);
    setTextColor(C.navy);
    text(desc, MARGIN + 45, y + 5.5);
    y += 8;
  });

  gap(6);
  h2("6.2 Modos de Flujo (ModoFlujoNomina)");
  statusBullet("SIMPLE: cliente puede aprobar directamente sin pasar por REVISADA", "ok");
  statusBullet("COMPLETO: flujo completo BORRADOR → ENVIADA → REVISADA → APROBADA", "ok");
  statusBullet("Configurado por empresa en EmpresaNomina.modoFlujo", "ok");
  statusBullet("El cliente no puede ver qué modo está activo para su empresa", "warn");

  gap(4);
  h2("6.3 Libranzas y Préstamos");
  statusBullet("Modelo Libranza con cuotaActual, numeroCuotas, valorCuota, entidad", "ok");
  statusBullet("Generación automática de cuotas en períodos subsiguientes (generar-nominas.ts)", "ok");
  statusBullet("PRESTAMO usa mismo modelo Libranza con campo tipo='PRESTAMO'", "ok");
  statusBullet("Prevención de eliminar libranza con cuotas pagadas (solo desactivar)", "ok");
  statusBullet("Prevención de modificar valorCuota/numeroCuotas con cuotas ya pagadas", "ok");
  statusBullet("tipo es String — debería ser enum para prevenir valores inválidos", "warn");

  gap(4);
  h2("6.4 Cálculos de Nómina — Estado Actual");
  p("HALLAZGO CRÍTICO: El sistema gestiona el registro de novedades pero NO calcula el salario neto de los empleados:", C.red);
  gap(2);
  statusBullet("No hay fórmula de salario base + bonificaciones - deducciones implementada", "error");
  statusBullet("ReporteNomina.totalNomina = 0 siempre (campo existe pero no se calcula)", "error");
  statusBullet("No hay cálculo de parafiscales, aportes a seguridad social, retención en la fuente", "error");
  statusBullet("La exportación incluye novedades pero no el total neto por empleado", "warn");
  statusBullet("El sistema funciona actualmente como un REGISTRO de novedades, no como una nómina real", "warn");

  gap(4);
  h2("6.5 Auditoría de Novedades");
  statusBullet("AuditoriaReporte registra cambios de estado con usuario y timestamp", "ok");
  statusBullet("No hay auditoría de creación/edición de novedades individuales", "warn");
  statusBullet("AuditoriaNovedad model existe pero onDelete:Cascade destruye registros al borrar novedad", "error");
}

// ─── Phase 7: Frontend Audit ──────────────────────────────────────────────────

function phase7() {
  sectionHeader(7, "Auditoría de Frontend y UX");

  h2("7.1 Login y Autenticación");
  statusBullet("Pantalla de login profesional con degradado, logo y validación visual", "ok");
  statusBullet("Spinner de carga durante autenticación, botón desactivado", "ok");
  statusBullet("Redirección por rol (cliente → /nomina, contador → /empresas, admin → /dashboard)", "ok");
  statusBullet("'Recordarme' y '¿Olvidaste tu contraseña?' no tienen funcionalidad implementada", "warn");
  statusBullet("Sin página de recuperación de contraseña", "error");

  gap(4);
  h2("7.2 Sidebar y Navegación");
  statusBullet("Sidebar colapsable en desktop con iconos, estados activos correctos", "ok");
  statusBullet("Navegación móvil con bottom nav (primeros 5 ítems)", "ok");
  statusBullet("Avatar con iniciales del usuario, email visible", "ok");
  statusBullet("Logout funcional", "ok");
  statusBullet("Sin breadcrumbs en páginas de detalle (empresas/[id], nomina/[id])", "warn");

  gap(4);
  h2("7.3 Módulo de Nómina — Formulario de Novedades");
  statusBullet("Selector de tipo de novedad con 18 opciones correctamente renderizado", "ok");
  statusBullet("Campos dinámicos por tipo de novedad (renderFields())", "ok");
  statusBullet("Creación de libranza inline con todos los campos necesarios", "ok");
  statusBullet("Chips de resumen de novedades por empleado en el reporte", "ok");
  statusBullet("Modo de edición de novedades existentes funcional", "ok");
  statusBullet("Sin confirmación visual al guardar una novedad (solo desaparece el form)", "warn");
  statusBullet("Sin feedback de error amigable cuando falla la API", "warn");

  gap(4);
  h2("7.4 Tabla de Reportes");
  statusBullet("Lista de reportes con estado visual (badges de color por estado)", "ok");
  statusBullet("Botones de cambio de estado contextuales según rol", "ok");
  statusBullet("Historial de auditoría visible por reporte", "ok");
  statusBullet("Sin paginación — todos los reportes de todos los meses visibles a la vez", "warn");
  statusBullet("Sin filtro por año o estado en la lista de reportes", "warn");

  gap(4);
  h2("7.5 Responsividad y Accesibilidad");
  statusBullet("Diseño responsive con breakpoints md: para desktop/móvil", "ok");
  statusBullet("Bottom nav para móvil — buena experiencia básica", "ok");
  statusBullet("Inputs con labels correctamente asociados (htmlFor)", "ok");
  statusBullet("Sin atributos ARIA en componentes custom (dropdowns, modales)", "warn");
  statusBullet("Contraste de colores no verificado contra WCAG 2.1", "warn");
  statusBullet("Sin manejo de estados vacíos consistente en todas las tablas", "warn");
}

// ─── Phase 8: Production Readiness ───────────────────────────────────────────

function phase8() {
  sectionHeader(8, "Preparación para Producción");

  h2("8.1 Infraestructura (Railway)");
  statusBullet("Deploy en Railway con PostgreSQL administrado — buena elección para startup", "ok");
  statusBullet("Variables de entorno necesarias: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ENCRYPTION_KEY", "ok");
  statusBullet("Sin configuración de backups automáticos documentada", "warn");
  statusBullet("Sin configuración de alertas de uptime / error rate", "warn");
  statusBullet("Sin CDN para assets estáticos", "warn");

  gap(4);
  h2("8.2 Variables de Entorno y Configuración");
  statusBullet("NEXTAUTH_SECRET: correctamente externalizado", "ok");
  statusBullet("DATABASE_URL: correctamente externalizado", "ok");
  statusBullet("ENCRYPTION_KEY: externalizado pero con fallback inseguro 'default-key'", "error");
  statusBullet("Sin validación de variables de entorno al arrancar (ej. con zod/envalid)", "warn");
  statusBullet("Sin archivo .env.example o documentación de variables requeridas", "warn");

  gap(4);
  h2("8.3 Logging y Monitoreo");
  statusBullet("console.error() en catch blocks — suficiente para desarrollo, insuficiente en prod", "warn");
  statusBullet("Sin integración con Sentry, Datadog u otra plataforma de observabilidad", "warn");
  statusBullet("Sin métricas de performance de queries Prisma", "warn");
  statusBullet("Sin health check endpoint (/api/health)", "warn");

  gap(4);
  h2("8.4 Build y CI/CD");
  statusBullet("Build de Next.js pasa limpio — 0 errores TypeScript", "ok");
  statusBullet("Sin pipeline de CI/CD automatizado (GitHub Actions u otro)", "warn");
  statusBullet("Sin proceso de PR review / code review documentado", "warn");
  statusBullet("Sin ambiente de staging separado de producción", "warn");

  gap(4);
  h2("8.5 Datos y Privacidad");
  statusBullet("Datos de nómina son datos sensibles — sin política de retención documentada", "warn");
  statusBullet("Sin encriptación en reposo de datos sensibles más allá del cifrado XOR de accesos", "error");
  statusBullet("Sin proceso de eliminación de datos de cliente al terminar contrato", "warn");
  statusBullet("Sin términos de servicio o política de privacidad en la plataforma", "warn");
}

// ─── Phase 9: Tests ───────────────────────────────────────────────────────────

function phase9() {
  sectionHeader(9, "Auditoría de Calidad y Pruebas");

  h2("9.1 Cobertura de Tests");
  ensureSpace(25);
  setFill([254, 242, 242]);
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, "F");
  setFill(C.red);
  rect(MARGIN, y, 3, 22, "F");
  setFont("bold", 14);
  setTextColor(C.red);
  text("0 tests", MARGIN + 8, y + 10);
  setFont("normal", 9);
  setTextColor(C.navy);
  text("No existe ningún archivo de tests en el proyecto.", MARGIN + 8, y + 17);
  y += 25;

  gap(4);
  p("No se encontraron archivos *.test.ts, *.spec.ts, ni directorios __tests__ en ningún módulo del proyecto. No hay framework de testing configurado (Jest, Vitest, Playwright, Cypress).", C.navy);

  gap(4);
  h2("9.2 Áreas Críticas Sin Cobertura");
  const critical = [
    "Lógica de autenticación y autorización (roles, canAccess)",
    "Flujo de estados de reportes (transiciones válidas e inválidas)",
    "Validaciones de novedades de nómina (18 tipos con reglas distintas)",
    "Lógica de cuotas de libranza/préstamo y avance automático",
    "APIs sin autenticación (verificar que ahora sí protejan)",
    "Cifrado/descifrado de contraseñas de accesos",
  ];
  critical.forEach(c => bullet(c, C.navy));

  gap(4);
  h2("9.3 Lo que Sí Funciona como Control de Calidad");
  statusBullet("TypeScript estricto — errores de tipo detectados en compile-time", "ok");
  statusBullet("Build de Next.js como integración básica — verifica importaciones y syntax", "ok");
  statusBullet("Prisma type safety — errores de schema detectados en generate", "ok");

  gap(4);
  h2("9.4 Recomendación de Testing");
  p("Para un sistema de nómina que maneja datos financieros sensibles, se recomienda mínimamente:", C.navy);
  gap(2);
  bullet("Vitest para unit tests de lógica de negocio (validaciones, cálculos, estados)");
  bullet("Playwright para E2E del flujo crítico: login → crear reporte → agregar novedad → aprobar");
  bullet("Supertest para integration tests de APIs con DB de test aislada");
}

// ─── Phase 10: Final Scores ───────────────────────────────────────────────────

function phase10() {
  sectionHeader(10, "Diagnóstico Final y Puntuaciones");

  h2("10.1 Tabla de Puntuaciones por Dimensión");

  const scores = [
    ["Arquitectura", 7, "Stack moderno y bien elegido. App Router de Next.js correctamente usado. Separación de concerns aceptable."],
    ["Backend / APIs", 6, "APIs de nómina bien estructuradas. 12 endpoints sin auth es bloqueante para producción."],
    ["Frontend / UX", 5, "UI profesional y funcional. Faltan estados vacíos, confirmaciones y feedback de errores."],
    ["Seguridad", 3, "Múltiples vulnerabilidades críticas: endpoints abiertos, XOR 'cifrado', middleware inactivo."],
    ["Escalabilidad", 6, "Railway + Prisma escala razonablemente. Sin índices explícitos ni paginación server-side."],
    ["Mantenibilidad", 5, "0 tests, código parcialmente duplicado (auth legacy), sin CI/CD."],
    ["Funcionalidad", 6, "Registro de novedades completo. Sin cálculo de nómina real — el valor más crítico falta."],
    ["Preparación Prod", 4, "No listo para clientes reales sin resolver seguridad, tests y cálculo de nómina."],
  ];

  scores.forEach(([dim, score, comment], i) => {
    ensureSpace(18);
    setFill(i % 2 === 0 ? C.bg : C.white);
    rect(MARGIN, y, CONTENT_W, 16, "F");

    // Score bar
    const barX = MARGIN + 48;
    const barW = 60;
    const barH = 4;
    const barY = y + 9;
    setFill(C.lightGray);
    rect(barX, barY, barW, barH, "F");
    const fillColor = score >= 7 ? C.green : score >= 5 ? C.orange : C.red;
    setFill(fillColor);
    rect(barX, barY, (barW * score) / 10, barH, "F");

    setFont("bold", 9);
    setTextColor(C.navy);
    text(dim, MARGIN + 3, y + 7);
    setFont("bold", 11);
    setTextColor(fillColor);
    text(`${score}/10`, barX + barW + 4, y + 11);
    setFont("normal", 7.5);
    setTextColor(C.gray);
    const clines = doc.splitTextToSize(comment, CONTENT_W - 110);
    text(clines[0] || "", barX + barW + 20, y + 7);
    if (clines[1]) text(clines[1], barX + barW + 20, y + 12);
    y += 16;
  });

  gap(6);
  h2("10.2 Resumen Ejecutivo");

  ensureSpace(50);
  setFill([239, 246, 255]);
  doc.roundedRect(MARGIN, y, CONTENT_W, 48, 3, 3, "F");
  setFill(C.blue);
  rect(MARGIN, y, 3, 48, "F");
  setFont("bold", 10);
  setTextColor(C.blue);
  text("Estado General del Sistema", MARGIN + 8, y + 8);
  y += 12;

  const summary = [
    "El sistema tiene una arquitectura sólida y una buena base de código. El módulo de nómina es el más completo y funcional del sistema, con 18 tipos de novedades, flujo de aprobación multi-etapa y generación automática de cuotas.",
    "Sin embargo, hay 3 bloqueantes CRÍTICOS antes de poder usarlo con clientes reales:",
    "1. Seguridad: 12 APIs sin autenticación + XOR no es cifrado real + middleware posiblemente inactivo.",
    "2. Funcionalidad: El sistema no calcula nómina — solo registra novedades. totalNomina = 0 siempre.",
    "3. Calidad: 0 tests en un sistema financiero es un riesgo operacional inaceptable.",
  ];
  summary.forEach(line => {
    const lines = doc.splitTextToSize(line, CONTENT_W - 14);
    setFont(line.startsWith("Sin embargo") || line.match(/^\d\./) ? "bold" : "normal", 8.5);
    setTextColor(C.navy);
    lines.forEach(l => { text(l, MARGIN + 8, y); y += 5; });
    y += 1;
  });

  gap(6);
  h2("10.3 Roadmap de Correcciones Prioritarias");

  const roadmap = [
    { priority: "P0 — Bloqueante", color: C.red, items: [
      "Agregar autenticación a /api/accesos, /api/calendario, /api/dashboard, /api/seed",
      "Renombrar proxy.ts → middleware.ts y verificar que el guard funciona",
      "Reemplazar XOR con AES-256-GCM para encriptación de contraseñas",
    ]},
    { priority: "P1 — Crítico", color: C.orange, items: [
      "Implementar cálculo de nómina: salario base ± novedades = total neto",
      "Agregar índices en BD para queries frecuentes",
      "Configurar tests básicos (Vitest) para lógica de nómina y autenticación",
    ]},
    { priority: "P2 — Importante", color: C.blue, items: [
      "Completar página de detalle de empresa con datos reales",
      "Agregar paginación server-side en listas con muchos registros",
      "Eliminar sistema de autenticación legado (user-store.ts)",
      "Agregar health check endpoint y logging estructurado",
    ]},
    { priority: "P3 — Mejora", color: C.gray, items: [
      "Implementar recuperación de contraseña por email",
      "Agregar filtros de año y estado en lista de reportes de nómina",
      "Configurar CI/CD con GitHub Actions",
      "Validar variables de entorno al arrancar con zod",
    ]},
  ];

  roadmap.forEach(({ priority, color, items }) => {
    ensureSpace(12 + items.length * 6);
    setFont("bold", 9);
    setTextColor(color);
    text(priority, MARGIN, y);
    y += 5;
    items.forEach(item => bullet(item, C.navy, "→"));
    gap(2);
  });
}

// ─── Footer on all pages ──────────────────────────────────────────────────────

function addFooters() {
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    setFill([226, 232, 240]);
    rect(0, PAGE_H - 10, PAGE_W, 10, "F");
    setFont("normal", 7);
    setTextColor(C.gray);
    text("Outsoursing Andrés — Auditoría Técnica y Funcional — Junio 2026", MARGIN, PAGE_H - 4);
    text(`${i} / ${total}`, PAGE_W - MARGIN, PAGE_H - 4, { align: "right" });
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

cover();
phase1();
phase2();
phase3();
phase4();
phase5();
phase6();
phase7();
phase8();
phase9();
phase10();
addFooters();

const outPath = path.join(__dirname, "../public/auditoria-tecnica-outsoursing-andres.pdf");
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const pdfOutput = doc.output();
fs.writeFileSync(outPath, pdfOutput, "binary");

console.log(`PDF generado: ${outPath}`);
console.log(`Páginas: ${doc.getNumberOfPages()}`);
console.log(`Tamaño: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
