import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

function mapRoleToApp(role: UserRole): "admin" | "contador" | "cliente" {
  if (role === UserRole.ADMIN) return "admin";
  if (role === UserRole.CLIENT) return "cliente";
  return "contador";
}

function mapRoleToPrisma(role: string): UserRole {
  if (role === "admin") return UserRole.ADMIN;
  if (role === "cliente") return UserRole.CLIENT;
  return UserRole.ANALYST;
}

function toApiUser(user: { id: string; name: string; email: string; role: UserRole; isActive: boolean; createdAt: Date }, empresaIds: string[]) {
  return {
    id: user.id,
    nombre: user.name,
    email: user.email,
    role: mapRoleToApp(user.role),
    empresaIds,
    activo: user.isActive,
    creadoEn: user.createdAt.toISOString().split("T")[0],
  };
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { empresas: { select: { empresaId: true } } },
    });
    return NextResponse.json(
      users.map((u) => toApiUser(u, u.empresas.map((e) => e.empresaId)))
    );
  } catch (err) {
    console.error("[app-users GET]", err);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, role, empresaIds, activo } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const normalized = (email as string).trim().toLowerCase();
    const dup = await prisma.user.findUnique({ where: { email: normalized } });
    if (dup) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: nombre,
        email: normalized,
        password: hash,
        role: mapRoleToPrisma(role ?? "cliente"),
        isActive: activo ?? true,
      },
    });

    if (Array.isArray(empresaIds) && empresaIds.length > 0) {
      await prisma.usuarioEmpresa.createMany({
        data: empresaIds.map((empresaId: string) => ({ userId: user.id, empresaId })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[app-users POST]", err);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, nombre, email, password, role, empresaIds, activo } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const normalized = (email as string).trim().toLowerCase();

    // Check email uniqueness (excluding self)
    const dup = await prisma.user.findFirst({
      where: { email: normalized, NOT: { id } },
    });
    if (dup) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }

    // Hash new password if provided, otherwise keep existing
    const newPassword = password
      ? await bcrypt.hash(password, 10)
      : existing.password;

    await prisma.user.update({
      where: { id },
      data: {
        name: nombre,
        email: normalized,
        password: newPassword,
        // Admin role is protected — cannot be changed
        role: existing.role === UserRole.ADMIN ? UserRole.ADMIN : mapRoleToPrisma(role ?? "cliente"),
        isActive: activo ?? existing.isActive,
      },
    });

    // Sync empresa assignments (admins keep all access, so skip)
    if (existing.role !== UserRole.ADMIN) {
      await prisma.usuarioEmpresa.deleteMany({ where: { userId: id } });
      if (Array.isArray(empresaIds) && empresaIds.length > 0) {
        await prisma.usuarioEmpresa.createMany({
          data: empresaIds.map((empresaId: string) => ({ userId: id, empresaId })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[app-users PUT]", err);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    if (user.role === UserRole.ADMIN) {
      return NextResponse.json({ error: "No se puede eliminar al admin" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[app-users DELETE]", err);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
