interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Bloco genérico com shimmer — a classe .skeleton está em index.css. */
export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`skeleton rounded-md ${className}`} style={style} />;
}

export function SummaryCardSkeleton() {
  return (
    <div className="rounded-md border border-line bg-surface pb-4 pt-5 px-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-7 w-28" />
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="bg-surface border border-line rounded-md p-5">
      <Skeleton className="h-4 w-48 mb-4" />
      <Skeleton style={{ height }} className="w-full" />
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 px-1">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="space-y-2 items-end flex flex-col">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}
