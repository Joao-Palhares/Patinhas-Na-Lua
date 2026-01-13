import { getBusinessSettings } from "./actions";
import NotificationTestButton from "./notification-test-button";
import SettingsForm from "./settings-form";

export default async function AdminSettingsPage() {
    const settings = await getBusinessSettings();

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <h1 className="text-3xl font-black text-gray-800 mb-2">Configuração do Negócio ⚙️</h1>
            <p className="text-gray-500 mb-8">Defina as taxas de deslocação e área de serviço para o Grooming ao Domicílio.</p>

            {/* LINK TO SCHEDULE */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 shadow-lg mb-8 text-white flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-1">📅 Horários</h2>
                    <p className="text-blue-100 text-sm">Defina os dias de abertura.</p>
                </div>
                <a href="/admin/settings/schedule" className="bg-white text-blue-600 font-bold py-3 px-6 rounded-xl shadow-md hover:bg-blue-50 transition transform hover:scale-105">
                    Gerir Horário →
                </a>
            </div>

            {/* LINK TO PET RULES */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-lg mb-8 text-white flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-1">🐾 Disponibilidade de Animais</h2>
                    <p className="text-orange-100 text-sm">Ativar/Desativar tamanhos de cães (ex: Avaria de mesa).</p>
                </div>
                <a href="/admin/settings/pets" className="bg-white text-orange-600 font-bold py-3 px-6 rounded-xl shadow-md hover:bg-orange-50 transition transform hover:scale-105">
                    Gerir Regras →
                </a>
            </div>

            {/* LINK TO REWARDS */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-6 shadow-lg mb-8 text-white flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-1">🎟️ Prémios de Fidelização</h2>
                    <p className="text-purple-100 text-sm">Defina os serviços de oferta por pontos.</p>
                </div>
                <a href="/admin/settings/rewards" className="bg-white text-purple-600 font-bold py-3 px-6 rounded-xl shadow-md hover:bg-purple-50 transition transform hover:scale-105">
                    Gerir Prémios →
                </a>
            </div>

            {/* LINK TO COUPONS */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-6 shadow-lg mb-8 text-white flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-1">🏷️ Cupões de Desconto</h2>
                    <p className="text-teal-100 text-sm">Gerir cupões ativos e histórico de uso.</p>
                </div>
                <a href="/admin/coupons" className="bg-white text-teal-600 font-bold py-3 px-6 rounded-xl shadow-md hover:bg-teal-50 transition transform hover:scale-105">
                    Gerir Cupões →
                </a>
            </div>

            {/* DATA BACKUP */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg mb-8 text-white flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold mb-1">💾 Cópia de Segurança</h2>
                    <p className="text-slate-400 text-sm">Exportar dados. JSON (Tudo) ou Excel (Relatórios).</p>
                </div>
                <div className="flex gap-3">
                    <a href="/api/backup?format=csv" target="_blank" className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-green-500 transition transform hover:scale-105 flex items-center gap-2">
                        📊 Excel (CSV)
                    </a>
                    <a href="/api/backup" target="_blank" className="bg-white text-slate-900 font-bold py-3 px-6 rounded-xl shadow-md hover:bg-slate-200 transition transform hover:scale-105 flex items-center gap-2">
                        ⬇️ JSON (Completo)
                    </a>
                </div>
            </div>

            <SettingsForm settings={settings} />
        </div>
    );
}

// ----------------------------------------------------------------------
// CLIENT COMPONENT WRAPPER FOR FORM
// ----------------------------------------------------------------------

