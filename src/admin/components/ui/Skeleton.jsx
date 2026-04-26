// Shimmer skeleton loader
function SkeletonBox({ className = '' }) {
    return (
        <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
    )
}

export default function DashboardSkeleton() {
    return (
        <div className="p-5 flex flex-col gap-5 pb-8">
            {/* Revenue card */}
            <div>
                <SkeletonBox className="h-3 w-28 mb-3" />
                <div className="bg-white rounded-2xl border border-black/5 p-4 flex flex-col gap-3">
                    <SkeletonBox className="h-8 w-full rounded-lg" />
                    <SkeletonBox className="h-5 w-32" />
                    <SkeletonBox className="h-[130px] w-full rounded-xl" />
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-black/5 p-4 flex flex-col gap-2">
                        <div className="flex justify-between">
                            <SkeletonBox className="h-3 w-20" />
                            <SkeletonBox className="h-8 w-8 rounded-xl" />
                        </div>
                        <SkeletonBox className="h-7 w-16" />
                        <SkeletonBox className="h-3 w-24" />
                    </div>
                ))}
            </div>

            {/* Members chart */}
            <div>
                <SkeletonBox className="h-3 w-36 mb-3" />
                <div className="bg-white rounded-2xl border border-black/5 p-4">
                    <SkeletonBox className="h-[140px] w-full rounded-xl" />
                </div>
            </div>

            {/* Meetings donut */}
            <div>
                <SkeletonBox className="h-3 w-32 mb-3" />
                <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-4">
                    <SkeletonBox className="w-[110px] h-[110px] rounded-full flex-shrink-0" />
                    <div className="flex flex-col gap-3 flex-1">
                        <SkeletonBox className="h-6 w-24" />
                        <SkeletonBox className="h-6 w-20" />
                    </div>
                </div>
            </div>

            {/* Ratings */}
            <div>
                <SkeletonBox className="h-3 w-36 mb-3" />
                <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-3">
                    <SkeletonBox className="w-[130px] h-[130px] rounded-full flex-shrink-0" />
                    <div className="flex flex-col gap-3 flex-1">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <SkeletonBox className="h-3 w-20" />
                                <SkeletonBox className="h-3 w-8" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gender */}
            <div>
                <SkeletonBox className="h-3 w-36 mb-3" />
                <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-4">
                    <SkeletonBox className="w-[120px] h-[120px] rounded-full flex-shrink-0" />
                    <div className="flex flex-col gap-4 flex-1">
                        <SkeletonBox className="h-6 w-full" />
                        <SkeletonBox className="h-px w-full" />
                        <SkeletonBox className="h-6 w-full" />
                        <SkeletonBox className="h-2 w-full rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}
