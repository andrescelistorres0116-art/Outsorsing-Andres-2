# Dictamen Técnico — Aplicativo José / Orbita AC (Contaflow)
Fecha: 2026-08-04  
Auditor: Claude Code (análisis estático — sin modificación de código ni datos)

---

## 1. Resumen Ejecutivo

**Hallazgos críticos ordenados por impacto:**

- 🔴 **CRÍTICO — Credenciales de administrador en texto plano hardcodeadas** en `src/lib/app-auth.ts`: contraseña `"admin2026"` en el código fuente, comparada sin bcrypt en el endpoint `/api/app-users/auth`. Cualquier persona con acceso al repositorio tiene acceso de administrador.
- 🔴 **CRÍTICO — Cifrado XOR con llave predeterminada pública** para credenciales de clientes (DIAN, bancos, hacienda) en `src/app/api/accesos/`. Si `ENCRYPTION_KEY` no está configurada en Railway, todas las contraseñas se cifran con `"default-key"`. XOR es reversible trivialmente.
- 🟠 **ALTO — Bug de persistencia: `tipoCliente` de Persona Natural se pierde en cada recarga de página.** El campo existe solo en memoria de React; al persistir en Prisma se omite. Esto hace que el bug de "editar persona natural abre formulario de empresa" reaparezca después de cualquier reload.
- 🟠 **ALTO — Cálculo de cumplimiento distorsionado:** `cumplimiento_general_pct` divide sobre el total de `ObligacionTributaria` sin filtrar por tipo de entidad. Los registros de Personas Naturales (sin obligaciones tributarias reales) no distorsionan el numerador pero sí pueden distorsionar el denominador si tienen obligaciones asignadas.
- 🟡 **MEDIO — Log diagnóstico activo en producción** en `src/app/api/mcp/token/route.ts` imprime en cada solicitud de token qué variables de entorno MCP están presentes — visible en logs de Railway para todos los colaboradores del proyecto.

---

## 2. Arquitectura

### Stack

| Componente | Versión / Detalle |
|---|---|
| Runtime | Node.js v22.22.2 |
| Framework | Next.js 16.2.7 (App Router) |
| ORM | Prisma 7.8.0 |
| Base de datos | PostgreSQL (Railway managed, `acela.proxy.rlwy.net:29099`) |
| Hosting | Railway — servicio `Outsorsing-Andres-2`, entorno `production` |
| Autenticación web | NextAuth.js — CredentialsProvider + JWT, sesión 8h |
| Autenticación MCP | HMAC-SHA256 Bearer JWT propio + OAuth 2.0 PKCE |
| Protocolo MCP | `WebStandardStreamableHTTPServerTransport` (stateless) |

### Estructura de carpetas

```
prisma/
  schema.prisma               # Fuente de verdad del modelo de datos
  migrations/                 # 8 migraciones desde 2026-06-07
  seed.ts / runtime-seed.js   # Seed de usuarios y datos iniciales

src/
  proxy.ts                    # Middleware: allowlist pública + RBAC por rol
  lib/
    auth.ts                   # NextAuth config (bcrypt, JWT 8h)
    jose-auth.ts              # Guard para /api/jose/* (JOSE_API_KEY)
    nomina-auth.ts            # Guard para /api/nomina/* (session + dev bypass)
    app-auth.ts               # ⚠️ Auth legacy con credencial hardcodeada
    calendario-helpers.ts     # estadoEfectivo(), buildEstadoWhere(), buildDateRange()
    generar-nominas.ts        # Generación lazy de ReporteNomina
    prisma.ts                 # Singleton PrismaClient
    persist.ts                # Store JSON en disco (DATA_DIR) — solo usuarios legacy
    empresa-store.ts          # Lee store JSON — actualmente BYPASSED por app-empresas
    empresas-mock.ts          # Tipo EmpresaMock (TypeScript interface, NO es tabla Prisma)

  app/api/
    mcp/route.ts              # Servidor MCP: tools, Bearer auth, proxy a /api/jose/*
    mcp/authorize/route.ts    # OAuth authorize (PKCE)
    mcp/token/route.ts        # OAuth token (PKCE + client_credentials) ⚠️ log activo
    mcp/oauth-metadata/route.ts  # .well-known/oauth-authorization-server
    jose/dashboard/route.ts   # GET — datos para get_dashboard
    jose/empresas/route.ts    # GET — datos para get_empresas (usa Prisma directo)
    jose/nomina/route.ts      # GET — datos para get_nomina
    jose/calendario-tributario/route.ts  # GET — datos para get_calendario_tributario
    app-empresas/route.ts     # GET/PUT/DELETE — web dashboard usa Prisma directamente
    obligaciones/             # CRUD obligaciones tributarias
    nomina/                   # CRUD reportes, empleados, novedades, libranzas
    accesos/                  # CRUD credenciales ⚠️ cifrado débil
    recursos-calendario/      # Upload/download documentos de referencia (BYTEA)
```

