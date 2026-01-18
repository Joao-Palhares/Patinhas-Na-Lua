"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images?: { url: string }[];
}

export default function PortfolioFan({ images = [] }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Fallback images
  const defaultImages = [
    { url: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9266?w=400" },
    { url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400" },
    { url: "https://images.unsplash.com/photo-1581888227599-77981198520d?w=400" }
  ];

  // Logic: Ensure we have at least 3 images for the Fan visual
  // If user has 0 -> Use 3 defaults
  // If user has 1 -> Use 1 real + 2 defaults
  // If user has 12 -> Use 12 real
  let displayImages = images;
  if (images.length === 0) {
      displayImages = defaultImages;
  } else if (images.length < 3) {
      const missingCount = 3 - images.length;
      displayImages = [...images, ...defaultImages.slice(0, missingCount)];
  }

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto md:max-w-md aspect-[4/5] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 group">
        
        {/* CAROUSEL SLIDES */}
        <div className="relative w-full h-full">
            {displayImages.map((img, index) => (
                <div 
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                        index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                >
                    <Image 
                        src={img.url} 
                        alt={`Portfolio ${index + 1}`} 
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                </div>
            ))}
        </div>

        {/* CONTROLS (Visible on hover or mobile) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
             <button 
                onClick={prevSlide}
                className="bg-white/80 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg backdrop-blur transition"
                aria-label="Imagem Anterior"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
                onClick={nextSlide}
                className="bg-white/80 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg backdrop-blur transition"
                aria-label="Próxima Imagem"
            >
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>

        {/* INDICATORS */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {displayImages.map((_, i) => (
                <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Ver imagem ${i + 1}`}
                    className={`nav-dot transition-all duration-300 rounded-full shadow-sm border border-white/20 ${
                        i === activeIndex 
                            ? "w-6 h-1.5 bg-white" 
                            : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                    }`}
                />
            ))}
        </div>

    </div>
  );
}