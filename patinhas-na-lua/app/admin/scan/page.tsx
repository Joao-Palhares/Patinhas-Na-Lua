"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import jsQR from "jsqr";
import { validateCoupon } from "@/app/dashboard/book/actions";
import Link from "next/link";

export default function AdminScanPage() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [validation, setValidation] = useState<{ valid: boolean; message?: string; discount?: number } | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState("");

    const validate = async (code: string) => {
        try {
            const res = await validateCoupon(code);
            setValidation({
                valid: res.valid,
                message: res.message,
                discount: res.discount
            });
        } catch (e) {
            setValidation({ valid: false, message: "Erro ao validar." });
        }
    };

    const handleManualVerify = () => {
        if (!manualCode) return;
        setIsScanning(false);
        setScanResult(manualCode);
        validate(manualCode);
    };

    useEffect(() => {
        // Check for insecure context
        if (typeof window !== "undefined" && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            setCameraError("⚠️ A câmara requer HTTPS. Use 'localhost' ou um domínio seguro.");
        }

        if (!isScanning) return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
            /* verbose= */ false
        );

        scanner.render(
            async (decodedText) => {
                console.log("Scanned:", decodedText);
                scanner.clear();
                setIsScanning(false);
                setScanResult(decodedText);
                validate(decodedText);
            },
            (error) => {
                // ignore
            }
        );

        return () => {
            // We can't always clear it perfectly if it unmounts fast, catch error
            scanner.clear().catch(error => console.error("Scanner clear error", error));
        };
    }, [isScanning]);

    const handleReset = () => {
        setScanResult(null);
        setValidation(null);
        setIsScanning(true);
        setCameraError(null);
        setManualCode("");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Native JS Image/Canvas approach for better control than html5-qrcode file scan
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    if (!context) return;

                    // Draw image to canvas
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0);

                    // Decode
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);

                    if (code) {
                        setScanResult(code.data);
                        setIsScanning(false);
                        validate(code.data);
                    } else {
                        setValidation({ valid: false, message: "Não foi possível detetar QR nesta imagem. Tente outra ou use o código manual." });
                        setScanResult("Falha na Leitura");
                        setIsScanning(false);
                    }
                };
                if (event.target?.result) {
                    img.src = event.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black">Ler QR Code 📷</h1>
                <Link href="/admin/coupons">
                    <button className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full">Cancelar</button>
                </Link>
            </div>

            {/* ERROR MESSAGE */}
            {cameraError && (
                <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 p-4 rounded-xl mb-6 text-sm">
                    <p className="font-bold mb-1">⚠️ Câmara Bloqueada pelo Browser</p>
                    <p className="opacity-90 leading-relaxed">
                        Por segurança, o navegador só permite a câmara em sites <strong>HTTPS</strong>.
                        Como está a aceder via IP local (HTTP), o acesso é bloqueado.
                        <br /><br />
                        <strong>Solução:</strong> Use a Introdução Manual ou carregue uma foto abaixo.
                        <br />
                        (No site final publicado, a câmara funcionará automaticamente)
                    </p>
                </div>
            )}

            {/* SCANNING AREA */}
            {isScanning && (
                <div className="space-y-8">
                    <div className="bg-black rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl relative min-h-[300px]">
                        <div id="reader"></div>
                    </div>

                    {/* MANUAL INPUT FALLBACK */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <p className="text-slate-400 text-xs uppercase font-bold mb-3 tracking-wider text-center">- OU DIGITE O CÓDIGO -</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                placeholder="REWARD-..."
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 uppercase"
                            />
                            <button
                                onClick={handleManualVerify}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-xl transition shadow-lg"
                            >
                                OK
                            </button>
                        </div>
                    </div>

                    <div className="text-center opacity-80 hover:opacity-100 transition">
                        <label className="text-sm text-slate-400 font-bold cursor-pointer hover:text-white transition flex items-center justify-center gap-2 border border-slate-700 p-3 rounded-xl hover:border-slate-500 bg-slate-800/50">
                            <span>📁</span> Prefiro carregar uma foto
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* RESULTS */}
            {!isScanning && scanResult && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Código Detetado</p>
                        <h2 className="text-3xl font-black font-mono mb-6 break-all">{scanResult}</h2>

                        {validation ? (
                            <div className={`p-6 rounded-2xl mb-8 ${validation.valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {validation.valid ? (
                                    <>
                                        <div className="text-5xl mb-2">✅</div>
                                        <h3 className="text-xl font-black">Válido!</h3>
                                        <p className="text-lg">Desconto: {validation.discount === 100 ? "100% (Oferta)" : `${validation.discount}%`}</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-5xl mb-2">❌</div>
                                        <h3 className="text-xl font-black">Inválido</h3>
                                        <p>{validation.message}</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 mb-8 text-gray-500">Validando...</div>
                        )}

                        <button
                            onClick={handleReset}
                            className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full hover:bg-slate-800 transition"
                        >
                            Ler Outro
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