### Endpoints MCP registrados

**Archivo:** `src/app/api/mcp/route.ts`  
**Servidor:** `"orbita-ac"` v1.0.0

| Tool | Parámetros | Handler interno |
|---|---|---|
| `get_dashboard` | ninguno | `GET /api/jose/dashboard` |
| `get_empresas` | ninguno | `GET /api/jose/empresas` |
| `get_calendario_tributario` | `empresa_id?`, `desde?`, `hasta?`, `estado?` | `GET /api/jose/calendario-tributario` |
| `get_nomina` | ninguno | `GET /api/jose/nomina` |

No existen otras tools. El módulo `Accesos` **no está expuesto** vía MCP (conforme a la restricción de seguridad establecida).

### Flujo de autenticación MCP

```
Cliente MCP → GET /api/mcp (no auth) → 401 con www-authenticate
           → GET /.well-known/oauth-authorization-server → metadata
           → GET /api/mcp/authorize?code_challenge=... → code
           → POST /api/mcp/token (PKCE) → Bearer JWT (exp: 1h)
           → POST /api/mcp/route.ts con Authorization: Bearer <token>
           → verifyBearer() valida HMAC → fetchJose() con JOSE_API_KEY
           → /api/jose/* → joseAuth() valida JOSE_API_KEY → Prisma
```

---

## 3. Modelo de Datos y Hallazgo Crítico: Empresas vs. Personas Naturales

### Schema Prisma — Modelos relevantes

#### `Empresa` (`prisma/schema.prisma` líneas 161–215)

Campos clave:
```
id              String   @id @default(cuid())
razonSocial     String
nit             String   @unique
dv              String
regimen         String?          ← ÚNICO campo que diferencia tipo de entidad
estado          EstadoEmpresa    @default(ACTIVA)
repLegalNombre  String?
repLegalCedula  String?
repLegalCorreo  String?
repLegalTelefono String?
ciudad          String?
correo          String?
telefono        String?
tipoNomina      String?
periodicidadNomina PeriodicidadNomina?
-- NO existe campo tipoCliente, es_cliente_outsourcing, ni tipo_registro
```

#### `ObligacionTributaria` (`prisma/schema.prisma` líneas 271–324)

Usa **flags booleanas como fuente de verdad** (no el enum `estado`):
```
contabilizado   Boolean  @default(false)
declarado       Boolean  @default(false)
pagado          Boolean  @default(false)
noAplica        Boolean  @default(false)
estado          EstadoObligacion  ← puede estar desactualizado (stale)
```

No existe tabla `reportes_tributarios`. Las obligaciones tributarias viven en `ObligacionTributaria`. Los reportes de nómina viven en `ReporteNomina`.

### Hallazgo crítico: clasificación empresa vs. persona natural

**Situación actual:**

La tabla `Empresa` en Prisma NO tiene un campo `tipoCliente` o equivalente. La única distinción posible entre empresa jurídica y persona natural es `regimen = "Persona Natural"`.

El campo `tipoCliente?: "empresa" | "persona_natural"` **existe solo en la interfaz TypeScript** `EmpresaMock` (`src/lib/empresas-mock.ts`) pero **nunca se persiste a la base de datos**.

