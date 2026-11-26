'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface DropdownOption<T = string | number> {
  value: T
  label: string
}

interface CustomDropdownProps<T = string | number> {
  value: T
  onChange: (val: T) => void
  options: DropdownOption<T>[]
  prefix?: string
  icon?: React.ReactNode
  className?: string
  buttonClassName?: string
  menuClassName?: string
  placeholder?: string
}

export default function CustomDropdown<T extends string | number>({
  value,
  onChange,
  options,
  prefix,
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  placeholder = 'Tanlang'
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${buttonClassName || 'bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-dark-600 shadow-xs'}`}
      >
        {icon}
        {prefix && <span className="opacity-70 text-[11px] font-semibold">{prefix}</span>}
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-1.5 z-50 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl shadow-xl p-1 min-w-[160px] max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={13} className="shrink-0 text-indigo-600 dark:text-indigo-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
