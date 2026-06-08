import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { EmpresaMock } from "@/lib/empresas-mock"
import { PeriodicidadNomina } from "@prisma/client"
import { generarReportesParaEmpresa, mesActual } from "@/lib/generar-nominas"

export const dynamic = "force-dynamic"

function toEmpresaMock(e: {
  id: string; razonSocial: string; nit: string; ciudad: string | null;
  departamento: string | null; regimen: string | null; estado: string;
  repLegalNombre: string | null; telefono: string | null; correo: string | null;
  createdAt: Date; nombreComercial: string | null; direccion: string | null;
  repLegalCedula: string | null; repLegalCorreo: string | null;
  repLegalTelefono: string | null; responsabilidadIva: string | null;
  obligadoFacturar: boolean; actividadEconomica: string | null;
  tipoContribuyente: string | null; agenteRetenedor: boolean;
  tipoNomina: string | null; periodicidadNomina: string | null;
  softwareContable: string | null;
}): EmpresaMock {
  return {
    id: e.id,
    razonSocial: e.razonSocial,
    nit: e.nit,
    ciudad: e.ciudad ?? "",
    departamento: e.departamento ?? "",
    regimen: e.regimen ?? "",
    estado: e.estado as "ACTIVA" | "INACTIVA",
    representante: e.repLegalNombre ?? "",
    telefono: e.telefono ?? "",
    correo: e.correo ?? "",
    fechaInicioRelacion: e.createdAt.toISOString().split("T")[0],
    nombreComercial: e.nombreComercial ?? undefined,
    direccion: e.direccion ?? undefined,
    repCedula: e.repLegalCedula ?? undefined,
    repCorreo: e.repLegalCorreo ?? undefined,
    repTelefono: e.repLegalTelefono ?? undefined,
    responsabilidadIVA: e.responsabilidadIva ?? undefined,
    obligadoFacturar: e.obligadoFacturar,
    actividadEconomica: e.actividadEconomica ?? undefined,
    tipoContribuyente: e.tipoContribuyente ?? undefined,
    agenteRetenedor: e.agenteRetenedor,
    tipoNomina: e.tipoNomina ?? undefined,
    periodicidadNomina: e.periodicidadNomina?.toLowerCase() ?? undefined,
    softwareContable: e.softwareContable ?? undefined,
  }
}

function toPrismaData(e: EmpresaMock) {
  const periMap: Record<string, PeriodicidadNomina> = {
    quincenal: PeriodicidadNomina.QUINCENAL,
    mensual: PeriodicidadNomina.MENSUAL,
  }
  return {
    razonSocial: e.razonSocial,
    dv: "0",
    ciudad: e.ciudad || null,
    departamento: e.departamento || null,
    regimen: e.regimen || null,
    estado: (e.estado === "INACTIVA" ? "INACTIVA" : "ACTIVA") as "ACTIVA" | "INACTIVA",
    repLegalNombre: e.representante || null,
    telefono: e.telefono || null,
    correo: e.correo || null,
    nombreComercial: e.nombreComercial || null,
    direccion: e.direccion || null,
    repLegalCedula: e.repCedula || null,
    repLegalCorreo: e.repCorreo || null,
    repLegalTelefono: e.repTelefono || null,
    responsabilidadIva: e.responsabilidadIVA || null,
    obligadoFacturar: e.obligadoFacturar ?? false,
    actividadEconomica: e.actividadEconomica || null,
    tipoContribuyente: e.tipoContribuyente || null,
    agenteRetenedor: e.agenteRetenedor ?? false,
    tipoNomina: e.tipoNomina || null,
    periodicidadNomina: e.periodicidadNomina
      ? periMap[e.periodicidadNomina.toLowerCase()] ?? null
      : null,
    softwareContable: e.softwareContable || null,
  }
}

export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { razonSocial: "asc" },
    })
    return NextResponse.json(empresas.map(toEmpresaMock))
  } catch (err) {
    console.error("[app-empresas GET]", err)
    return NextResponse.json([])
  }
}

export async function PUT(req: NextRequest) {
  try {
    const list: EmpresaMock[] = await req.json()
    if (!Array.isArray(list)) {
      return NextResponse.json({ error: "Array expected" }, { status: 400 })
    }

    const { mes, año } = mesActual()

    for (const empresa of list) {
      if (!empresa.nit) continue
      const saved = await prisma.empresa.upsert({
        where: { nit: empresa.nit },
        create: { nit: empresa.nit, ...toPrismaData(empresa) },
        update: toPrismaData(empresa),
      })

      // Si la empresa está activa y tiene periodicidad, generar reportes del mes actual
      if (saved.periodicidadNomina && saved.estado === "ACTIVA") {
        generarReportesParaEmpresa(saved.id, saved.periodicidadNomina, mes, año)
          .catch((e) => console.error("[app-empresas PUT] Error al generar reportes:", e?.message))
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[app-empresas PUT]", err)
    return NextResponse.json({ error: "Error saving" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, nit } = await req.json()
    if (id && !id.startsWith("new-") && !id.startsWith("temp-")) {
      await prisma.empresa.delete({ where: { id } }).catch(() => {})
    } else if (nit) {
      await prisma.empresa.delete({ where: { nit } }).catch(() => {})
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[app-empresas DELETE]", err)
    return NextResponse.json({ error: "Error deleting" }, { status: 500 })
  }
}