**Flujo de la persona natural al guardar (BUG CRÍTICO):**

```
1. Usuario crea persona natural → handlePnSave() en empresas/page.tsx
   → añade { tipoCliente: "persona_natural", regimen: "Persona Natural", ... }
   al estado local de React

2. La página llama PUT /api/app-empresas con el array completo

3. app-empresas/route.ts → toPrismaData() mapea los campos a Prisma
   → toPrismaData() NO incluye tipoCliente
   → Prisma upsert con { regimen: "Persona Natural" } ← único rastro

4. Al recargar la página:
   GET /api/app-empresas → prisma.empresa.findMany()
   → toEmpresaMock() NO setea tipoCliente
   → todos los registros tienen tipoCliente: undefined

5. openEdit() chequea empresa.tipoCliente === "persona_natural"
   → undefined !== "persona_natural" → FALSO
   → SIEMPRE abre EmpresaFormModal, incluso para personas naturales
```

**Consecuencia:** El bug de "editar persona natural abre formulario de empresa" **reaparece en cada recarga de página**. El fix implementado en sesión anterior (chequear `tipoCliente` en `openEdit()`) funciona solo mientras el componente no se desmonta.

**Solución correcta (sin perder datos):**

Opción A (más simple, sin migración Prisma):  
En `toEmpresaMock()` en `src/app/api/app-empresas/route.ts`, derivar `tipoCliente` del campo `regimen`:
```typescript
tipoCliente: e.regimen === "Persona Natural" ? "persona_natural" : "empresa",
```

Opción B (correcta a largo plazo):  
Agregar `tipoCliente` al schema Prisma como campo String con default `"empresa"`, incluirlo en `toPrismaData()` y `toEmpresaMock()`. Requiere migración.

**Diagnóstico de los 16 registros en `get_empresas`:**

El endpoint MCP `get_empresas` consulta `prisma.empresa.findMany()` directamente y devuelve todos los registros activos. Para identificar qué registros son personas naturales, ejecutar en el Data tab de Railway:
```sql
SELECT "razonSocial", "nit", "regimen", "correo", "telefono"
FROM "Empresa"
ORDER BY "regimen", "razonSocial";
```
Los registros con `regimen = 'Persona Natural'` son los candidatos a reclasificar.

**¿Deben existir en la tabla Empresa?**  
Si son representantes legales o contactos, deberían estar en `repLegalNombre/correo/telefono` de la empresa jurídica correspondiente. Si son clientes del outsourcing en su calidad de persona natural (ej. persona natural con obligaciones tributarias propias), sí corresponde que estén como `Empresa` con `regimen = "Persona Natural"`. Esta decisión de negocio está abierta — ver Sección 10.

---

## 4. Dashboard y Cálculo de Cumplimiento

**Archivo:** `src/app/api/jose/dashboard/route.ts`

### Fórmula exacta de `cumplimiento_general_pct` (líneas 62–79)

```typescript
const totalObligaciones    = await prisma.obligacionTributaria.count()
const obligacionesCumplidas = await prisma.obligacionTributaria.count({ where: { pagado: true } })

cumplimiento_general_pct = totalObligaciones > 0
  ? Math.round((obligacionesCumplidas / totalObligaciones) * 1000) / 10
  : 100
```

**Problemas identificados:**

1. **No filtra por tipo de empresa ni por régimen.** Incluye obligaciones de personas naturales con `regimen = "Persona Natural"` si estas tienen `ObligacionTributaria` asignadas.

2. **Criterio de "cumplida" = `pagado: true` solamente.** Una obligación que fue `declarada` pero no `pagada` cuenta como no cumplida. Puede subestimar el cumplimiento según el criterio contable del negocio.

3. **Denominador incluye `noAplica: true`.** Las obligaciones marcadas como "No Aplica" reducen el porcentaje porque están en el denominador pero no en el numerador (`pagado = false`).

**Corrección recomendada:**

```typescript
// Excluir noAplica del denominador y numerador
const totalObligaciones = await prisma.obligacionTributaria.count({
  where: { noAplica: false }
})
const obligacionesCumplidas = await prisma.obligacionTributaria.count({
  where: { pagado: true, noAplica: false }
})
```

