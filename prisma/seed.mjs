import { PrismaClient, GlobalRole, MembershipRole } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();
const localPassword = "Salonomia-Local-Only-1!";

async function upsertUser(email, name, globalRole = GlobalRole.CUSTOMER) {
  const password = await hashPassword(localPassword);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, globalRole, emailVerified: true },
    create: { name, email, emailVerified: true, globalRole },
  });
  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: "credential", accountId: email } },
    update: { userId: user.id, password },
    create: { accountId: email, providerId: "credential", password, userId: user.id },
  });
  return user;
}

async function main() {
  const superAdmin = await upsertUser("superadmin@salonomia.local", "Platform Super Admin", GlobalRole.SUPER_ADMIN);
  const salonAdmin = await upsertUser("salonadmin@salonomia.local", "Salon Admin");
  const salonManager = await upsertUser("salonmanager@salonomia.local", "Salon Manager");
  await upsertUser("customer@salonomia.local", "Demo Customer");
  const salon = await prisma.salon.upsert({
    where: { slug: "lilac-studio" }, update: {},
    create: { slug: "lilac-studio", name: "Lilac Beauty Studio", description: "Saç, dırnaq və gündəlik gözəllik xidmətləri üçün zərif məkan.", address: "Nizami küçəsi 102", city: "Bakı", phone: "+994 50 555 11 22", imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80" },
  });
  await prisma.membership.upsert({ where: { userId_salonId: { userId: salonAdmin.id, salonId: salon.id } }, update: { role: MembershipRole.SALON_ADMIN }, create: { userId: salonAdmin.id, salonId: salon.id, role: MembershipRole.SALON_ADMIN } });
  await prisma.membership.upsert({ where: { userId_salonId: { userId: salonManager.id, salonId: salon.id } }, update: { role: MembershipRole.SALON_MANAGER }, create: { userId: salonManager.id, salonId: salon.id, role: MembershipRole.SALON_MANAGER } });
  await prisma.membership.upsert({ where: { userId_salonId: { userId: superAdmin.id, salonId: salon.id } }, update: { role: MembershipRole.SALON_ADMIN }, create: { userId: superAdmin.id, salonId: salon.id, role: MembershipRole.SALON_ADMIN } });
  const service = await prisma.service.upsert({ where: { id: "cm00000000000000000000001" }, update: {}, create: { id: "cm00000000000000000000001", salonId: salon.id, name: "Saç kəsimi və fen", description: "Konsultasiya, forma və fen", durationMinutes: 60, bufferMinutes: 15, priceCents: 4500 } });
  const provider = await prisma.provider.upsert({ where: { id: "cm00000000000000000000002" }, update: {}, create: { id: "cm00000000000000000000002", salonId: salon.id, name: "Aylin Məmmədova", bio: "Saç rəngi və müasir kəsim üzrə mütəxəssis." } });
  await prisma.providerService.upsert({ where: { providerId_serviceId: { providerId: provider.id, serviceId: service.id } }, update: {}, create: { providerId: provider.id, serviceId: service.id } });
  for (let weekday = 1; weekday <= 6; weekday++) {
    await prisma.businessHour.upsert({ where: { salonId_weekday: { salonId: salon.id, weekday } }, update: {}, create: { salonId: salon.id, weekday, opensAt: "10:00", closesAt: "20:00" } });
    await prisma.providerHour.upsert({ where: { providerId_weekday: { providerId: provider.id, weekday } }, update: {}, create: { providerId: provider.id, weekday, startsAt: "10:00", endsAt: "19:00" } });
  }
  const demos = [
    { slug: "velvet-nail-bar", name: "Velvet Nail Bar", city: "Bakı", address: "Füzuli küçəsi 64", phone: "+994 55 221 44 66", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80", service: ["Gel manikür", 90, 3500], providers: ["Nərgiz Əliyeva", "Lalə Quliyeva"] },
    { slug: "muse-hair-lounge", name: "Muse Hair Lounge", city: "Bakı", address: "Səməd Vurğun 45", phone: "+994 50 444 21 10", imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80", service: ["Saç rəngləmə", 150, 11000], providers: ["Rəna Həsənova", "Kamran Hüseynli"] },
    { slug: "glow-makeup-studio", name: "Glow Makeup Studio", city: "Bakı", address: "Xaqani küçəsi 18", phone: "+994 70 333 81 11", imageUrl: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=900&q=80", service: ["Gecə makiyajı", 75, 6500], providers: ["Aysel Rzayeva", "Səbinə Əliyeva"] },
  ];
  for (const [index, demo] of demos.entries()) {
    const demoSalon = await prisma.salon.upsert({ where: { slug: demo.slug }, update: {}, create: { slug: demo.slug, name: demo.name, description: `${demo.name} peşəkar, komfortlu və qonaqpərvər gözəllik məkanıdır.`, city: demo.city, address: demo.address, phone: demo.phone, imageUrl: demo.imageUrl, rating: 4.8 } });
    const demoService = await prisma.service.upsert({ where: { id: `cm0000000000000000000001${index}` }, update: {}, create: { id: `cm0000000000000000000001${index}`, salonId: demoSalon.id, name: demo.service[0], durationMinutes: demo.service[1], bufferMinutes: 15, priceCents: demo.service[2], description: "Premium məhsullar və fərdi konsultasiya daxildir." } });
    for (const [providerIndex, providerName] of demo.providers.entries()) {
      const demoProvider = await prisma.provider.upsert({ where: { id: `cm0000000000000000000002${index}${providerIndex}` }, update: {}, create: { id: `cm0000000000000000000002${index}${providerIndex}`, salonId: demoSalon.id, name: providerName, bio: "Portfolio və fərdi yanaşma ilə çalışan sertifikatlı mütəxəssis." } });
      await prisma.providerService.upsert({ where: { providerId_serviceId: { providerId: demoProvider.id, serviceId: demoService.id } }, update: {}, create: { providerId: demoProvider.id, serviceId: demoService.id } });
      for (let weekday = 1; weekday <= 6; weekday++) await prisma.providerHour.upsert({ where: { providerId_weekday: { providerId: demoProvider.id, weekday } }, update: {}, create: { providerId: demoProvider.id, weekday, startsAt: "10:00", endsAt: "19:00" } });
    }
    for (let weekday = 1; weekday <= 6; weekday++) await prisma.businessHour.upsert({ where: { salonId_weekday: { salonId: demoSalon.id, weekday } }, update: {}, create: { salonId: demoSalon.id, weekday, opensAt: "10:00", closesAt: "20:00" } });
    const providerRow = await prisma.provider.findFirstOrThrow({ where: { salonId: demoSalon.id }, orderBy: { name: "asc" } });
    const start = new Date(Date.now() + (index + 2) * 86400000); start.setHours(12 + index, 0, 0, 0);
    const end = new Date(start.getTime() + demo.service[1] * 60000);
    const blocked = new Date(end.getTime() + 15 * 60000);
    await prisma.appointment.upsert({ where: { idempotencyKey: `00000000-0000-4000-8000-00000000000${index}` }, update: {}, create: { bookingRef: `DEMO00${index}`, salonId: demoSalon.id, serviceId: demoService.id, providerId: providerRow.id, customerName: ["Aynur Məmmədova", "Leyla Qasımova", "Nigar Əliyeva"][index], customerEmail: `demo.customer${index}@example.com`, customerPhone: "+994501234567", startsAt: start, endsAt: end, blockedEndTime: blocked, status: index === 1 ? "CONFIRMED" : "PENDING", priceCents: demo.service[2], manageTokenHash: `demo-token-hash-${index}`, idempotencyKey: `00000000-0000-4000-8000-00000000000${index}` } });
  }
  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
