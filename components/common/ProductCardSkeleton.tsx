export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-48 w-full rounded-md mb-4"></div>
      <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
      <div className="bg-gray-200 h-4 w-1/2 rounded mb-2"></div>
      <div className="bg-gray-200 h-8 w-full rounded"></div>
    </div>
  );
}