**Divergencia con el dashboard web:**  
`/api/dashboard/stats/route.ts` línea 57–59 calcula `obligacionesCumplidas` usando `estado in ["PRESENTADO", "PAGADO"]` (el enum potencialmente stale). El dashboard web y el MCP pueden mostrar porcentajes diferentes para el mismo dataset.

---

## 5. Nómina — Bug de Cero Empleados Activos

**Archivo:** `src/app/api/jose/nomina/route.ts`

### Lógica del conteo de empleados (líneas 54–59)

```typescript
prisma.empleado.groupBy({
  by: ["empresaId"],
  where: { activo: true },
  _count: { id: true },
})
```

Los resultados se mapean en `empleadosMap` (Map por `empresaId`). Para cada reporte, se usa `empleadosMap.get(r.empresaId) ?? 0`.

### Causa del bug: cero empleados en Centro Naturista Soy Vida y Distribuciones Sanat

**Hipótesis A (más probable):** Los registros en `Empleado` no existen o fueron creados con `activo: false`. La consulta filtra solo `activo: true`, por lo que si todos los empleados tienen `activo = false`, el conteo devuelve 0.

**Hipótesis B:** Los reportes de nómina para esas empresas existen (los reportes son el objeto `ReporteNomina`), pero los empleados fueron registrados bajo un `empresaId` diferente al de la empresa que tiene el reporte.

**Hipótesis C:** `tiene_nomina: true` en `get_empresas` se deriva de si la empresa tiene una `ObligacionTributaria` con tipo `"Nómina"` o `"Nómina Electrónica"` — no del campo `tipoNomina` de la tabla `Empresa`. Si los empleados no tienen `ObligacionTributaria` de nómina asignada, `tiene_nomina` devuelve `true` pero `empleados_activos` devuelve 0 desde `Empleado`.

**Diagnóstico recomendado (ejecutar en Railway Data):**

```sql
-- Verificar empleados para esas empresas
SELECT e."nombre", e."activo", emp."razonSocial"
FROM "Empleado" e
JOIN "Empresa" emp ON e."empresaId" = emp."id"
WHERE emp."razonSocial" ILIKE '%naturista%' OR emp."razonSocial" ILIKE '%sanat%';

-- Verificar reportes de nómina
SELECT rn."estado", rn."mes", rn."año", emp."razonSocial"
FROM "ReporteNomina" rn
JOIN "Empresa" emp ON rn."empresaId" = emp."id"
WHERE emp."razonSocial" ILIKE '%naturista%' OR emp."razonSocial" ILIKE '%sanat%';
```

---

## 6. Reportes Tributarios en Estado Draft (Borrador) Persistente

**No existe tabla `reportes_tributarios`** ni columna `estado_workflow` en Prisma.

Los conceptos relevantes son:
- **`ObligacionTributaria`** — para obligaciones fiscales/tributarias
- **`ReporteNomina`** — para reportes de nómina; estado: `EstadoReporteNomina` enum

### Por qué los reportes quedan en BORRADOR

**Archivo:** `src/lib/generar-nominas.ts` línea 108

```typescript
// Creación inicial siempre en BORRADOR
estado: EstadoReporteNomina.BORRADOR
```

El `ReporteNomina` se crea automáticamente en BORRADOR al inicio de cada período (a través de `generarReportesParaEmpresa()`, llamado desde `app-empresas PUT`). Avanza de estado solo cuando el contador lo envía explícitamente vía la API de estado (`/api/nomina/reportes/[id]/estado`).

**Las transiciones de estado válidas** (`src/app/api/nomina/reportes/[id]/estado/route.ts`):
```
BORRADOR → ENVIADA (el contador envía)
ENVIADA → REVISADA (el admin revisa)
REVISADA → APROBADA (el admin aprueba)
APROBADA → REABIERTA (se necesita corrección)
REABIERTA → CORREGIDA
CORREGIDA → APROBADA
```

