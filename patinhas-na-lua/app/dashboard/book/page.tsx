import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import BookingWizard from "./booking-wizard";
import Link from "next/link";

export default async function BookingPage(props: {
  searchParams: Promise<{ date?: string }>
}) {
  const searchParams = await props.searchParams;
  const initialDate = searchParams?.date || "";

  const user = await currentUser();
  if (!user) redirect("/");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { pets: true }
  });

  if (!dbUser) redirect("/onboarding");

  // 1. Fetch Raw Services from Database
  const rawServices = await db.service.findMany({
    include: { options: true },
    orderBy: { category: "asc" }
  });

  // 2. CRITICAL FIX: Convert Decimal to Number
  // We map over the services and options to convert 'Decimal' prices to simple 'numbers'
  const services = rawServices.map(service => ({
    ...service,
    options: service.options.map(opt => ({
      ...opt,
      price: opt.price.toNumber() // <--- This fixes the error
    }))
  }));

  // 3. Fetch Schedule Config
  const workingDays = await db.$queryRaw<any[]>`
      SELECT "dayOfWeek", "isClosed" FROM "WorkingDay"
  `;
  const closedDays = workingDays.filter(d => d.isClosed).map(d => d.dayOfWeek);
  const finalClosedDays = workingDays.length > 0 ? closedDays : [0, 6];

  // 4. Fetch Absences
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureAbsences = await db.$queryRaw<any[]>`
      SELECT "startDate", "endDate", "reason" FROM "Absence" WHERE "endDate" >= ${today}
  `;
  const absenceRanges = futureAbsences.map(a => ({
    from: new Date(a.startDate),
    to: new Date(a.endDate),
    reason: a.reason
  }));

  // 5. Fetch Pet Availability Rules (Using Raw SQL for safety)
  const availabilityRulesRaw = await db.$queryRaw<any[]>`
    SELECT "size", "species" FROM "PetSizeRule" WHERE "isActive" = false
  `;
  // Format: "SPECIES:SIZE" (e.g. "DOG:LARGE")
  const disabledRules = availabilityRulesRaw.map(r => `${r.species}:${r.size}`);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white shadow-sm p-4 mb-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-blue-600 font-bold">← Cancelar</Link>
          <h1 className="text-xl font-bold text-slate-800">Novo Agendamento</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4">
        {dbUser.pets.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ups! Sem animais registados.</h2>
            <p className="text-gray-500 mb-6">Precisa de adicionar um pet antes de fazer uma marcação.</p>
            <Link href="/dashboard/pets">
              <button className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg">Adicionar Pet Agora</button>
            </Link>
          </div>
        ) : (
          <BookingWizard
            user={{
              id: dbUser.id,
              name: dbUser.name,
              nif: dbUser.nif
            }}
            pets={dbUser.pets}
            services={services}
            initialDate={initialDate}
            closedDays={finalClosedDays}
            absenceRanges={absenceRanges}
            disabledRules={disabledRules}
          />
        )}
      </div>
    </div>
  );
}