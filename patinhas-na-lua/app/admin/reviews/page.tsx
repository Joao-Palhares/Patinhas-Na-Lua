import { db } from "@/lib/db";
import { format } from "date-fns";
import { approveReview, deleteReview } from "./actions";
import Image from "next/image";

export default async function AdminReviewsPage() {
  const reviews = await db.review.findMany({
    where: { isPublic: false }, // Pending reviews
    include: {
      appointment: {
        include: {
          user: true,
          pet: true,
          service: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>⭐</span> Moderação de Avaliações
      </h1>

      {reviews.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center text-gray-500 shadow-sm">
          <p>Não há avaliações pendentes.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6">
              
              {/* PHOTO (If exists) */}
              <div className="w-full md:w-48 shrink-0">
                {review.photos && review.photos.length > 0 ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <Image 
                      src={review.photos[0]} 
                      alt="Review result" 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[150px] bg-slate-50 rounded-lg flex items-center justify-center text-gray-300">
                    <span className="text-xs">Sem Foto</span>
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {review.appointment.pet.name} 
                      <span className="text-gray-400 font-normal text-sm ml-2">
                         ({review.appointment.service.name})
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Cliente: {review.appointment.user.name} • {format(review.createdAt, "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex text-yellow-500">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 italic border border-gray-100 mb-4">
                  "{review.comment}"
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3">
                  <form action={deleteReview.bind(null, review.id)}>
                    <button className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">
                      Rejeitar / Apagar
                    </button>
                  </form>
                  <form action={approveReview.bind(null, review.id)}>
                    <button className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition shadow-sm">
                      Aprovar & Publicar ✅
                    </button>
                  </form>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
