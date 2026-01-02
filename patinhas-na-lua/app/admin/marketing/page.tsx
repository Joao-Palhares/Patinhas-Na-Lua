"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Download, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

// COLOR PALETTE
const COLORS = {
    bg: "#A68E80",      // Taupe (Brand Background)
    padding: "#FdfcFb", // Paper White
    text: "#5D4E46",    // Dark Brown (Readable)
    accent: "#D9BBA9"   // Peachy
};

export default function MarketingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
    const [petName, setPetName] = useState("");
    const [caption, setCaption] = useState("Dia de Spa! 🛁");
    const [template, setTemplate] = useState<"CLASSIC" | "STORY">("STORY");

    // Load Logo on mount
    useEffect(() => {
        const logo = new Image();
        logo.src = "/logo.png";
        logo.crossOrigin = "anonymous";
        logo.onload = () => setLogoImage(logo);
    }, []);

    // HANDLE FILE UPLOAD
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => setImage(img);
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // DRAW CANVAS
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 1. Set Dimensions
        const width = 1080;
        const height = template === "STORY" ? 1920 : 1080;

        canvas.width = width;
        canvas.height = height;

        // 2. FILL BACKGROUND (Taupe)
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, width, height);

        // 3. DRAW "POLAROID" CARD (White Paper)
        const cardMargin = 60;
        const cardWidth = width - (cardMargin * 2);
        const cardHeight = height - (cardMargin * 2);

        // Shadow
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 50;
        ctx.fillStyle = COLORS.padding;
        ctx.fillRect(cardMargin, cardMargin, cardWidth, cardHeight);
        ctx.shadowBlur = 0; // Reset

        // 4. DRAW USER IMAGE (Smart Crop Center)
        const imgMargin = 50;
        const imgX = cardMargin + imgMargin;
        const imgY = cardMargin + imgMargin;
        const imgW = cardWidth - (imgMargin * 2);
        // Reserve specific space for footer elements
        // We calculate footer height based on elements we need to fit
        const footerH = 500; // Increased footer space
        const imgH = cardHeight - (imgMargin * 2) - footerH;

        // Smart Crop Logic (Center-Center)
        const srcRatio = image.width / image.height;
        const dstRatio = imgW / imgH;
        let renderW, renderH, offsetX, offsetY;

        if (srcRatio > dstRatio) {
            // Image is wider than destination -> Crop sides
            renderH = imgH;
            renderW = imgH * srcRatio;
            offsetX = (imgW - renderW) / 2;
            offsetY = 0;
        } else {
            // Image is taller than destination -> Crop top/bottom
            renderW = imgW;
            renderH = imgW / srcRatio;
            offsetX = 0;
            offsetY = (imgH - renderH) / 2;
        }

        ctx.save();
        ctx.translate(imgX, imgY);
        ctx.beginPath();
        ctx.rect(0, 0, imgW, imgH);
        ctx.clip();
        ctx.drawImage(image, offsetX, offsetY, renderW, renderH);
        ctx.restore();

        // 5. TEXT AREA (Adjusted Vertically)
        const textCenter = width / 2;
        // Start text below image
        const textBaseY = imgY + imgH + 120;

        // Pet Name
        ctx.fillStyle = COLORS.text;
        ctx.font = "bold 90px 'Times New Roman', serif";
        ctx.textAlign = "center";
        ctx.fillText(petName || "O meu Pet", textCenter, textBaseY);

        // Caption
        ctx.fillStyle = "#8C7B70";
        ctx.font = "italic 40px sans-serif";
        ctx.fillText(caption, textCenter, textBaseY + 70);

        // 6. LOGO BADGE (Bottom of Card)
        if (logoImage) {
            const logoSize = 180;
            const logoX = textCenter;
            // Position logo near the bottom of the visible white card area
            const logoY = bgY(height) - 130; // Function-like logic: Bottom of card - margin

            // Simpler: Just put it at a fixed distance from bottom of card
            const cardBottomY = cardMargin + cardHeight;
            const logoCenterY = cardBottomY - 140; // 140px up from bottom edge

            ctx.save();
            ctx.beginPath();
            ctx.arc(logoX, logoCenterY, logoSize / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(logoImage, logoX - logoSize / 2, logoCenterY - logoSize / 2, logoSize, logoSize);
            ctx.restore();

            // Border Ring
            ctx.beginPath();
            ctx.arc(logoX, logoCenterY, logoSize / 2, 0, Math.PI * 2, true);
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#DDD"; // Softer grey/white border
            ctx.stroke();
        }

    }, [image, logoImage, petName, caption, template]);

    // Helper
    const bgY = (h: number) => h - 60; // Approximate bottom of white card

    // DOWNLOAD
    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement("a");
        const dateStr = new Date().toISOString().split('T')[0];
        const cleanName = (petName || "story").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `patinhas-${cleanName}-${dateStr}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Imagem guardada! Pode partilhar.");
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Sparkles className="text-yellow-500" /> Estúdio Criativo (Insta-Famous)
            </h1>
            <p className="text-gray-500 mb-8">Crie Stories incríveis dos seus clientes em segundos.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* LEFT: CONTROLS */}
                <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border">

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">1. Escolha a Foto</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <Upload className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Clique para carregar foto</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">2. Nome do Pet</label>
                        <input
                            value={petName}
                            onChange={(e) => setPetName(e.target.value)}
                            placeholder="ex: Bobby"
                            className="w-full border p-2 rounded-lg font-serif"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">3. Legenda</label>
                        <input
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full border p-2 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">4. Formato</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTemplate("STORY")}
                                className={`flex-1 py-2 rounded-lg border ${template === "STORY" ? "bg-blue-50 border-blue-500 text-blue-700 font-bold" : "text-gray-600"}`}
                            >
                                Story (9:16)
                            </button>
                            <button
                                onClick={() => setTemplate("CLASSIC")}
                                className={`flex-1 py-2 rounded-lg border ${template === "CLASSIC" ? "bg-blue-50 border-blue-500 text-blue-700 font-bold" : "text-gray-600"}`}
                            >
                                Post (1:1)
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={!image}
                        className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-black transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Download className="w-5 h-5" />
                        Baixar Imagem
                    </button>

                </div>

                {/* RIGHT: PREVIEW */}
                <div className="bg-gray-200 rounded-xl p-4 flex items-center justify-center min-h-[500px] overflow-hidden">
                    {image ? (
                        <canvas
                            ref={canvasRef}
                            className="max-w-full max-h-[600px] shadow-2xl rounded-sm"
                        />
                    ) : (
                        <div className="text-center text-gray-500">
                            <Wand2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>O resultado vai aparecer aqui!</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
