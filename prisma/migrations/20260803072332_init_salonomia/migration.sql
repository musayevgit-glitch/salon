-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('CUSTOMER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('SALON_ADMIN', 'SALON_MANAGER');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED', 'NO_SHOW', 'NEEDS_REASSIGNMENT');

-- CreateTable
CREATE TABLE "salonomia_user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "globalRole" "GlobalRole" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salonomia_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "salonomia_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "password" TEXT,

    CONSTRAINT "salonomia_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salonomia_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_salon" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Baku',
    "imageUrl" TEXT,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 5,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "bookingLeadMinutes" INTEGER NOT NULL DEFAULT 60,
    "cancellationHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salonomia_salon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "salonomia_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_service" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "salonomia_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_provider" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "salonomia_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_provider_service" (
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "salonomia_provider_service_pkey" PRIMARY KEY ("providerId","serviceId")
);

-- CreateTable
CREATE TABLE "salonomia_business_hour" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "salonomia_business_hour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_provider_hour" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startsAt" TEXT NOT NULL,
    "endsAt" TEXT NOT NULL,

    CONSTRAINT "salonomia_provider_hour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_appointment" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "blockedEndTime" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "priceCents" INTEGER NOT NULL,
    "manageTokenHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salonomia_appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salonomia_audit_log" (
    "id" TEXT NOT NULL,
    "salonId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salonomia_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_user_email_key" ON "salonomia_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_session_token_key" ON "salonomia_session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_account_providerId_accountId_key" ON "salonomia_account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_verification_identifier_value_key" ON "salonomia_verification"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_salon_slug_key" ON "salonomia_salon"("slug");

-- CreateIndex
CREATE INDEX "salonomia_membership_salonId_role_idx" ON "salonomia_membership"("salonId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_membership_userId_salonId_key" ON "salonomia_membership"("userId", "salonId");

-- CreateIndex
CREATE INDEX "salonomia_service_salonId_active_idx" ON "salonomia_service"("salonId", "active");

-- CreateIndex
CREATE INDEX "salonomia_provider_salonId_active_idx" ON "salonomia_provider"("salonId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_business_hour_salonId_weekday_key" ON "salonomia_business_hour"("salonId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_provider_hour_providerId_weekday_key" ON "salonomia_provider_hour"("providerId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_appointment_bookingRef_key" ON "salonomia_appointment"("bookingRef");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_appointment_manageTokenHash_key" ON "salonomia_appointment"("manageTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "salonomia_appointment_idempotencyKey_key" ON "salonomia_appointment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "salonomia_appointment_salonId_startsAt_idx" ON "salonomia_appointment"("salonId", "startsAt");

-- CreateIndex
CREATE INDEX "salonomia_appointment_providerId_startsAt_blockedEndTime_idx" ON "salonomia_appointment"("providerId", "startsAt", "blockedEndTime");

-- CreateIndex
CREATE INDEX "salonomia_audit_log_salonId_createdAt_idx" ON "salonomia_audit_log"("salonId", "createdAt");

-- AddForeignKey
ALTER TABLE "salonomia_session" ADD CONSTRAINT "salonomia_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "salonomia_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_account" ADD CONSTRAINT "salonomia_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "salonomia_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_membership" ADD CONSTRAINT "salonomia_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "salonomia_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_membership" ADD CONSTRAINT "salonomia_membership_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salonomia_salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_service" ADD CONSTRAINT "salonomia_service_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salonomia_salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_provider" ADD CONSTRAINT "salonomia_provider_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salonomia_salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_provider_service" ADD CONSTRAINT "salonomia_provider_service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "salonomia_provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_provider_service" ADD CONSTRAINT "salonomia_provider_service_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "salonomia_service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_business_hour" ADD CONSTRAINT "salonomia_business_hour_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salonomia_salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_provider_hour" ADD CONSTRAINT "salonomia_provider_hour_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "salonomia_provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_appointment" ADD CONSTRAINT "salonomia_appointment_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salonomia_salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_appointment" ADD CONSTRAINT "salonomia_appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "salonomia_service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_appointment" ADD CONSTRAINT "salonomia_appointment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "salonomia_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_audit_log" ADD CONSTRAINT "salonomia_audit_log_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salonomia_salon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salonomia_audit_log" ADD CONSTRAINT "salonomia_audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "salonomia_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
