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

      {/* MODAL OVERLAY */}
      {isOpen && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
        >
            
            {/* CLOSE BUTTON */}
            <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-3 transition z-50 backdrop-blur-md border border-white/10"
            >
                <X className="w-8 h-8" />
            </button>

            {/* MAIN CONTENT LAYER */}
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                
                {/* PREV BTN */}
                <button 
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 transition z-50 p-4"
                >
                    <ChevronLeft className="w-10 h-10 md:w-16 md:h-16 drop-shadow-lg" />
                </button>

                {/* SLIDES CONTAINER */}
                <div 
                    className="relative w-full max-w-6xl h-[70vh] md:h-[80vh] flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()} 
                >
                    {displayImages.map((img, index) => (
                        <div 
                            key={index}
                            className={`absolute inset-0 transition-all duration-500 ease-out flex items-center justify-center ${
                                index === activeIndex 
                                    ? "opacity-100 scale-100 blur-0 z-20" 
                                    : "opacity-0 scale-95 blur-sm z-10 pointer-events-none"
                            }`}
                        >
                            {/* IMAGE WRAPPER */}
                            <div className="relative w-full h-full p-2"> 
                                <Image 
                                    src={img.url} 
                                    alt={`Gallery Image ${index + 1}`} 
                                    fill
                                    className="object-contain drop-shadow-2xl" 
                                    quality={95}
                                    priority={index === activeIndex}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* NEXT BTN */}
                <button 
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 transition z-50 p-4"
                >
                   <ChevronRight className="w-10 h-10 md:w-16 md:h-16 drop-shadow-lg" />
                </button>

                 {/* INDICATORS (Bottom) */}
                <div 
                    className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-3 bg-black/30 backdrop-blur-md rounded-full border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {displayImages.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                i === activeIndex 
                                    ? "bg-white scale-125 shadow-[0_0_10px_white]" 
                                    : "bg-white/30 hover:bg-white/60"
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