"use client";

import { useState } from "react";
import { submitReview } from "./actions";
import { toast } from "sonner";
import { Star, Upload, X } from "lucide-react";

interface Props {
  appointmentId: string;
}

export default function ReviewModal({ appointmentId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // State for Base64 string
  const [imageBase64, setImageBase64] = useState<string>("");

  // --- COMPRESSION UTILITY (Returns Base64) ---
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const scale = MAX_WIDTH / img.width;
        
        // Only resize if wider than MAX_WIDTH
        if (scale < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context error")); return; }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert directly to Base64
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      
      // Basic size check feedback (optional)
      if(originalFile.size > 15 * 1024 * 1024) {
          toast.error("Imagem muito grande! Tente uma menor que 15MB.");
          return;
      }

      // Show preview immediately with original
      setPreview(URL.createObjectURL(originalFile));
      
      try {
          const base64 = await compressImage(originalFile);
          setImageBase64(base64); // Store encoded string
          setFile(originalFile); // Keep original just for UI logic if needed, but we rely on base64
      } catch (error) {
          console.error("Compression error", error);
          toast.error("Erro ao processar imagem.");
      }
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // Append manual states
      formData.set("appointmentId", appointmentId);
      formData.set("rating", rating.toString());
      
      // We manually append the base64 string if it exists
      if (imageBase64) {
          formData.set("imageBase64", imageBase64);
      }
      
      await submitReview(formData);
      
      toast.success("Obrigado! A tua avaliação foi enviada.");
      setIsOpen(false);
      // Reset
      setFile(null);
      setPreview(null);
      setImageBase64("");
      setRating(5);
    } catch (error) {
      toast.error("Erro ao enviar avaliação.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded font-bold hover:bg-yellow-100 transition flex items-center gap-1"
      >
        <span>⭐</span> Avaliar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-1">Avaliar Serviço</h3>
            <p className="text-sm text-gray-500 mb-6">Como foi a experiência do seu Pet?</p>

            <form action={handleSubmit} className="space-y-6">

              {/* RATING */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating) 
                          ? "fill-yellow-400 text-yellow-500" 
                          : "text-gray-200"
                      }`} 
                    />
                  </button>
                ))}
              </div>

              {/* COMMENT */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Comentário</label>
                <textarea 
                  name="comment"
                  required
                  rows={3}
                  placeholder="A tosquia ficou linda! O Bobby adorou..."
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none resize-none bg-slate-50"
                />
              </div>

              {/* PHOTO UPLOAD */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Foto do Resultado (Opcional)</label>
                
                {!preview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                    <input 
                      type="file" 
                      name="image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 font-medium">Toque para carregar foto</p>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                    <button 
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button 
                disabled={loading}
                className="w-full bg-slate-900 text-white font-bold h-12 rounded-xl hover:bg-black transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "A enviar..." : "Enviar Avaliação"}
              </button>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
