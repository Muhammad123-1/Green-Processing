import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  variant?: 'text' | 'circular' | 'rounded' | 'rectangular'
  width?: string | number
  height?: string | number
}

/**
 * Base atomic skeleton element with smooth pulse shimmer animation
 */
export function Skeleton({
  className = '',
  variant = 'rounded',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    rectangular: 'rounded-none',
  }

  const customStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  }

  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-dark-750/80 transition-colors ${variantClasses[variant]} ${className}`}
      style={customStyle}
      {...props}
    />
  )
}

/**
 * Skeleton for Top Page Headers (Title, Subtitle, Tags, Action Buttons)
 */
export function PageHeaderSkeleton({ actionButtons = 2 }: { actionButtons?: number }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 sm:p-5 rounded-2xl shadow-xs animate-pulse">
      <div className="flex items-center gap-3.5">
        <Skeleton variant="rounded" className="w-12 h-12 rounded-2xl shrink-0" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-44 sm:w-56" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-64 sm:w-80" />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: actionButtons }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 sm:w-28 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for KPI Summary Cards (e.g. 3 or 4 cards row)
 */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-3 sm:gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-4 rounded-2xl shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for Filter and Search bars
 */
export function FilterBarSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3 rounded-2xl shadow-xs">
      <div className="flex-1 max-w-md">
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}

/**
 * Realistic Table Skeleton with Header and Animated Rows
 */
export function TableSkeleton({
  rows = 8,
  columns = 6,
  showHeader = true,
}: {
  rows?: number
  columns?: number
  showHeader?: boolean
}) {
  const colWidths = ['w-24', 'w-36', 'w-20', 'w-32', 'w-28', 'w-20', 'w-24', 'w-16']

  return (
    <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {showHeader && (
            <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="p-3.5">
                    <Skeleton className={`h-4 ${colWidths[i % colWidths.length]}`} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <td key={cIdx} className="p-3.5">
                    <Skeleton
                      className={`h-4.5 ${
                        cIdx === 0
                          ? 'w-20 font-bold'
                          : cIdx === 1
                          ? 'w-32 sm:w-44'
                          : cIdx === columns - 1
                          ? 'w-12 ml-auto'
                          : colWidths[(cIdx + rIdx) % colWidths.length]
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-slate-100 dark:divide-dark-800 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-48 rounded-xl" />
      </div>
    </div>
  )
}

/**
 * Universal Dashboard Skeleton Page (Used by Next.js loading.tsx)
 */
export function DashboardSkeleton({
  title = "Sahifa yuklanmoqda...",
  cardsCount = 4,
  columns = 6,
  rows = 7,
}: {
  title?: string
  cardsCount?: number
  columns?: number
  rows?: number
}) {
  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeaderSkeleton actionButtons={3} />
      {cardsCount > 0 && <StatCardsSkeleton count={cardsCount} />}
      <FilterBarSkeleton />
      <TableSkeleton rows={rows} columns={columns} />
    </div>
  )
}

/**
 * Spreadsheet Matrix Skeleton (Designed for Prihod / Rashod / Incoming Acts)
 */
export function SpreadsheetSkeleton({
  accentColor = 'amber',
  columnsCount = 8,
  rowsCount = 8,
}: {
  accentColor?: 'amber' | 'blue' | 'emerald'
  columnsCount?: number
  rowsCount?: number
}) {
  const headerBg =
    accentColor === 'amber'
      ? 'bg-amber-500/90'
      : accentColor === 'blue'
      ? 'bg-blue-600/90'
      : 'bg-emerald-600/90'

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Header & Shifter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 p-3 sm:p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-36 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* Spreadsheet Grid Mockup */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`${headerBg} text-white`}>
              <tr>
                <th className="p-3 min-w-[120px]">
                  <div className="h-4 bg-white/30 rounded w-20 animate-pulse" />
                </th>
                {Array.from({ length: columnsCount - 1 }).map((_, i) => (
                  <th key={i} className="p-3 border-l border-white/20">
                    <div className="h-4 bg-white/30 rounded w-16 ml-auto animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
              {Array.from({ length: rowsCount }).map((_, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/40">
                  <td className="p-2.5 border-r border-slate-100 dark:border-dark-800">
                    <Skeleton className="h-5 w-24 font-mono" />
                  </td>
                  {Array.from({ length: columnsCount - 1 }).map((_, cIdx) => (
                    <td key={cIdx} className="p-2 border-r border-slate-100 dark:border-dark-800 text-right">
                      <Skeleton className="h-7 w-full max-w-[90px] ml-auto rounded-lg" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 dark:bg-dark-800 border-t border-slate-200 dark:border-dark-700">
              <tr>
                <td className="p-3">
                  <Skeleton className="h-4 w-16 font-bold" />
                </td>
                {Array.from({ length: columnsCount - 1 }).map((_, cIdx) => (
                  <td key={cIdx} className="p-3 text-right">
                    <Skeleton className="h-4 w-14 ml-auto" />
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
