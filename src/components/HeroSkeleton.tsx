import { Skeleton } from "./ui/skeleton";

export const HeroSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 animate-in fade-in duration-300">
    <div className="text-center mb-6 md:mb-8">
      <Skeleton className="h-4 w-32 mx-auto mb-3" />
      <Skeleton className="h-12 md:h-16 w-full max-w-3xl mx-auto mb-4" />
      <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
    </div>
    <Skeleton className="w-full aspect-video rounded-lg" />
  </div>
);