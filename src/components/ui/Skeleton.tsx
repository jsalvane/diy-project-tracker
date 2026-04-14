/** Shimmer loading placeholder */
export function Skeleton({ w = 'w-32', h = 'h-12', className = '' }: { w?: string; h?: string; className?: string }) {
  return <div className={`skeleton ${w} ${h} ${className}`} />;
}
