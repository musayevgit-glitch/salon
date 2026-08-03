import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/server/authorization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PostLogin() {
  const user = await requireAuthenticatedUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { globalRole: true } });
  if (dbUser?.globalRole === "SUPER_ADMIN") redirect("/superadmin");
  const membership = await prisma.membership.findFirst({ where: { userId: user.id, active: true }, select: { role: true } });
  if (membership?.role === "SALON_ADMIN") redirect("/salonadmin");
  if (membership?.role === "SALON_MANAGER") redirect("/salonmanager");
  redirect("/");
}