Un reporte queda "eternamente en borrador" si el flujo no se inicia — es decir, si nadie presiona "Enviar para revisión" en la UI de nómina. Esto no es un bug del sistema, sino un indicador de que el flujo operativo de esas empresas no ha sido ejecutado para el período actual.

**Verificar estado actual (Railway Data):**
```sql
SELECT emp."razonSocial", rn."estado", rn."mes", rn."año", rn."sinNovedades"
FROM "ReporteNomina" rn
JOIN "Empresa" emp ON rn."empresaId" = emp."id"
ORDER BY rn."año" DESC, rn."mes" DESC;
```

---

## 7. OAuth y Estabilidad de Sesión

### Configuración NextAuth (`src/lib/auth.ts`)

- **Proveedor:** Solo `CredentialsProvider` (email + bcrypt)
- **Duración de sesión:** JWT `maxAge: 8 * 60 * 60` (8 horas), línea 72
- **Por qué requiere reautenticación manual frecuente:** El token JWT expira a las 8 horas sin renovación automática. NextAuth no implementa sliding sessions por defecto con CredentialsProvider.
- **NEXTAUTH_SECRET:** Requerida en Railway. Si no está configurada, NextAuth usa un secreto generado aleatoriamente en cada arranque — cualquier deploy invalida todas las sesiones activas.

### MCP OAuth (`src/app/api/mcp/`)

- **Token MCP:** HMAC-SHA256 Bearer, duración `exp: now + 3600` (1 hora), línea 16 de `token/route.ts`
- **Flujo soportado:** `authorization_code` (PKCE) y `client_credentials`
- **Metadata URL:** `/.well-known/oauth-authorization-server` — reescrita desde `/api/mcp/oauth-metadata` vía `next.config.ts`

### Problema de Multi-Instancia: OAuth Codes en Memoria

**Archivo:** `src/lib/mcp-codes.ts`

```typescript
const store = new Map<string, CodeEntry>()  // línea 14 — en memoria del proceso
```

Los códigos de autorización PKCE viven en RAM del proceso Node.js. Si Railway escala a más de una instancia, el `authorize` y el `token` pueden llegar a réplicas distintas → `"invalid_grant"`. Actualmente Railway corre con una sola instancia, lo que mitiga esto, pero no es garantía en redeploys con zero-downtime overlap.

### Variables de entorno requeridas en Railway

| Variable | Propósito | Consecuencia si falta |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | App no arranca |
| `NEXTAUTH_SECRET` | JWT signing | Sesiones inválidas en cada deploy |
| `JOSE_API_KEY` | Auth server-to-server MCP→José | MCP devuelve 401 en todas las tools |
| `MCP_CLIENT_ID` | OAuth client ID | Token endpoint devuelve 500 |
| `MCP_CLIENT_SECRET` | OAuth secret + HMAC key | Token endpoint devuelve 500 |
| `ENCRYPTION_KEY` | Cifrado de contraseñas en Accesos | Fallback a `"default-key"` — CRÍTICO |
| `INTERNAL_BASE_URL` | Base URL para fetchJose() | Usa `localhost:3000` — puede fallar en Railway |
| `NEXT_PUBLIC_BASE_URL` | URL pública OAuth metadata | URLs relativas rompen flujo OAuth |

**Nota importante:** Guardar variables en Railway **NO dispara redeploy automático**. Se requiere redeploy manual o nuevo push para que las variables activas sean visibles en producción.

---

## 8. Seguridad

### 🔴 CRÍTICO — Credenciales admin hardcodeadas en texto plano

**Archivo:** `src/lib/app-auth.ts`, líneas 30–38

```typescript
export const DEFAULT_ADMIN: AppUser = {
  id: "admin-1",
  email: "admin@contaflow.co",
  password: "admin2026",    // TEXTO PLANO — expuesto en el repositorio
  role: "admin",
  ...
};
```

Este objeto alimenta `user-store.ts` y el endpoint `/api/app-users/auth/route.ts` compara contraseñas con igualdad de strings (`u.password === password`, línea 13). Sistema paralelo a NextAuth, sin bcrypt, sin rate limiting.

