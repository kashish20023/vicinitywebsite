import type { Variants, Transition } from 'framer-motion';

/**
 * Standard FairBnB motion transitions.
 * Fast, subtle, and natural spring/cubic bezier curves.
 */
export const TRANSITION_FAST: Transition = {
  duration: 0.15,
  ease: [0.25, 1, 0.5, 1],
};

export const TRANSITION_DEFAULT: Transition = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1],
};

export const TRANSITION_SPRING: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

/**
 * Page entrance transition variant.
 * Subtle vertical shift (8px) with quick opacity reveal.
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: TRANSITION_DEFAULT,
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: TRANSITION_FAST,
  },
};

/**
 * Simple fade variant.
 */
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: TRANSITION_DEFAULT,
  },
  exit: {
    opacity: 0,
    transition: TRANSITION_FAST,
  },
};

/**
 * Stagger container for lists, metric grids, and dashboard cards.
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

/**
 * Child item variant inside a staggerContainer.
 */
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: TRANSITION_DEFAULT,
  },
};

/**
 * Subtle scale variant for dialogs, popovers, and floating menus.
 */
export const scaleFadeVariants: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: TRANSITION_DEFAULT,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: TRANSITION_FAST,
  },
};

/**
 * Accordion / expandable submenu variant (height + opacity).
 */
export const accordionVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: {
      height: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.15 },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    overflow: 'visible',
    transition: {
      height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.2, delay: 0.05 },
    },
  },
};

/**
 * Interactive micro-motion props for cards and buttons.
 */
export const cardHoverMotion = {
  whileHover: { y: -2, transition: TRANSITION_FAST },
  whileTap: { scale: 0.99 },
};

export const buttonTapMotion = {
  whileTap: { scale: 0.97 },
  transition: TRANSITION_FAST,
};

/**
 * Reduced-motion fallback variants that strip out position shifts.
 */
export const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
