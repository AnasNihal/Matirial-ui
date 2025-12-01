// 🚀 INSTANT FEEDBACK: Show loading skeleton for integrations page
export default function Loading() {
  return (
    <div className="flex flex-col gap-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-700 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-[#545454] rounded-xl p-6 bg-[#1D1D1D]">
            <div className="h-12 w-12 bg-gray-700 rounded mb-4"></div>
            <div className="h-6 w-32 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-full bg-gray-800 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

