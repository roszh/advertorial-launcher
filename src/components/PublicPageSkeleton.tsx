import { Skeleton } from "@/components/ui/skeleton";

export const PublicPageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section - Progressive shimmer */}
      <div className="space-y-4 mb-12 animate-in fade-in duration-500">
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-12 md:h-16 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-2/3 mx-auto" />
        <Skeleton className="w-full aspect-video rounded-lg mt-8" />
      </div>

      {/* Body Sections - Staggered loading effect */}
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="space-y-4 mb-8"
        >
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          {i % 2 === 0 && (
            <Skeleton className="w-full aspect-video rounded-lg mt-4" />
          )}
        </div>
      ))}

      {/* CTA */}
      <div className="flex justify-center mt-12">
        <Skeleton className="h-14 w-56 rounded-lg" />
      </div>
    </div>
  </div>
);