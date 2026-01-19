import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import LogsFilters from "./logs-filters";

export default async function AuditLogsPage(props: {
  searchParams: Promise<{
    action?: string;
    entity?: string;
    userId?: string;
    page?: string;
    range?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  
  // SECURITY: Only SuperAdmins
  if (!dbUser?.isSuperAdmin) {
    return (
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
            <p className="text-gray-600">Esta área é restrita a Super Admins.</p>
            {/* DEV BACKDOOR: REMOVE IN PRODUCTION */}
            {dbUser?.isAdmin && (
                <form action={async () => {
                   "use server";
                   await db.user.update({ where: { id: user.id }, data: { isSuperAdmin: true }});
                   redirect("/admin/logs"); 
                }}>
                    <button className="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded text-xs">
                        (DEV) Promover-me a SuperAdmin
                    </button>
                </form>
            )}
        </div>
    );
  }

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;

  // FILTERS
  const where: any = {};
  if (searchParams.action) where.action = searchParams.action;
  if (searchParams.entity) where.entity = searchParams.entity;
  if (searchParams.userId) where.userId = searchParams.userId;

  // SEARCH (In ID or Details)
  /* NOTE: Requires Prisma Full Text Search or OR logic. 
     For simple string fields: */
  // @ts-ignore
  if (searchParams.search) {
      where.OR = [
          { details: { contains: searchParams.search, mode: 'insensitive' } },
          { entityId: { contains: searchParams.search, mode: 'insensitive' } }
      ];
  }

  // DATE RANGES
  const now = new Date();
  if (searchParams.range) {
      if (searchParams.range === 'today') {
          const start = new Date(); start.setHours(0,0,0,0);
          where.createdAt = { gte: start };
      } else if (searchParams.range === '24h') {
          const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          where.createdAt = { gte: start };
      } else if (searchParams.range === '7d') {
          const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          where.createdAt = { gte: start };
      } else if (searchParams.range === '30d') {
          const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          where.createdAt = { gte: start };
      } else if (searchParams.range === 'custom') {
           // @ts-ignore
           if (searchParams.startDate) {
               // @ts-ignore
               where.createdAt = { gte: new Date(searchParams.startDate) };
           }
           // @ts-ignore
           if (searchParams.endDate) {
               // @ts-ignore
               const end = new Date(searchParams.endDate); end.setHours(23,59,59,999);
                // IF we already have a gte, spread it
                const existing = where.createdAt || {};
               where.createdAt = { ...existing, lte: end };
           }
      }
  }

  const logs = await db.auditLog.findMany({
    where,
    take: limit,
    skip: skip,
    orderBy: { createdAt: "desc" },
    include: {
        user: { select: { name: true, email: true } }
    }
  });

  const totalLogs = await db.auditLog.count({ where });
  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <div className="p-4 max-w-7xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">📜 Logs do Sistema ({totalLogs})</h1>
                <p className="text-sm text-slate-500">Histórico completo de ações na base de dados.</p>
            </div>
            
            {/* SUPER ADMIN BADGE */}
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
                🛡️ Modo Super Admin
            </div>
        </div>

        {/* FILTERS UI */}
        <LogsFilters />

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ação</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Entidade</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Detalhes</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Quem?</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition text-sm">
                            <td className="p-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                                {new Date(log.createdAt).toLocaleString("pt-PT")}
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold
                                    ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' : 
                                      log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                      log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-slate-100 text-slate-700'}
                                `}>
                                    {log.action}
                                </span>
                            </td>
                            <td className="p-4 font-bold text-gray-700">
                                {log.entity} <span className="opacity-50 text-xs font-normal">#{log.entityId}</span>
                            </td>
                            <td className="p-4 text-gray-600 max-w-sm overflow-hidden text-ellipsis" title={log.details || ""}>
                                {log.details ? log.details.substring(0, 80) + (log.details.length > 80 ? "..." : "") : "-"}
                            </td>
                            <td className="p-4 text-xs">
                                <div className="font-bold text-slate-800">{log.user?.name || "Sistema"}</div>
                                <div className="text-slate-400">{log.ipAddress || "No IP"}</div>
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400">
                                Nenhum registro encontrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center gap-2 mt-6">
            {page > 1 && (
                <Link href={`/admin/logs?page=${page - 1}`} className="bg-white border px-4 py-2 rounded shadow-sm hover:bg-gray-50">
                    Anterior
                </Link>
            )}
            <span className="px-4 py-2 text-gray-500 font-bold">Pág {page} de {totalPages || 1}</span>
            {page < totalPages && (
                 <Link href={`/admin/logs?page=${page + 1}`} className="bg-white border px-4 py-2 rounded shadow-sm hover:bg-gray-50">
                 Próximo
             </Link>
            )}
        </div>
    </div>
  );
}
