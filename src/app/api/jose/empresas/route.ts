import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { joseAuth } from "@/lib/jose-auth"
import { TIPOS_NOMINA } from "@/lib/calendario-helpers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const denied = joseAuth(request)
  if (denied) return denied

  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { razonSocial: "asc" },
      select: {
        id: true,
        razonSocial: true,
        nit: true,
        regimen: true,
        estado: true,
        ciudad: true,
        correo: true,
        telefono: true,
        obligadoFacturar: true,
        agenteRetenedor: true,
        responsabilidadIva: true,
        // Derive tiene_nomina from obligations, not the static tipoNomina field.
        obligaciones: {
          where: { tipoObligacion: { in: [...TIPOS_NOMINA] } },
          select: { id: true },
          take: 1,
        },
      },
    })

    return NextResponse.json({
      total: empresas.length,
      empresas: empresas.map((e) => ({
        id: e.id,
        razon_social: e.razonSocial,
        nit: e.nit,
        regimen: e.regimen ?? null,
        estado: e.estado === "ACTIVA" ? "activa" : "inactiva",
        ciudad: e.ciudad ?? null,
        correo: e.correo ?? null,
        telefono: e.telefono ?? null,
        tiene_nomina: e.obligaciones.length > 0,
        obligado_facturar: e.obligadoFacturar ?? false,
        agente_retenedor: e.agenteRetenedor ?? false,
        responsabilidad_iva: e.responsabilidadIva ?? null,
      })),
    })
  } catch (e) {
    console.error("[jose/empresas]", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
