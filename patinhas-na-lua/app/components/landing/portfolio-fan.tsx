import Image from "next/image";

export default function PortfolioFan() {
  return (
    <div className="relative h-80 w-64 mx-auto md:mx-0 mt-10">
      {/* Image 1 (Left) */}
      <div className="absolute top-0 left-0 w-48 h-64 bg-white border-2 border-black p-2 transform -rotate-12 hover:-rotate-6 transition duration-300 shadow-xl z-10">
        <div className="relative w-full h-full border border-black">
          <Image
            src="https://images.unsplash.com/photo-1596492784531-6e6eb5ea9266?w=400"
            alt="Pet Grooming 1"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 192px, 200px"
          />
        </div>
      </div>

      {/* Image 2 (Right) */}
      <div className="absolute top-4 left-16 w-48 h-64 bg-white border-2 border-black p-2 transform rotate-12 hover:rotate-6 transition duration-300 shadow-xl z-20">
        <div className="relative w-full h-full border border-black">
          <Image
            src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400"
            alt="Pet Grooming 2"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 192px, 200px"
          />
        </div>
      </div>

      {/* Image 3 (Center) */}
      <div className="absolute top-8 left-8 w-48 h-64 bg-white border-2 border-black p-2 transform rotate-0 hover:-translate-y-2 transition duration-300 shadow-2xl z-30">
        <div className="relative w-full h-full border border-black">
          <Image
            src="https://images.unsplash.com/photo-1581888227599-77981198520d?w=400"
            alt="Pet Grooming 3"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 192px, 200px"
          />
        </div>
      </div>
    </div>
  );
}