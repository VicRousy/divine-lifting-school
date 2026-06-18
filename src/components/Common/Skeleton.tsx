import type { CSSProperties } from 'react'

interface SkeletonProps {
  width?: string | number
  height?: number
  borderRadius?: number
  style?: CSSProperties
}

export function Skeleton({ width, height = 16, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      style={{
        width: width || '100%',
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

interface CardSkeletonProps {
  lines?: number
}

export function CardSkeleton({ lines = 3 }: CardSkeletonProps) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', padding: 20, marginBottom: 12 }}>
      <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={20} style={{ marginBottom: 8 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${80 - i * 15}%`} height={14} style={{ marginBottom: 4 }} />
      ))}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #334155' }}>
        <Skeleton width="30%" height={14} />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 16, padding: '12px 20px', borderBottom: r < rows - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${100 / cols}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  )
}
