"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  images?: { url: string }[];
}

export default function PortfolioFan({ images = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Visuals for the 3 Fan Cards
  const fanImg1 = displayImages[0].url;
  const fanImg2 = displayImages[1].url;
  const fanImg3 = displayImages[2].url;

  const openGallery = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <>
      <div className="relative h-80 w-64 mx-auto md:mx-0 mt-10 cursor-pointer group" onClick={() => openGallery(0)}>
        
        {/* HINT OVERLAY */}
         <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40 text-blue-600">
            Ver Galeria 📸
         </div>

        {/* Image 1 (Left) */}
        <div 
            onClick={(e) => { e.stopPropagation(); openGallery(0); }}
            className="absolute top-0 left-0 w-48 h-64 bg-white border-2 border-black p-2 transform -rotate-12 group-hover:-rotate-12 group-hover:-translate-x-4 transition duration-300 shadow-xl z-10"
        >
          <div className="relative w-full h-full border border-black">
            <Image
              src={fanImg1}
              alt="Pet Grooming 1"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 192px, 200px"
            />
          </div>
        </div>

        {/* Image 2 (Right) */}
        <div 
            onClick={(e) => { e.stopPropagation(); openGallery(1); }}
            className="absolute top-4 left-16 w-48 h-64 bg-white border-2 border-black p-2 transform rotate-12 group-hover:rotate-12 group-hover:translate-x-4 transition duration-300 shadow-xl z-20"
        >
          <div className="relative w-full h-full border border-black">
            <Image
              src={fanImg2}
              alt="Pet Grooming 2"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 192px, 200px"
            />
          </div>
        </div>

        {/* Image 3 (Center) */}
        <div 
            onClick={(e) => { e.stopPropagation(); openGallery(2); }}
            className="absolute top-8 left-8 w-48 h-64 bg-white border-2 border-black p-2 transform rotate-0 group-hover:-translate-y-4 transition duration-300 shadow-2xl z-30"
        >
          <div className="relative w-full h-full border border-black">
            <Image
              src={fanImg3}
              alt="Pet Grooming 3"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 192px, 200px"
            />
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            
            {/* CLOSE BUTTON */}
            <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition z-50"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="relative w-full max-w-5xl aspect-video md:aspect-[16/9] flex items-center justify-center">
                
                {/* PREV BTN */}
                <button 
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur z-50 transition"
                >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                {/* SLIDES */}
                <div className="relative w-full h-full overflow-hidden rounded-lg shadow-2xl bg-black">
                    {displayImages.map((img, index) => (
                        <div 
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center ${
                                index === activeIndex ? "opacity-100 z-20" : "opacity-0 z-10"
                            }`}
                        >
                            <div className="relative w-full h-full"> 
                                <Image 
                                    src={img.url} 
                                    alt={`Gallery Image ${index + 1}`} 
                                    fill
                                    className="object-contain" 
                                    quality={90}
                                    priority={index === activeIndex}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* NEXT BTN */}
                <button 
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur z-50 transition"
                >
                   <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                 {/* INDICATORS */}
                <div className="absolute -bottom-8 md:-bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                    {displayImages.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                                i === activeIndex ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"
                            }`}
                        />
                    ))}
                </div>

            </div>
        </div>
      )}
    </>
  );
}