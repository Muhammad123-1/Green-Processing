/**
 * Green Processing ERP - Centralized Motion & Animation System
 * Designed for 60 FPS performance, subtle enterprise polish, and strict accessibility.
 * Prioritizes GPU-accelerated properties (transform, opacity) and avoids layout reflows.
 */

// ============================================================================
// 1. DURATION CONSTANTS (per ERP specification)
// ============================================================================
export const MOTION_DURATIONS = {
  /** 100–150ms: Click feedback, tooltips, button states, micro icons */
  micro: 0.12,
  /** 150–200ms: Dropdowns, toolbars, badges, card transitions */
  standard: 0.18,
  /** 200–250ms: Drawers, modals, accordion expand/collapse, sidebar */
  expand: 0.22,
  /** 300–500ms: Data charts, KPI progress bars, multi-step drill-downs */
  chart: 0.4,
} as const

// ============================================================================
// 2. EASING CURVES (Cubic-bezier for GPU hardware acceleration)
// ============================================================================
export const MOTION_EASINGS = {
  /** Fluid enterprise deceleration - ideal for entrances */
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Smooth acceleration/deceleration - ideal for accordions & tabs */
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Natural snappy spring for cards, buttons, and modals */
  springSnappy: { type: 'spring', stiffness: 400, damping: 32 } as const,
  /** Gentle spring for drawers and sidebars */
  springGentle: { type: 'spring', stiffness: 280, damping: 28 } as const,
} as const

// ============================================================================
// 3. REUSABLE ANIMATION PRESETS
// ============================================================================

/** Simple fade in (opacity only - zero layout reflow) */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.standard,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeInOut,
    },
  },
}

/** Fade out transition */
export const fadeOut = {
  initial: { opacity: 1 },
  animate: { opacity: 0, transition: { duration: MOTION_DURATIONS.standard, ease: MOTION_EASINGS.easeInOut } },
  exit: { opacity: 0, transition: { duration: MOTION_DURATIONS.micro } },
}

/**
 * Slide in with custom direction (GPU accelerated translate3d)
 * @param direction 'up' | 'down' | 'left' | 'right'
 * @param distance pixels to offset (defaults to subtle 8-12px)
 */
export const slideIn = (
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance = 10
) => {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x'
  const offset = direction === 'up' || direction === 'left' ? distance : -distance

  return {
    initial: {
      opacity: 0,
      [axis]: offset,
    },
    animate: {
      opacity: 1,
      [axis]: 0,
      transition: {
        duration: MOTION_DURATIONS.standard,
        ease: MOTION_EASINGS.easeOut,
      },
    },
    exit: {
      opacity: 0,
      [axis]: offset,
      transition: {
        duration: MOTION_DURATIONS.micro,
        ease: MOTION_EASINGS.easeInOut,
      },
    },
  }
}

/** Scale in modal/dialog preset (from 0.96 scale to 1.0) */
export const scaleIn = {
  initial: {
    opacity: 0,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: MOTION_DURATIONS.expand,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeInOut,
    },
  },
}

/** Expand & collapse for accordions, filters, and sub-menus */
export const expandCollapse = {
  initial: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: MOTION_DURATIONS.expand,
        ease: MOTION_EASINGS.easeOut,
      },
      opacity: {
        duration: MOTION_DURATIONS.standard,
        ease: MOTION_EASINGS.easeOut,
      },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: MOTION_DURATIONS.standard,
        ease: MOTION_EASINGS.easeInOut,
      },
      opacity: {
        duration: MOTION_DURATIONS.micro,
        ease: MOTION_EASINGS.easeInOut,
      },
    },
  },
}

/** Stagger container for KPI cards or quick actions */
export const staggerChildren = (staggerDelay = 0.04, delayChildren = 0) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
})

/** Tactile hover & tap feedback for interactive cards */
export const hoverLift = {
  whileHover: {
    y: -2,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: 'easeOut' as const,
    },
  },
  whileTap: {
    y: 0,
    scale: 0.99,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: 'easeOut' as const,
    },
  },
} as const

/** Modal Backdrop Animation (Fade + backdrop blur) */
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.standard,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeInOut,
    },
  },
}

/** Modal Dialog Content Animation */
export const modalContent = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 6,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.expand,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 6,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeInOut,
    },
  },
}

/** Drawer slide-in from right or left */
export const drawerContent = (side: 'right' | 'left' = 'right') => ({
  initial: {
    x: side === 'right' ? '100%' : '-100%',
    opacity: 0.5,
  },
  animate: {
    x: '0%',
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.expand,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    x: side === 'right' ? '100%' : '-100%',
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.standard,
      ease: MOTION_EASINGS.easeInOut,
    },
  },
})

/** Dropdown menu entrance (scale + subtle down slide) */
export const dropdownMenu = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -4,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.standard,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeInOut,
    },
  },
}

/** Tab content transition */
export const tabTransition = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.standard,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeInOut,
    },
  },
}
