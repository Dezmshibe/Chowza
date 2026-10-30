import React from 'react';

type SkeletonProps = {
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
};

export const RestaurantCardSkeleton: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#D7E2DA] bg-white">
      <Skeleton className="h-40 w-full rounded-none" />

      <div className="p-4">
        <Skeleton className="h-5 w-3/4" />

        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-2/3" />

        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const FoodCardSkeleton: React.FC = () => {
  return (
    <div className="flex gap-4 rounded-2xl border border-[#D7E2DA] bg-white p-3">
      <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />

      <div className="min-w-0 flex-1">
        <Skeleton className="h-5 w-3/4" />

        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />

        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const RestaurantGridSkeleton: React.FC<{
  count?: number;
}> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <RestaurantCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const FoodListSkeleton: React.FC<{
  count?: number;
}> = ({ count = 6 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <FoodCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const ChowzaPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7FAF7]">
      <style>{`
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
          background: #E8EEE9;
        }

        .skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,.55) 50%,
            transparent 100%
          );
          animation: chowza-shimmer 1.5s infinite;
        }

        @keyframes chowza-shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>

      <div className="border-b border-[#D7E2DA] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-6">
        <Skeleton className="h-10 w-64" />

        <Skeleton className="mt-3 h-4 w-96 max-w-full" />

        <div className="mt-8">
          <RestaurantGridSkeleton count={6} />
        </div>
      </main>
    </div>
  );
};