### 🔴 CRÍTICO — Cifrado XOR con llave pública como fallback

**Archivos:** `src/app/api/accesos/route.ts` y `src/app/api/accesos/[id]/route.ts`, línea 7 en ambos

```typescript
const key = process.env.ENCRYPTION_KEY || "default-key"  // fallback conocido
// Cifrado XOR — reversible trivialmente
```

Las contraseñas almacenadas en `Acceso.contrasena` corresponden a credenciales reales de clientes del outsourcing (DIAN, bancos, hacienda municipal). XOR no es cifrado real — es una transformación reversible deterministicamente por cualquiera que lea la BD.

### 🟠 ALTO — Comparación de contraseñas sin bcrypt

**Archivo:** `src/app/api/app-users/auth/route.ts`, línea 13

```typescript
u.password === password  // sin bcrypt, sin salt, sin rate limiting
```

Sin límite de intentos. El endpoint es accesible sin sesión (cualquier request POST).

### 🟡 MEDIO — Bypass de autenticación en modo no-producción

**Archivo:** `src/lib/nomina-auth.ts`, líneas 16–29

```typescript
if (process.env.NODE_ENV === "development") {
  const devUserId = hdrs.get("x-dev-user-id")
  const devUserRole = hdrs.get("x-dev-user-role")
  if (devUserId && devUserRole) return { userId, role, empresaIds: [] }
  // Acceso total sin autenticación
}
```

Si Railway tiene algún entorno de staging con `NODE_ENV !== "production"`, cualquier cliente que pueda enviar esos headers tiene acceso sin restricciones a todos los endpoints de nómina.

### 🟡 MEDIO — Log diagnóstico activo en producción

**Archivo:** `src/app/api/mcp/token/route.ts`, líneas 47–51

```typescript
// TEMP DIAGNOSTIC — remove after confirming env vars are visible in Railway
console.log("[mcp/token] MCP env keys visible:", JSON.stringify(
  Object.keys(process.env).filter(k => k.includes("MCP"))
))
console.log("[mcp/token] MCP_CLIENT_ID present:", !!expectedId, "| MCP_CLIENT_SECRET present:", !!expectedSecret)
```

Se ejecuta en CADA solicitud de token MCP. Visible en logs de Railway para todos los colaboradores. Confirmado como temporal pero no removido.

### 🟡 MEDIO — `get_empresas` y `get_nomina` no exponen contraseñas

Confirmado: el endpoint `/api/jose/empresas/route.ts` usa `select` explícito que excluye `repLegal*`, contraseñas, `actividadEconomica` y cualquier campo sensible. El endpoint de nómina tampoco expone credenciales. La restricción del módulo Accesos vía MCP está correctamente implementada.

### 🟢 Bajo — Fallback de DB URL en seed.ts

**Archivo:** `prisma/seed.ts`, línea 11

```typescript
connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/outsorsing_db'
```

Credenciales de base de datos local hardcodeadas como fallback. Riesgo solo en ambientes CI/CD sin `DATABASE_URL` configurada.

### 🟢 Bajo — Store OAuth en memoria (riesgo multi-instancia)

Ver Sección 7. Bajo riesgo en la configuración actual de Railway con single-instance.

### 🟢 Bajo — GET `/api/accesos` sin verificación de sesión propia

El handler GET en `src/app/api/accesos/route.ts` no verifica sesión internamente; depende del middleware `proxy.ts`. El middleware permite `/api/*` para rol `cliente`, lo que significa que un usuario con rol `CLIENT` podría listar metadatos de accesos (nombres de plataformas, usuarios — sin contraseñas) de todas las empresas, no solo las suyas.

---

## 9. Recomendaciones Priorizadas

