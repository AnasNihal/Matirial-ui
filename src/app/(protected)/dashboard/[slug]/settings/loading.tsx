// 🚀 INSTANT FEEDBACK: Show loading skeleton for settings page
export default function Loading() {
  return (
    <div className="flex flex-col gap-y-6 animate-pulse">
      <div className="h-8 w-48 bg-app-bg-tertiary rounded"></div>
      <div className="border border-app-border-secondary rounded-xl p-6 bg-app-card-bg">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-app-border">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-app-bg-tertiary rounded"></div>
                <div className="h-4 w-48 bg-app-bg-secondary rounded"></div>
              </div>
              <div className="h-10 w-20 bg-app-bg-tertiary rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

