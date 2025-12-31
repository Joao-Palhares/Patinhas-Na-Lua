"use client";

import QRCode from "react-qr-code";
import { useState } from "react";

export default function CouponQRCode({ code }: { code: string }) {
    const [showLarge, setShowLarge] = useState(false);

    return (
        <>
            {/* Small Preview - Click to Enlarge */}
            <div
                onClick={() => setShowLarge(true)}
                className="bg-white p-2 rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition shadow-sm"
            >
                <QRCode value={code} size={64} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                <p className="text-[10px] text-center text-gray-400 font-bold mt-1">🔍 Ampliar</p>
            </div>

            {/* Full Screen Modal */}
            {showLarge && (
                <div
                    onClick={() => setShowLarge(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-8 backdrop-blur-sm"
                >
                    <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in-50 duration-300 transform scale-110" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-black text-gray-800 mb-2">Mostre este código</h3>
                        <p className="text-gray-500 text-sm mb-6">Ao seu Groomer para validar</p>

                        <div className="bg-white p-2 rounded-xl border-4 border-blue-100">
                            <QRCode value={code} size={250} />
                        </div>

                        <p className="font-mono text-2xl font-black text-gray-800 mt-6 tracking-widest">{code}</p>

                        <button
                            onClick={() => setShowLarge(false)}
                            className="mt-8 bg-gray-100 text-gray-600 font-bold py-3 px-8 rounded-full hover:bg-gray-200"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
