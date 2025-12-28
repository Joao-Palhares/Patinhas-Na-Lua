export default function PortfolioFan() {
  return (
    <div className="relative h-80 w-64 mx-auto md:mx-0 mt-10">
      {/* Image 1 (Left) */}
      <div className="absolute top-0 left-0 w-48 h-64 bg-white border-2 border-black p-2 transform -rotate-12 hover:-rotate-6 transition duration-300 shadow-xl z-10">
        <img src="https://images.unsplash.com/photo-1596492784531-6e6eb5ea9266?w=400" className="w-full h-full object-cover border border-black" />
      </div>
      
      {/* Image 2 (Right) */}
      <div className="absolute top-4 left-16 w-48 h-64 bg-white border-2 border-black p-2 transform rotate-12 hover:rotate-6 transition duration-300 shadow-xl z-20">
        <img src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400" className="w-full h-full object-cover border border-black" />
      </div>

      {/* Image 3 (Center) */}
      <div className="absolute top-8 left-8 w-48 h-64 bg-white border-2 border-black p-2 transform rotate-0 hover:-translate-y-2 transition duration-300 shadow-2xl z-30">
        <img src="https://images.unsplash.com/photo-1581888227599-77981198520d?w=400" className="w-full h-full object-cover border border-black" />
      </div>
    </div>
  );
}