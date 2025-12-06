// ⚡ Loading skeleton for automation list
export default function AutomationListSkeleton() {
  return (
    <div className="flex flex-col gap-y-3 items-center animate-pulse px-[6px]">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[#1D1D1D] rounded-xl p-5 border-[1px] border-[#545454] w-full"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
              
              {/* Description skeleton */}
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-3"></div>
              
              {/* Keywords skeleton */}
              <div className="flex gap-x-2 mt-3">
                <div className="h-8 w-20 bg-gray-700 rounded-full"></div>
                <div className="h-8 w-24 bg-gray-700 rounded-full"></div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {/* Date skeleton */}
              <div className="h-4 w-24 bg-gray-800 rounded"></div>
              
              {/* Button skeleton */}
              <div className="h-10 w-28 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

