"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type ImageUploaderProps = {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  single?: boolean; // For single image like brand logo
};

export default function ImageUploader({ 
  images, 
  onChange, 
  maxImages = 5, 
  folder = "patinhas-shop",
  single = false
}: ImageUploaderProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey) {
      throw new Error("Cloudinary não está configurado");
    }

    // Get signature from our API
    const signRes = await fetch("/api/sign-cloudinary", { method: "POST" });
    if (!signRes.ok) throw new Error("Erro ao preparar upload");
    const signData = await signRes.json();

    if (!signData.signature) throw new Error("Erro de assinatura");

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", signData.timestamp);
    formData.append("signature", signData.signature);
    formData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || "Upload falhou");
    }

    return result.secure_url;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const currentCount = images.length;
    const availableSlots = single ? 1 : maxImages - currentCount;

    if (availableSlots <= 0) {
      toast.error(`Máximo de ${maxImages} imagens`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map((file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} não é uma imagem`);
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} é muito grande (max 5MB)`);
        }
        return uploadToCloudinary(file);
      });

      const urls = await Promise.all(uploadPromises);
      
      if (single) {
        onChange(urls);
      } else {
        onChange([...images, ...urls]);
      }
      toast.success(`${urls.length} imagem(ns) carregada(s)`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlAdd = () => {
    const url = urlInput.trim();
    if (!url) return;

    // Basic URL validation
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("URL inválido - deve começar com http:// ou https://");
      return;
    }

    if (single) {
      onChange([url]);
    } else {
      if (images.length >= maxImages) {
        toast.error(`Máximo de ${maxImages} imagens`);
        return;
      }
      onChange([...images, url]);
    }
    setUrlInput("");
    toast.success("Imagem adicionada");
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [images]);

  const canAddMore = single ? images.length === 0 : images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Current Images */}
      {images.length > 0 && (
        <div className={`grid gap-3 ${single ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4"}`}>
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square bg-gray-100 rounded-lg group">
              <Image
                src={url}
                alt=""
                fill
                className="object-contain p-2 rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add More */}
      {canAddMore && (
        <div>
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition ${
                mode === "upload"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Carregar Imagem
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition ${
                mode === "url"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Colar URL
            </button>
          </div>

          {mode === "upload" ? (
            /* Drag & Drop Upload */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer relative
                ${isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}
                ${isUploading ? "opacity-50 pointer-events-none" : ""}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={!single}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                  <p className="text-sm text-gray-600">A carregar...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-medium text-gray-700 mb-1">
                    Arraste uma imagem ou clique aqui
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG até 5MB
                  </p>
                </>
              )}
            </div>
          ) : (
            /* URL Input */
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlAdd();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleUrlAdd}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
              >
                Adicionar
              </button>
            </div>
          )}

          {!single && (
            <p className="text-xs text-gray-500 mt-2">
              {images.length}/{maxImages} imagens
            </p>
          )}
        </div>
      )}
    </div>
  );
}
