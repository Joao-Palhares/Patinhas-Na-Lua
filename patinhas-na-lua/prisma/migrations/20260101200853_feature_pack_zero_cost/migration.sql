-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT', 'RABBIT', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('GROOMING', 'HYGIENE', 'EXOTIC', 'SPA');

-- CreateEnum
CREATE TYPE "PetSize" AS ENUM ('TOY', 'SMALL', 'MEDIUM', 'LARGE', 'XL', 'GIANT');

-- CreateEnum
CREATE TYPE "CoatType" AS ENUM ('SHORT', 'MEDIUM', 'LONG');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MBWAY', 'CARD', 'TRANSFER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED', 'PAID');

-- CreateEnum
CREATE TYPE "ExtraFeeCategory" AS ENUM ('MANEJO', 'PELO', 'LOGISTICA', 'OUTRO');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('PRODUCT', 'EQUIPMENT', 'UTILITIES', 'RENT', 'TAXES', 'OTHER');

-- CreateEnum
CREATE TYPE "SocialRating" AS ENUM ('GOOD', 'MEDIUM', 'DIFFICULT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "StressLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('SALON', 'MOBILE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "nif" TEXT,
    "address" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL DEFAULT 'DOG',
    "breed" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "microchip" TEXT,
    "sizeCategory" "PetSize",
    "coatType" "CoatType",
    "allergies" TEXT,
    "skinIssues" TEXT,
    "heartIssues" TEXT,
    "medicalNotes" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ServiceCategory" NOT NULL,
    "allowsAddOns" BOOLEAN NOT NULL DEFAULT false,
    "isMobileAvailable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOption" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "petSize" "PetSize",
    "coatType" "CoatType",
    "price" DECIMAL(65,30) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "durationMax" INTEGER,

    CONSTRAINT "ServiceOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "externalId" TEXT,
    "pdfUrl" TEXT,
    "appointmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraFee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basePrice" DECIMAL(65,30) NOT NULL,
    "category" "ExtraFeeCategory" NOT NULL DEFAULT 'MANEJO',

    CONSTRAINT "ExtraFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentExtraFee" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "extraFeeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "appliedPrice" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AppointmentExtraFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "price" DECIMAL(65,30) NOT NULL,
    "originalPrice" DECIMAL(65,30),
    "discountNotes" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" "PaymentMethod",
    "paidAt" TIMESTAMP(3),
    "locationType" "LocationType" NOT NULL DEFAULT 'SALON',
    "mobileAddress" TEXT,
    "travelFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3),
    "behaviorNotes" TEXT,
    "v7Updated" BOOLEAN NOT NULL DEFAULT false,
    "rabiesUpdated" BOOLEAN NOT NULL DEFAULT false,
    "kennelCoughUpdated" BOOLEAN NOT NULL DEFAULT false,
    "internalDeworming" BOOLEAN NOT NULL DEFAULT false,
    "externalDeworming" BOOLEAN NOT NULL DEFAULT false,
    "socialPeople" "SocialRating" NOT NULL DEFAULT 'UNKNOWN',
    "socialDogs" "SocialRating" NOT NULL DEFAULT 'UNKNOWN',
    "fearDryer" BOOLEAN NOT NULL DEFAULT false,
    "fearClippers" BOOLEAN NOT NULL DEFAULT false,
    "fearBathing" BOOLEAN NOT NULL DEFAULT false,
    "stressLevel" "StressLevel" NOT NULL DEFAULT 'LOW',
    "groomerNotes" TEXT,
    "userId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "spaTreatment" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'PRODUCT',
    "notes" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "baseLatitude" DOUBLE PRECISION NOT NULL DEFAULT 40.5489,
    "baseLongitude" DOUBLE PRECISION NOT NULL DEFAULT -8.0815,
    "baseAddress" TEXT,
    "zone1RadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "zone1Fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "zone2RadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "zone2Fee" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "zone3Fee" DECIMAL(65,30) NOT NULL DEFAULT 15,
    "maxRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingDay" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '18:00',
    "breakStartTime" TEXT NOT NULL DEFAULT '12:00',
    "breakEndTime" TEXT NOT NULL DEFAULT '13:00',
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkingDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_appointmentId_key" ON "Invoice"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingDay_dayOfWeek_key" ON "WorkingDay"("dayOfWeek");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOption" ADD CONSTRAINT "ServiceOption_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentExtraFee" ADD CONSTRAINT "AppointmentExtraFee_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentExtraFee" ADD CONSTRAINT "AppointmentExtraFee_extraFeeId_fkey" FOREIGN KEY ("extraFeeId") REFERENCES "ExtraFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
