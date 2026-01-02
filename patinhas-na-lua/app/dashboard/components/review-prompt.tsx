"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions/reviews";
import { toast } from "sonner";

interface ReviewPromptProps {
    appointmentId: string;
    petName: string;
    serviceName: string;
}

export function ReviewPrompt({ appointmentId, petName, serviceName }: ReviewPromptProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // Hidden state if user dismisses? (Not implemented, basic version)

    const handleSubmit = async () => {
        if (rating === 0) return toast.error("Selecione uma classificação!");

        setSubmitting(true);
        try {
            await submitReview(appointmentId, rating, comment);
            setDone(true);
            toast.success("Obrigado pela sua opinião!");
        } catch (e) {
            toast.error("Erro ao enviar avaliação.");
        } finally {
            setSubmitting(false);
        }
    };

    if (done) return null; // Disappear when done

    return (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col md:flex-row gap-6 items-center">

                {/* Left: Text */}
                <div className="text-center md:text-left flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                        Como correu a visita do {petName}? 🐾
                    </h3>
                    <p className="text-sm text-gray-600">
                        Dê-nos a sua opinião sobre o serviço <span className="font-medium">"{serviceName}"</span>.
                    </p>
                </div>

                {/* Right: Stars & Form */}
                <div className="flex flex-col gap-3 w-full md:w-auto min-w-[300px]">

                    {/* Stars */}
                    <div className="flex justify-center md:justify-start gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    className={`w-8 h-8 ${rating >= star ? "fill-yellow-400 text-yellow-500" : "fill-transparent text-gray-300"}`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Comment & Submit */}
                    {rating > 0 && (
                        <div className="animate-in fade-in zoom-in duration-300 space-y-2">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Escreva um comentário (opcional)..."
                                className="w-full text-sm p-3 rounded-lg border border-yellow-200 focus:border-yellow-400 outline-none resize-none h-20 bg-white"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-yellow-400 text-yellow-900 font-bold py-2 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                            >
                                {submitting ? "A enviar..." : "Enviar Avaliação"}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
