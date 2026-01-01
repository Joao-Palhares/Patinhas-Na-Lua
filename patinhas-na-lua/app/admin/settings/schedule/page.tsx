import { db } from "@/lib/db";
import DayRow from "./day-row";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function SchedulePage() {
    // Use Raw Query to bypass missing Prisma Client types at runtime
    const workingDays = await db.$queryRaw<any[]>`
      SELECT "id", "dayOfWeek", "startTime", "endTime", "breakStartTime", "breakEndTime", "isClosed" 
      FROM "WorkingDay" 
      ORDER BY "dayOfWeek" ASC
    `;

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <a href="/admin/settings" className="text-gray-500 hover:text-gray-800 transition font-bold text-sm">← Voltar</a>
                    <h1 className="text-3xl font-bold text-slate-800">Horário de Funcionamento ⏰</h1>
                </div>
                <p className="text-sm text-gray-500">Defina os horários de abertura e pausas.</p>
            </div>

            <div className="space-y-4">
                {DAYS.map((dayName, index) => {
                    const config = workingDays.find(d => d.dayOfWeek === index);
                    // Defaults: Weekends closed, 9-18 weekdays
                    const isWeekend = index === 0 || index === 6;
                    const isClosed = config ? config.isClosed : isWeekend;
                    const start = config?.startTime || "09:00";
                    const end = config?.endTime || "18:00";
                    const breakStart = config?.breakStartTime || "12:00";
                    const breakEnd = config?.breakEndTime || "13:00";

                    return (
                        <DayRow
                            key={index}
                            dayName={dayName}
                            dayIndex={index}
                            startTime={start}
                            endTime={end}
                            breakStartTime={breakStart}
                            breakEndTime={breakEnd}
                            isClosed={isClosed}
                        />
                    );
                })}
            </div>
        </div>
    );
}
