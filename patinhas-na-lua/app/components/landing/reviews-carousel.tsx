"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const REVIEWS = [
  {
    id: 1,
    text: "O melhor sítio para deixar o meu cão! Ele volta sempre feliz e cheiroso. A equipa é 5 estrelas e nota-se que gostam mesmo de animais.",
    author: "João M.",
    role: "Cliente Recorrente",
    stars: 5,
    avatar: "https://i.pravatar.cc/100?img=11"
  },
  {
    id: 2,
    text: "A minha gata Mia é super tímida, mas senti que foi tratada com muito carinho. O serviço de grooming é impecável.",
    author: "Ana P.",
    role: "Dona de Gato",
    stars: 5,
    avatar: "https://i.pravatar.cc/100?img=5"
  },
  {
    id: 3,
    text: "Equipa fantástica e espaço muito seguro. Recomendo vivamente a todos os que procuram qualidade e confiança.",
    author: "Carlos S.",
    role: "Entusiasta de Cães",
    stars: 5,
    avatar: "https://i.pravatar.cc/100?img=3"
  }
];

export function ReviewsCarousel() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);

  const handleNext = () => {
    setFade(true);
    setTimeout(() => {
        setIndex((i) => (i + 1) % REVIEWS.length);
        setFade(false);
    }, 200);
  };

  const handlePrev = () => {
    setFade(true);
    setTimeout(() => {
        setIndex((i) => (i - 1 + REVIEWS.length) % REVIEWS.length);
        setFade(false);
    }, 200);
  };

  const review = REVIEWS[index];

  return (
    <div className="relative max-w-lg mx-auto md:mx-0">
      <div 
        className={`bg-white/40 backdrop-blur-md p-8 rounded-2xl border border-white/20 relative shadow-sm min-h-[280px] flex flex-col justify-between transition-opacity duration-200 ${fade ? 'opacity-50' : 'opacity-100'}`}
      >
         {/* Content */}
         <div>
            <div className="flex gap-1 mb-4">
              {[...Array(review.stars)].map((_, i) => (
                 <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            <p className="text-lg italic font-serif text-foreground/90 mb-6 leading-relaxed">
              "{review.text}"
            </p>
         </div>

         {/* Author */}
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-500 rounded-full overflow-hidden shadow-sm">
               <img src={review.avatar} alt={review.author} className="w-full h-full object-cover" />
            </div>
            <div>
               <p className="font-bold text-sm text-foreground">{review.author}</p>
               <p className="text-xs text-foreground/70">{review.role}</p>
            </div>
         </div>
      </div>

      {/* Controls */}
      <>
         <button 
            onClick={handlePrev} 
            className="absolute top-1/2 -left-5 -translate-y-1/2 p-3 rounded-full bg-white text-foreground transition shadow-md border border-white/40 hover:scale-110 active:scale-95 z-20 hidden md:flex"
            aria-label="Anterior"
         >
            <ChevronLeft className="w-5 h-5" />
         </button>
         <button 
            onClick={handleNext} 
            className="absolute top-1/2 -right-5 -translate-y-1/2 p-3 rounded-full bg-white text-foreground transition shadow-md border border-white/40 hover:scale-110 active:scale-95 z-20 hidden md:flex"
            aria-label="Próximo"
         >
            <ChevronRight className="w-5 h-5" />
         </button>

         {/* Mobile Controls (Keep bottom for small screens) */}
         <div className="flex md:hidden gap-3 mt-6 justify-center">
             <button onClick={handlePrev} className="p-3 rounded-full bg-white/60 shadow-sm" aria-label="Review Anterior"><ChevronLeft className="w-5 h-5"/></button>
             <button onClick={handleNext} className="p-3 rounded-full bg-white/60 shadow-sm" aria-label="Próximo Review"><ChevronRight className="w-5 h-5"/></button>
         </div>
      </>
    </div>
  );
}
