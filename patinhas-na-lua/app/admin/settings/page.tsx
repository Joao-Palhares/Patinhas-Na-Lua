import { getBusinessSettings, saveBusinessSettings } from "./actions";
import NotificationTestButton from "./notification-test-button";

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

            {/* DATA BACKUP */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg mb-8 text-white flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-1">💾 Cópia de Segurança</h2>
                    <p className="text-slate-400 text-sm">Exportar todos os dados (Clientes, Pets, Faturas) para JSON.</p>
                </div>
                <a href="/api/backup" target="_blank" className="bg-white text-slate-900 font-bold py-3 px-6 rounded-xl shadow-md hover:bg-slate-200 transition transform hover:scale-105 flex items-center gap-2">
                    ⬇️ Download Backup
                </a>
            </div>

            <form action={saveBusinessSettings} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">

                {/* SECTION 1: Base Location */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        📍 Localização Base (Salon)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl border border-gray-200">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Latitude</label>
                            <input
                                type="number"
                                name="baseLatitude"
                                step="any"
                                defaultValue={settings.baseLatitude}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Longitude</label>
                            <input
                                type="number"
                                name="baseLongitude"
                                step="any"
                                defaultValue={settings.baseLongitude}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                        </div>
                        <div className="md:col-span-2 text-xs text-gray-500">
                            * Use coordenadas decimais (ex: 40.5489, -8.0815). Pode obter no Google Maps.
                        </div>
                    </div>
                </div>

                {/* SECTION 1.6: Push Notifications */}
                <div>
                     <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        🔔 Notificações (Web Push)
                    </h2>
                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-blue-900">Enviar Lembretes Manuais</h3>
                            <p className="text-xs text-blue-700 mt-1">
                                Disparar notificações para agendamentos de AMANHÃ.
                            </p>
                        </div>
                        {/* We need a Client Component button here */}
                        <NotificationTestButton />
                    </div>
                </div>

                {/* SECTION 1.5: Marketing */}
                <div>
                     <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        📣 Marketing & Referências
                    </h2>
                    <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-purple-900 mb-1">Desconto de Referência (%)</label>
                                <input
                                    type="number"
                                    name="referralRewardPercentage"
                                    defaultValue={settings.referralRewardPercentage || 5}
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-2 rounded-lg border border-purple-300 focus:ring-2 focus:ring-purple-500 text-gray-900"
                                />
                                <p className="text-xs text-purple-700 mt-2">
                                    Percentagem de desconto atribuída a quem convida um amigo (quando o amigo conclui o 1º serviço).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Zones */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        🗺️ Zonas de Serviço (Raios)
                    </h2>

                    <div className="space-y-4">
                        {/* ZONE 1 */}
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                            <h3 className="font-bold text-green-800 mb-2">Zona 1 (Perto)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-green-700 uppercase">Raio (km)</label>
                                    <input
                                        type="number"
                                        name="zone1RadiusKm"
                                        defaultValue={settings.zone1RadiusKm}
                                        className="w-full mt-1 p-2 rounded border border-green-300 text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-green-700 uppercase">Taxa (€)</label>
                                    <input
                                        type="number"
                                        name="zone1Fee"
                                        defaultValue={Number(settings.zone1Fee)}
                                        className="w-full mt-1 p-2 rounded border border-green-300 text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ZONE 2 */}
                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <h3 className="font-bold text-yellow-800 mb-2">Zona 2 (Médio)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-yellow-700 uppercase">Raio (km)</label>
                                    <input
                                        type="number"
                                        name="zone2RadiusKm"
                                        defaultValue={settings.zone2RadiusKm}
                                        className="w-full mt-1 p-2 rounded border border-yellow-300 text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-yellow-700 uppercase">Taxa (€)</label>
                                    <input
                                        type="number"
                                        name="zone2Fee"
                                        defaultValue={Number(settings.zone2Fee)}
                                        className="w-full mt-1 p-2 rounded border border-yellow-300 text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LIMIT */}
                        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                            <h3 className="font-bold text-red-800 mb-2">Limite Máximo</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-red-700 uppercase">Raio Máximo (km)</label>
                                    <input
                                        type="number"
                                        name="maxRadiusKm"
                                        defaultValue={settings.maxRadiusKm}
                                        className="w-full mt-1 p-2 rounded border border-red-300 text-gray-900"
                                    />
                                    <p className="text-xs text-red-600 mt-1">Acima da Zona 2 até aqui.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-red-700 uppercase">Taxa Zona 3 (€)</label>
                                    <input
                                        type="number"
                                        name="zone3Fee"
                                        defaultValue={Number(settings.zone3Fee)}
                                        className="w-full mt-1 p-2 rounded border border-red-300 text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button type="submit" className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition shadow-lg">
                        Guardar Alterações
                    </button>
                </div>

            </form>
        </div>
    );
}
