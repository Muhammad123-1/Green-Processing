'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, HTMLMotionProps } from 'motion/react'
import {
  fadeIn,
  slideIn,
  hoverLift,
  staggerChildren,
  modalBackdrop,
  modalContent,
  drawerContent,
  dropdownMenu,
  expandCollapse,
  tabTransition,
} from '@/lib/motion'

/**
 * Hook to detect prefers-reduced-motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => setPrefersReduced(event.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}

/**
 * Reusable animated card for Dashboard & Director KPIs
 */
export interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  enableHover?: boolean
  className?: string
  delay?: number
}

export function AnimatedCard({
  children,
  enableHover = true,
  className = '',
  delay = 0,
  ...props
}: AnimatedCardProps) {
  const shouldReduce = usePrefersReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.18,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={!shouldReduce && enableHover ? { y: -2, transition: { duration: 0.12, ease: 'easeOut' } } : undefined}
      whileTap={!shouldReduce && enableHover ? { y: 0, scale: 0.99, transition: { duration: 0.12, ease: 'easeOut' } } : undefined}
      className={`will-change-transform ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger container for lists, grids, or KPI groupings
 */
export function AnimatedStaggerContainer({
  children,
  className = '',
  staggerDelay = 0.03,
  delayChildren = 0,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  delayChildren?: number
}) {
  const shouldReduce = usePrefersReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? false : 'initial'}
      animate="animate"
      variants={shouldReduce ? undefined : staggerChildren(staggerDelay, delayChildren)}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Animated Modal Wrapper with fluid AnimatePresence and hardware acceleration
 */
export function AnimatedModal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  className = '',
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  className?: string
}) {
  const shouldReduce = usePrefersReducedMotion()

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            variants={shouldReduce ? undefined : modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            variants={shouldReduce ? undefined : modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 w-full ${maxWidth} bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-750 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] will-change-transform ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Animated Side Drawer
 */
export function AnimatedDrawer({
  isOpen,
  onClose,
  side = 'right',
  children,
  className = '',
}: {
  isOpen: boolean
  onClose: () => void
  side?: 'right' | 'left'
  children: React.ReactNode
  className?: string
}) {
  const shouldReduce = usePrefersReducedMotion()

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            variants={shouldReduce ? undefined : modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer Body */}
          <motion.div
            variants={shouldReduce ? undefined : drawerContent(side)}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`fixed inset-y-0 ${
              side === 'right' ? 'right-0' : 'left-0'
            } z-50 w-full max-w-md bg-white dark:bg-dark-900 border-${
              side === 'right' ? 'l' : 'r'
            } border-slate-200 dark:border-dark-750 shadow-2xl flex flex-col will-change-transform ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Animated Dropdown Menu Wrapper
 */
export function AnimatedDropdown({
  isOpen,
  children,
  className = '',
}: {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}) {
  const shouldReduce = usePrefersReducedMotion()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={shouldReduce ? undefined : dropdownMenu}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`will-change-transform ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Tab Content Transition Container
 */
export function AnimatedTabPanel({
  tabKey,
  children,
  className = '',
}: {
  tabKey: string
  children: React.ReactNode
  className?: string
}) {
  const shouldReduce = usePrefersReducedMotion()

  return (
    <motion.div
      key={tabKey}
      variants={shouldReduce ? undefined : tabTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  )
}

/**
 * Accordion / Collapsible Content Transition
 */
export function AnimatedAccordion({
  isExpanded,
  children,
  className = '',
}: {
  isExpanded: boolean
  children: React.ReactNode
  className?: string
}) {
  const shouldReduce = usePrefersReducedMotion()

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          variants={shouldReduce ? undefined : expandCollapse}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`overflow-hidden will-change-transform ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
