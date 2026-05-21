const Skeleton = ({ className = '', rounded = false }) => {
    return (
        <div
            className={`bg-surface-hover animate-shimmer ${rounded ? 'rounded-full' : 'rounded-xl'} ${className}`}
        />
    );
};

export const PropertyCardSkeleton = () => (
    <div className="glass-card overflow-hidden">
        <Skeleton className="w-full h-48" />
        <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
        </div>
    </div>
);

export const DashboardSkeleton = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card p-6 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
        <div className="glass-card p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    </div>
);

export const AppLoadingSkeleton = () => (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-royal-600 to-gold-500 flex items-center justify-center animate-pulse">
                <span className="text-2xl font-display font-bold text-white">SX</span>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-3 w-24 mx-auto" />
            </div>
        </div>
    </div>
);

export default Skeleton;
