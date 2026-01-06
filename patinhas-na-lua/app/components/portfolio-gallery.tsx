"use client";

import { useState } from "react";
import Image from "next/image";

type PortfolioImage = {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
};

export default function PortfolioGallery({ images }: { images: PortfolioImage[] }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (images.length === 0) return null;

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setCurrentIndex((currentIndex + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((currentIndex - 1 + images.length) % images.length);
    };

    const currentImage = images[currentIndex];

    return (
        <>
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, index) => (
                    <button
                        key={img.id}
                        onClick={() => openLightbox(index)}
                        className="relative aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-shadow duration-300 group"
                    >
                        <Image
                            src={img.url}
                            alt={img.title || "Trabalho"}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {img.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                <p className="text-white text-sm font-semibold">{img.title}</p>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 z-10"
                    >
                        ×
                    </button>

                    {/* Previous Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                        }}
                        className="absolute left-4 text-white text-6xl font-bold hover:text-gray-300 z-10"
                    >
                        ‹
                    </button>

                    {/* Next Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                        }}
                        className="absolute right-4 text-white text-6xl font-bold hover:text-gray-300 z-10"
                    >
                        ›
                    </button>

                    {/* Image */}
                    <div
                        className="max-w-5xl max-h-[90vh] relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={currentImage.url}
                            alt={currentImage.title || "Trabalho"}
                            width={1200}
                            height={800}
                            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                        />

                        {/* Image Info */}
                        {(currentImage.title || currentImage.description) && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                                {currentImage.title && (
                                    <h3 className="text-white text-xl font-bold mb-1">
                                        {currentImage.title}
                                    </h3>
                                )}
                                {currentImage.description && (
                                    <p className="text-gray-300 text-sm">
                                        {currentImage.description}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Counter */}
                        <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-semibold">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
