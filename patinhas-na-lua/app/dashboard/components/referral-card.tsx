"use client";

import { useState } from "react";
import { toast } from "sonner";
import { generateReferralCode } from "@/app/actions/referral";
import { Copy, Gift, Ticket, Loader2 } from "lucide-react";

interface ReferralCardProps {
    existingCode: string | null;
    referralCount: number;
}

export function ReferralCard({ existingCode, referralCount }: ReferralCardProps) {
    const [code, setCode] = useState<string | null>(existingCode);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateReferralCode();
            if (result.error) {
                toast.error(result.error);
            } else if (result.success) {
                setCode(result.success);
                toast.success("O teu código foi criado!");
            }
        } catch (e) {
            toast.error("Erro ao gerar código");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        toast.success("Código copiado!");
    };

    return (
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Text Section */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <Gift className="w-5 h-5 text-yellow-300" />
                        <span className="font-semibold tracking-wider text-sm uppercase text-purple-100">
                            Programa de Amigos
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                        Convida amigos, ganha Pontos!
                    </h3>
                    <p className="text-purple-100 text-sm max-w-md">
                        Oferece <span className="font-bold text-white">5€ de desconto</span> num banho ou tosquia aos teus amigos.
                        Quando eles completarem a visita, tu recebes pontos extra!
                    </p>
                </div>

                {/* Action Section */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 w-full md:w-auto min-w-[280px] border border-white/20">
                    {!code ? (
                        <div className="text-center">
                            <p className="text-sm text-purple-100 mb-3">Ainda não tens código?</p>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full bg-white text-purple-600 font-bold py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Criar Código de Amigo
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-purple-200 mb-1 uppercase font-semibold text-center md:text-left">
                                O teu Código Único
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white/20 border border-white/30 rounded-lg h-10 flex items-center justify-center relative font-mono text-lg font-bold tracking-widest select-all">
                                    {code}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="bg-white text-purple-600 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-purple-50 transition-colors"
                                    title="Copiar"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-3 flex items-center gap-2 justify-center md:justify-start text-xs text-purple-200">
                                <Ticket className="w-3 h-3" />
                                <span>{referralCount} amigos convidados</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
