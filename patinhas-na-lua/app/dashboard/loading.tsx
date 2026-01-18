
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Welcome Banner Skeleton */}
        <div className="h-48 bg-gray-200 rounded-2xl mb-8 animate-pulse"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Card 1 Skeleton */}
             <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
             
             {/* Card 2 Skeleton */}
             <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
             
             {/* Card 3 Skeleton */}
             <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
             
             {/* Card 4 Skeleton */}
             <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
