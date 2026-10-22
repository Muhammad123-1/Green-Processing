'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Maximize2, Minimize2, ArrowDown, Check } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

/**
 * useInfiniteTable:
 * 10 tadan bosqichma-bosqich yuklash va pastga tushirganda (scroll) avtomatik
 * keyingi 10 tasini chiqarish (Infinite Scroll) hamda xodim xohlaganda
 * "Butun jadvalni ko'rish" tugmasini boshqarish uchun hook.
 */
export function useInfiniteTable<T>(items: T[], pageSize = 10, resetDeps: any[] = []) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [showAll, setShowAll] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Qidiruv yoki filter o'zgarganda sahifalashni 10 taga qaytarish
  useEffect(() => {
    setVisibleCount(pageSize)
    setShowAll(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, ...resetDeps])

  const totalCount = items.length
  const displayedItems = showAll ? items : items.slice(0, visibleCount)
  const hasMore = !showAll && visibleCount < totalCount

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + pageSize, totalCount))
  }, [pageSize, totalCount])

  const toggleShowAll = useCallback(() => {
    setShowAll(prev => {
      const next = !prev
      if (!next) {
        setVisibleCount(pageSize)
      }
      return next
    })
  }, [pageSize])

  // Pastga tushganda avtomatik keyingi 10 tasini chiqarish (IntersectionObserver)
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '120px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return {
    displayedItems,
    visibleCount: displayedItems.length,
    totalCount,
    hasMore,
    showAll,
    sentinelRef,
    loadMore,
    toggleShowAll,
    reset: () => {
      setVisibleCount(pageSize)
      setShowAll(false)
    }
  }
}

interface InfiniteTableFooterProps {
  currentCount: number
  totalCount: number
  hasMore: boolean
  showAll: boolean
  onLoadMore: () => void
  onToggleShowAll: () => void
  sentinelRef?: React.RefObject<HTMLDivElement | null>
  pageSize?: number
  itemName?: { uz: string; ru: string; en: string }
}

export function InfiniteTableFooter({
  currentCount,
  totalCount,
  hasMore,
  showAll,
  onLoadMore,
  onToggleShowAll,
  sentinelRef,
  pageSize = 10,
  itemName = { uz: 'qator', ru: 'строк', en: 'rows' }
}: InfiniteTableFooterProps) {
  const { formatDual } = useLanguage()

  if (totalCount === 0) return null

  const percent = Math.min(100, Math.round((currentCount / totalCount) * 100))

  return (
    <div className="border-t border-dark-700/80 bg-dark-850/60 p-3 sm:p-4">
      {/* Sentinel: Scroll pastga yetganda avtomatik yuklashni trigger qiladi */}
      {sentinelRef && hasMore && (
        <div ref={sentinelRef} className="h-2 w-full pointer-events-none" />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Chap tomon: Qatorlar soni va progress */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-slate-300 font-medium flex items-center gap-1.5">
            <span>{formatDual("Ko'rsatilmoqda:", "Показано:", "Showing:")}</span>
            <span className="font-bold text-white px-2 py-0.5 rounded-md bg-dark-750 border border-dark-700 font-mono">
              {currentCount} / {totalCount}
            </span>
            <span className="text-slate-400">
              {formatDual(itemName.uz, itemName.ru, itemName.en)}
            </span>
            {showAll && (
              <span className="ml-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check size={12} /> {formatDual("To'liq jadval", "Вся таблица", "Full table")}
              </span>
            )}
          </div>

          {/* Progress chizig'i */}
          {!showAll && totalCount > pageSize && (
            <div className="w-24 sm:w-32 bg-dark-750 rounded-full h-1.5 overflow-hidden border border-dark-700/60">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>

        {/* O'ng tomon: Tugmalar */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Scroll hint indikatori */}
          {hasMore && (
            <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 bg-dark-800/80 px-2.5 py-1 rounded-lg border border-dark-700">
              <ArrowDown size={12} className="animate-bounce text-blue-400" />
              <span>{formatDual("Pastga tushiring — avtomatik chiqadi", "Прокрутите вниз — загрузится ещё", "Scroll down to auto-load")}</span>
            </span>
          )}

          {/* Yana 10 ta yuklash tugmasi */}
          {hasMore && (
            <button
              type="button"
              onClick={onLoadMore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-750 hover:bg-dark-700 text-slate-200 hover:text-white border border-dark-700 transition-all hover:border-slate-600 shadow-sm"
            >
              <ChevronDown size={14} className="text-blue-400" />
              <span>{formatDual(`Yana ${pageSize} ta yuklash`, `Ещё ${pageSize}`, `Load ${pageSize} more`)}</span>
            </button>
          )}

          {/* Butun jadvalni ko'rish / 10 tadan ko'rsatish tugmasi */}
          {totalCount > pageSize && (
            <button
              type="button"
              onClick={onToggleShowAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                showAll
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
            >
              {showAll ? (
                <>
                  <Minimize2 size={13} />
                  <span>{formatDual(`${pageSize} tadan ko'rsatish`, `Показать по ${pageSize}`, `Show by ${pageSize}`)}</span>
                </>
              ) : (
                <>
                  <Maximize2 size={13} />
                  <span>{formatDual("Butun jadvalni ko'rish", "Показать всю таблицу", "View full table")}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
