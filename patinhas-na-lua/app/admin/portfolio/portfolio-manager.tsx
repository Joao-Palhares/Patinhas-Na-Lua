"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadPortfolioImage, deletePortfolioImage, togglePortfolioImageVisibility, updatePortfolioImageOrder } from "./actions";
import { toast } from "sonner";

type PortfolioImage = {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
    isPublic: boolean;
    order: number;
    createdAt: Date;
};

export default function PortfolioManager({ initialImages }: { initialImages: PortfolioImage[] }) {
    const [images, setImages] = useState(initialImages);
    const [uploading, setUploading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);

    const [newImage, setNewImage] = useState({
        url: "",
        title: "",
        description: "",
    });

    // --- SIGNED UPLOAD FUNCTION ---
    const handleSignedUpload = async (file: File) => {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

        // DEBUG: Check if variables are loaded
        if (!cloudName || !apiKey) {
            console.error("❌ MISSING VARS:", { cloudName, apiKey });
            throw new Error("Cloudinary Environment Variables are missing! Check .env.local");
        }

        // A. Request Signature from your Backend
        const signRes = await fetch('/api/sign-cloudinary', { method: 'POST' });
        if (!signRes.ok) throw new Error("Failed to generate signature");
        
        const signData = await signRes.json();
        const { signature, timestamp } = signData;

        // B. Prepare the Form Data
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey); 
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        
        // ⚠️ CRITICAL: folder MUST match backend signing!
        formData.append("folder", "patinhas-reviews"); 

        // C. Upload to Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Cloudinary Error Details:", data);
            throw new Error(data.error?.message || "Upload failed");
        }

        console.log("✅ Success:", data.secure_url);
        return data.secure_url;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // DEBUG: Log file details
        console.log("📁 File selected:", file.name);
        console.log("📦 File size:", (file.size / 1024 / 1024).toFixed(2), "MB");
        console.log("📄 File type:", file.type);

        setUploading(true);
        toast.loading("A enviar imagem para Cloudinary...");

        try {
            const url = await handleSignedUpload(file);
            setNewImage({ ...newImage, url });
            toast.dismiss();
            toast.success("Imagem carregada!");
        } catch (error) {
            toast.dismiss();
            toast.error("Erro ao enviar imagem");
        } finally {
            setUploading(false);
        }
    };

    // --- CLIPBOARD PASTE HANDLER ---
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    console.log("📋 Pasted from clipboard:", file.name, (file.size / 1024 / 1024).toFixed(2), "MB");
                    setUploading(true);
                    toast.loading("A enviar imagem colada...");
                    try {
                        const url = await handleSignedUpload(file);
                        setNewImage({ ...newImage, url });
                        toast.dismiss();
                        toast.success("Imagem carregada!");
                    } catch (error) {
                        toast.dismiss();
                        toast.error("Erro ao enviar imagem");
                    } finally {
                        setUploading(false);
                    }
                }
                break;
            }
        }
    };

    // --- RESET FORM ---
    const resetForm = () => {
        setNewImage({ url: "", title: "", description: "" });
        setShowUploadForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newImage.url) return;

        const formData = new FormData();
        formData.append("url", newImage.url);
        formData.append("title", newImage.title);
        formData.append("description", newImage.description);

        try {
            await uploadPortfolioImage(formData);
            toast.success("Imagem adicionada ao portfólio!");
            setNewImage({ url: "", title: "", description: "" });
            setShowUploadForm(false);
            window.location.reload();
        } catch (error) {
            toast.error("Erro ao guardar imagem");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminar esta imagem?")) return;

        try {
            await deletePortfolioImage(id);
            toast.success("Imagem eliminada!");
            window.location.reload();
        } catch (error) {
            toast.error("Erro ao eliminar");
        }
    };

    const handleToggleVisibility = async (id: string) => {
        try {
            await togglePortfolioImageVisibility(id);
            toast.success("Visibilidade atualizada!");
            window.location.reload();
        } catch (error) {
            toast.error("Erro ao atualizar");
        }
    };

    const handleMove = async (id: string, direction: 'up' | 'down') => {
        try {
            await updatePortfolioImageOrder(id, direction);
            window.location.reload();
        } catch (error) {
            toast.error("Erro ao mover");
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Button */}
            <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
                + Adicionar Nova Imagem
            </button>

            {/* Upload Form */}
            {showUploadForm && (
                <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold mb-4">Nova Imagem</h3>
                    <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-4">
                        {/* File Upload with Paste Support */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Escolher Imagem <span className="text-gray-400 font-normal">(ou Ctrl+V para colar)</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={uploading}
                                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {newImage.url ? (
                                <div className="mt-4 relative inline-block">
                                    <Image src={newImage.url} alt="Preview" width={300} height={200} className="rounded-lg shadow-md" />
                                    <button
                                        type="button"
                                        onClick={() => setNewImage({ ...newImage, url: "" })}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                                    Arraste uma imagem ou use Ctrl+V para colar
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Título (opcional)
                            </label>
                            <input
                                type="text"
                                value={newImage.title}
                                onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                                placeholder="Ex: Tosquia de Verão - Max"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Descrição (opcional)
                            </label>
                            <textarea
                                value={newImage.description}
                                onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg h-24"
                                placeholder="Breve descrição do trabalho..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={!newImage.url || uploading}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                            >
                                Guardar
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Images Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((img, index) => (
                    <div key={img.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
                        <div className="relative h-64">
                            <Image src={img.url} alt={img.title || "Portfolio"} fill className="object-cover" />
                            {!img.isPublic && (
                                <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    OCULTA
                                </div>
                            )}
                        </div>

                        <div className="p-4">
                            {img.title && <h4 className="font-bold text-lg mb-1">{img.title}</h4>}
                            {img.description && <p className="text-sm text-gray-600 mb-3">{img.description}</p>}

                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => handleToggleVisibility(img.id)}
                                    className={`px-3 py-1 rounded text-xs font-semibold ${img.isPublic ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {img.isPublic ? "👁️ Visível" : "🙈 Oculta"}
                                </button>

                                <button
                                    onClick={() => handleMove(img.id, 'up')}
                                    disabled={index === 0}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold disabled:opacity-30"
                                >
                                    ↑
                                </button>

                                <button
                                    onClick={() => handleMove(img.id, 'down')}
                                    disabled={index === images.length - 1}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold disabled:opacity-30"
                                >
                                    ↓
                                </button>

                                <button
                                    onClick={() => handleDelete(img.id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold"
                                >
                                    🗑️ Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {images.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">Nenhuma imagem no portfólio ainda.</p>
                    <p className="text-gray-400 text-sm mt-2">Clica em "Adicionar Nova Imagem" para começar!</p>
                </div>
            )}
        </div>
    );
}