| # | Prioridad | Problema | Archivo(s) afectado(s) | Esfuerzo | Riesgo si no se corrige |
|---|---|---|---|---|---|
| 1 | 🔴 CRÍTICO | Credencial admin en texto plano + comparación sin bcrypt | `src/lib/app-auth.ts`, `src/app/api/app-users/auth/route.ts` | 2h | Compromiso total de la aplicación |
| 2 | 🔴 CRÍTICO | Cifrado XOR fallback conocido en credenciales de clientes | `src/app/api/accesos/route.ts`, `src/app/api/accesos/[id]/route.ts` | 4h | Exposición de credenciales reales (DIAN, bancos) |
| 3 | 🟠 ALTO | `tipoCliente` de Persona Natural no persiste → bug reaparece en reload | `src/app/api/app-empresas/route.ts` (toEmpresaMock) | 30min | UX rota, datos de Persona Natural editados como Empresa |
| 4 | 🟠 ALTO | Separación clasificación clientes: campo derivado de `regimen` | `src/lib/empresas-mock.ts`, `src/app/api/app-empresas/route.ts` | 1h | Imposible distinguir cliente outsourcing vs contacto vs persona natural |
| 5 | 🟡 MEDIO | Log diagnóstico en producción | `src/app/api/mcp/token/route.ts:47-51` | 5min | Filtración de info de entorno en cada autenticación MCP |
| 6 | 🟡 MEDIO | `cumplimiento_general_pct` incluye `noAplica` en denominador | `src/app/api/jose/dashboard/route.ts:62-65` | 30min | Indicador subdeclara cumplimiento real |
| 7 | 🟡 MEDIO | Dashboard web vs MCP calculan cumplimiento con criterios distintos | `src/app/api/dashboard/stats/route.ts:57-59` | 1h | José y el dashboard muestran % diferentes para el mismo mes |
| 8 | 🟡 MEDIO | NEXTAUTH_SECRET variable crítica — redeploy sin ella invalida sesiones | Variables Railway | 15min | Usuarios forzados a re-login en cada deploy |
| 9 | 🟡 MEDIO | OAuth code store en memoria | `src/lib/mcp-codes.ts` | 4h | Falla intermitente de autenticación MCP en multi-instancia |
| 10 | 🟢 BAJO | Acceso GET `/api/accesos` sin filtro por empresa del usuario | `src/app/api/accesos/route.ts:56+` | 1h | Rol CLIENT puede ver metadatos de todas las empresas |

---

## 10. Preguntas Abiertas para Andrés

Estas decisiones no pueden resolverse con el código — requieren definición de negocio:

1. **¿Qué es una "Persona Natural" en el contexto del outsourcing?**  
   ¿Es un cliente propio del servicio contable (con sus propias obligaciones tributarias), o es el representante legal de una empresa jurídica? La respuesta determina si deben existir en la tabla `Empresa` o en `repLegalNombre/correo/telefono`.

2. **¿Las 10 personas naturales en la BD son clientes reales del outsourcing?**  
   Si varios comparten correo o teléfono con una empresa jurídica, probablemente sean representantes legales mal registrados como empresas. ¿Se deben migrar sus datos a los campos `repLegal*` de la empresa correspondiente y eliminar el registro duplicado?

3. **¿Qué criterio define "obligación cumplida" para el indicador de cumplimiento?**  
   ¿Solo `pagado = true`? ¿O `declarado = true` también cuenta como cumplida (presentada ante la DIAN aunque sin pago)? Esto cambia el porcentaje directamente.

4. **¿Las obligaciones marcadas como `noAplica` deben excluirse del cálculo de cumplimiento?**  
   Actualmente bajan el porcentaje porque están en el denominador pero no en el numerador.

5. **¿Qué empresas tienen nómina real activa?**  
   Para confirmar si el bug de "cero empleados" en Centro Naturista Soy Vida y Distribuciones Sanat es un problema de datos (empleados no ingresados en el sistema) o un bug de lógica en la consulta.

6. **¿La sesión OAuth de José (MCP) debe durar más de 1 hora?**  
   Actualmente el token MCP expira en 60 minutos. Si la sesión de trabajo de José es más larga, se desconectará periódicamente. ¿Se acepta este comportamiento o se debe ampliar el TTL?

---

*Dictamen generado mediante análisis estático del código fuente. Ningún dato fue modificado. Ninguna consulta fue ejecutada directamente en la base de datos de producción.*
