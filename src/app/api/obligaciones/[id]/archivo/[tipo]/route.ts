import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string; tipo: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id, tipo } = await context.params

  if (tipo !== "contabilizado" && tipo !== "declarado") {
    return NextResponse.json({ error: "tipo debe ser 'contabilizado' o 'declarado'" }, { status: 400 })
  }

  const obligacion = await prisma.obligacionTributaria.findUnique({
    where: { id },
    select:
      tipo === "contabilizado"
        ? {
            contabilizadoArchivoData: true,
            contabilizadoArchivoNombre: true,
            contabilizadoArchivoTipo: true,
          }
        : {
            declaradoArchivoData: true,
            declaradoArchivoNombre: true,
            declaradoArchivoTipo: true,
          },
  })

  if (!obligacion) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const data =
    tipo === "contabilizado"
      ? (obligacion as any).contabilizadoArchivoData
      : (obligacion as any).declaradoArchivoData

  const nombre =
    tipo === "contabilizado"
      ? (obligacion as any).contabilizadoArchivoNombre
      : (obligacion as any).declaradoArchivoNombre

  const mimeType =
    tipo === "contabilizado"
      ? (obligacion as any).contabilizadoArchivoTipo
      : (obligacion as any).declaradoArchivoTipo

  if (!data) return NextResponse.json({ error: "Sin archivo adjunto" }, { status: 404 })

  const buffer = Buffer.from(data, "base64")
  const contentType = mimeType ?? "application/octet-stream"
  const filename = encodeURIComponent(nombre ?? "archivo")

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.length),
    },
  })
}
