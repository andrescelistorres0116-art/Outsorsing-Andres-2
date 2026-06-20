import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { joseAuth } from "@/lib/jose-auth"

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
        tipoNomina: true,
        obligadoFacturar: true,
        agenteRetenedor: true,
        responsabilidadIva: true,
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
        tiene_nomina: !!e.tipoNomina,
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
