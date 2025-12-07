// ⚡ Loading skeleton for automation builder
export default function AutomationBuilderSkeleton() {
  return (
    <div className="flex flex-col gap-y-8 animate-pulse">
      {/* TOP BAR SKELETON */}
      <div className="flex items-center justify-between gap-x-4 bg-app-card-bg border border-app-border rounded-2xl px-5 py-4">
        <div className="flex items-center gap-x-3">
          <div className="w-10 h-10 bg-app-bg-tertiary rounded-full"></div>
          <div>
            <div className="h-3 w-20 bg-app-bg-secondary rounded mb-2"></div>
            <div className="h-5 w-32 bg-app-bg-tertiary rounded"></div>
          </div>
        </div>
        <div className="h-10 w-32 bg-app-bg-tertiary rounded-full"></div>
      </div>

      {/* MAIN GRID SKELETON */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* PHONE PREVIEW SKELETON */}
        <div className="flex justify-center">
          <div className="w-[300px] h-[600px] bg-app-card-bg border border-app-border-secondary rounded-3xl"></div>
        </div>

        {/* PANELS SKELETON */}
        <div className="flex flex-col gap-4">
          {/* Step indicators */}
          <div className="flex gap-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 bg-app-bg-tertiary rounded-full"></div>
            ))}
          </div>

          {/* Panel cards */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-app-border bg-app-card-bg p-4">
              <div className="h-5 w-40 bg-app-bg-tertiary rounded mb-3"></div>
              <div className="h-4 w-full bg-app-bg-secondary rounded mb-2"></div>
              <div className="h-32 bg-app-bg-tertiary rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

