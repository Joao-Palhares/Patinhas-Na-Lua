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
  // State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const UPLOAD_PRESET = "patinhas_unsigned"; // User must create this!
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const uploadImageToCloudinary = async (fileToUpload: File) => {
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("upload_preset", UPLOAD_PRESET); 

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Upload failed");
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // 1. Upload Image Client-Side if exists
      let uploadedUrl = "";
      if (file) {
          try {
             // toast.info("A carregar foto...");
             uploadedUrl = await uploadImageToCloudinary(file);
          } catch (err: any) {
             console.error("Cloudinary Error:", err);
             toast.error(`Erro no upload: ${err.message}`);
             setLoading(false);
             return;
          }
      }

      // 2. Submit Review with URL
      // We perform a "hidden" append because we are reusing the Server Action formData
      formData.set("appointmentId", appointmentId);
      formData.set("rating", rating.toString());
      if (uploadedUrl) {
          formData.set("photoUrl", uploadedUrl);
      }
      
      // Remove raw file to avoid sending it to server (waste of bandwidth)
      formData.delete("image");
      
      await submitReview(formData);
      
      toast.success("Obrigado! A tua avaliação foi enviada. 🌟");
      setIsOpen(false);
      setFile(null);
      setPreview(null);
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
