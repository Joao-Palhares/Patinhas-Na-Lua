"use client";

import { toast } from "sonner";
import { saveBusinessSettings } from "./actions";
import SubmitSettingsButton from "./submit-button"; // Fixed Import

// Re-defining properties for clarity if needed, or using 'any' as typical in rapid dev
interface Props {
  settings: any;
}

export default function SettingsForm({ settings }: Props) {

    async function handleSubmit(formData: FormData) {
        try {
           await saveBusinessSettings(formData);
           toast.success("✅ Configurações guardadas com sucesso!");
        } catch (error) {
           toast.error("❌ Erro ao guardar.");
        }
    }

    return (
        <>
        <form action={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
            {/* SECTION 1: Base Location */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    📍 Localização Base (Salon)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl border border-gray-200">
                    <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Morada Completa</label>
                            <input
                                type="text"
                                name="baseAddress"
                                defaultValue={settings.baseAddress || ""}
                                placeholder="Ex: Rua das Flores nº 123, Tondela"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                    </div>
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

            {/* SECTION 1.6: Push Notifications - REMOVED TEST BUTTONS */}
            
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
                <SubmitSettingsButton />
            </div>
        </form>
    </>
    );
}
