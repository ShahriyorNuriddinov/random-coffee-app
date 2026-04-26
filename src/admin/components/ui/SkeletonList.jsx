// Generic skeleton for list screens (Members, Moments, Notifications)
function Box({ className = '' }) {
    return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
}

// Members list skeleton
export function MembersSkeleton() {
    return (
        <div className="p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Box className="h-3 w-32" />
                <Box className="h-3 w-20" />
            </div>
            {/* Search */}
            <Box className="h-11 w-full rounded-xl" />
            {/* Tabs */}
            <Box className="h-9 w-full rounded-xl" />
            {/* Group label */}
            <Box className="h-3 w-16" />
            {/* Rows */}
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < 4 ? 'border-b border-black/5' : ''}`}>
                        <Box className="w-9 h-9 rounded-full flex-shrink-0" />
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Box className="h-3.5 w-28" />
                            <Box className="h-3 w-20" />
                        </div>
                        <Box className="h-5 w-12 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Moments skeleton
export function MomentsSkeleton() {
    return (
        <div className="p-5 flex flex-col gap-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-3 border border-black/5 flex flex-col items-center gap-1.5">
                        <Box className="h-5 w-10" />
                        <Box className="h-2.5 w-14" />
                    </div>
                ))}
            </div>
            {/* Tabs */}
            <Box className="h-9 w-full rounded-xl" />
            <Box className="h-3 w-24" />
            {/* Cards */}
            {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                    <Box className="h-48 w-full rounded-none" />
                    <div className="p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Box className="w-7 h-7 rounded-full" />
                            <Box className="h-3 w-24" />
                        </div>
                        <Box className="h-3 w-full" />
                        <Box className="h-3 w-3/4" />
                        <div className="flex gap-3 pt-2 border-t border-black/5">
                            <Box className="flex-1 h-10 rounded-xl" />
                            <Box className="flex-1 h-10 rounded-xl" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

// Notifications skeleton
export function NotificationsSkeleton() {
    return (
        <div className="flex flex-col gap-3 p-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-black/[0.08] p-4 flex gap-3">
                    <Box className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex justify-between">
                            <Box className="h-4 w-36" />
                            <Box className="h-3 w-12" />
                        </div>
                        <Box className="h-3 w-full" />
                        <Box className="h-3 w-3/4" />
                        <div className="flex justify-between mt-1">
                            <Box className="h-3 w-20" />
                            <Box className="h-4 w-14 rounded-md" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
