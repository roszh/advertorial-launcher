import { Skeleton } from "@/components/ui/skeleton";

export function PublicPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Subtitle */}
          <Skeleton className="h-4 w-32 mb-4" />
          
          {/* Headline */}
          <Skeleton className="h-10 md:h-12 w-full mb-2" />
          <Skeleton className="h-10 md:h-12 w-4/5 mb-2" />
          <Skeleton className="h-10 md:h-12 w-3/5 mb-6" />
          
          {/* Hero content lines */}
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-11/12 mb-8" />
          
          {/* Hero image */}
          <Skeleton className="w-full aspect-video rounded-lg mb-8" />
        </div>
      </div>
      
      {/* Body Sections Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {[1, 2, 3].map((section) => (
            <div key={section} className="space-y-4">
              {/* Section heading */}
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-8 w-2/3 mb-6" />
              
              {/* Section content */}
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-11/12 mb-2" />
              <Skeleton className="h-4 w-4/5 mb-4" />
              
              {/* Optional image */}
              {section % 2 === 0 && (
                <Skeleton className="w-full aspect-video rounded-lg" />
              )}
            </div>
          ))}
          
          {/* CTA Button Skeleton */}
          <div className="flex justify-center pt-8">
            <Skeleton className="h-12 w-64 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
