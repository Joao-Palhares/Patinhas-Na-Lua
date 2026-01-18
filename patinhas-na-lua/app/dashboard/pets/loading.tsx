
export default function PetsLoading() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        
        {/* LEFT: LIST SKELETON */}
        <div className="space-y-4">
             <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
             {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm animate-pulse h-40">
                   <div className="flex justify-between">
                       <div className="space-y-2">
                           <div className="h-5 w-32 bg-gray-200 rounded"></div>
                           <div className="h-4 w-24 bg-gray-200 rounded"></div>
                       </div>
                       <div className="h-8 w-16 bg-gray-200 rounded"></div>
                   </div>
                   <div className="mt-4 grid grid-cols-2 gap-3">
                       <div className="h-12 bg-gray-100 rounded"></div>
                       <div className="h-12 bg-gray-100 rounded"></div>
                   </div>
                </div>
             ))}
        </div>

        {/* RIGHT: FORM SKELETON */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 h-[600px] sticky top-20 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-5">
                 <div className="h-12 w-full bg-gray-200 rounded"></div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="h-12 bg-gray-200 rounded"></div>
                     <div className="h-12 bg-gray-200 rounded"></div>
                 </div>
                 <div className="h-32 bg-gray-200 rounded"></div>
                 <div className="h-12 w-full bg-gray-200 rounded mt-4"></div>
            </div>
        </div>

      </div>
    </div>
  );
}
