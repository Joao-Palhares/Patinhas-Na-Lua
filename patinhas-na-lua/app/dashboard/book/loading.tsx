
export default function BookLoading() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
            
            {/* Header Steps */}
            <div className="h-14 bg-gray-50 border-b flex items-center px-4 gap-4">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-3 w-16 bg-gray-200 rounded"></div>
                ))}
            </div>
            
            {/* Body */}
            <div className="p-8 space-y-6">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-24 bg-gray-200 rounded-xl border border-gray-100"></div>
                    <div className="h-24 bg-gray-200 rounded-xl border border-gray-100"></div>
                    <div className="h-24 bg-gray-200 rounded-xl border border-gray-100"></div>
                    <div className="h-24 bg-gray-200 rounded-xl border border-gray-100"></div>
                </div>
                
                <div className="h-12 w-full bg-gray-200 rounded-xl mt-4"></div>
            </div>
        </div>
      </div>
    </div>
  );
}
