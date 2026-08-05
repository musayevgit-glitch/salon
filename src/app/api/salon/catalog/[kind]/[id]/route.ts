import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantMembership } from "@/server/authorization";
import { prisma } from "@/lib/prisma";
import { MAX_PORTFOLIO_IMAGES } from "@/lib/portfolio";

const service = z.object({
  name: z.string().min(2).optional(),
  priceCents: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(15).optional(),
  bufferMinutes: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const provider = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
  // Full ordered replacement of the specialist's portfolio gallery (max 10 photos).
  // When present, the array order becomes the stored `position`, and the first entry
  // is kept in sync with Provider.imageUrl (the cover/avatar convenience field).
  images: z.array(z.string().trim().url().max(2048)).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  try {
    const { salon } = await requireTenantMembership(["SALON_ADMIN"]);
    const { kind, id } = await params;
    const raw = await request.json();

    if (kind === "services") {
      const data = service.parse(raw);
      const row = await prisma.service.updateMany({ where: { id, salonId: salon.id }, data });
      if (!row.count) throw new Error("SERVICE_NOT_FOUND");
    } else if (kind === "providers") {
      const { images, ...rest } = provider.parse(raw);
      if (images && images.length > MAX_PORTFOLIO_IMAGES) {
        return NextResponse.json({ code: "TOO_MANY_PORTFOLIO_IMAGES" }, { status: 400 });
      }
      const owned = await prisma.provider.findFirst({ where: { id, salonId: salon.id }, select: { id: true } });
      if (!owned) throw new Error("PROVIDER_NOT_FOUND");

      await prisma.$transaction(async (tx) => {
        await tx.provider.update({
          where: { id },
          data: { ...rest, ...(images ? { imageUrl: images[0] ?? null } : {}) },
        });
        if (images) {
          await tx.providerImage.deleteMany({ where: { providerId: id } });
          if (images.length) {
            await tx.providerImage.createMany({
              data: images.map((url, position) => ({ providerId: id, url, position })),
            });
          }
        }
      });
    } else {
      throw new Error("INVALID_CATALOG_KIND");
    }

    await prisma.auditLog.create({ data: { salonId: salon.id, action: `CATALOG_${kind.toUpperCase()}_UPDATED`, targetType: kind, targetId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ code: error instanceof Error ? error.message : "CATALOG_UPDATE_FAILED" }, { status: 400 });
  }
}
