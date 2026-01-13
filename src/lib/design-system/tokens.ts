/**
 * @fileoverview Design System Tokens
 * Core design tokens for the Premium Data Platform
 * 
 * These tokens define the visual language of the platform:
 * - Typography scale and font families
 * - Spacing rhythm
 * - Color semantics
 * - Animation timing
 * - Shadows and elevation
 */

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  // Font families - Editorial, sophisticated feel
  fonts: {
    display: 'var(--font-display, "Inter", system-ui, sans-serif)',
    body: 'var(--font-body, "Inter", system-ui, sans-serif)',
    mono: 'var(--font-mono, "JetBrains Mono", "Fira Code", monospace)',
  },
  
  // Type scale - Based on 1.25 ratio (Major Third)
  scale: {
    '2xs': '0.625rem',   // 10px
    xs: '0.75rem',       // 12px
    sm: '0.875rem',      // 14px
    base: '1rem',        // 16px
    lg: '1.125rem',      // 18px
    xl: '1.25rem',       // 20px
    '2xl': '1.5rem',     // 24px
    '3xl': '1.875rem',   // 30px
    '4xl': '2.25rem',    // 36px
    '5xl': '3rem',       // 48px
    '6xl': '3.75rem',    // 60px
  },
  
  // Font weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  leading: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  tracking: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  // Base unit: 4px
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const;

// ============================================================================
// COLOR SEMANTICS
// ============================================================================

export const colors = {
  // Semantic status colors
  status: {
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    error: 'hsl(var(--destructive))',
    info: 'hsl(var(--info))',
    neutral: 'hsl(var(--muted))',
  },
  
  // Relationship health indicators
  health: {
    excellent: 'hsl(var(--emerald))',
    good: 'hsl(var(--blue))',
    fair: 'hsl(var(--amber))',
    poor: 'hsl(var(--orange))',
    critical: 'hsl(var(--rose))',
  },
  
  // Data visualization palette
  chart: {
    primary: 'hsl(var(--chart-1))',
    secondary: 'hsl(var(--chart-2))',
    tertiary: 'hsl(var(--chart-3))',
    quaternary: 'hsl(var(--chart-4))',
    quinary: 'hsl(var(--chart-5))',
  },
  
  // Intelligence/Analysis categories
  intel: {
    ai: 'hsl(var(--violet))',
    biometric: 'hsl(var(--cyan))',
    social: 'hsl(var(--blue))',
    behavioral: 'hsl(var(--indigo))',
    network: 'hsl(var(--emerald))',
    security: 'hsl(var(--rose))',
  },
} as const;

// ============================================================================
// ANIMATION TIMING
// ============================================================================

export const animation = {
  // Duration tokens
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },
  
  // Easing functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Spring-like
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    // Bounce
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ============================================================================
// ELEVATION / SHADOWS
// ============================================================================

export const elevation = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // Premium glow effects
  glow: {
    primary: '0 0 20px hsl(var(--primary) / 0.3)',
    success: '0 0 20px hsl(var(--success) / 0.3)',
    warning: '0 0 20px hsl(var(--warning) / 0.3)',
    error: '0 0 20px hsl(var(--destructive) / 0.3)',
  },
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radius = {
  none: '0',
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  '2xl': 'calc(var(--radius) + 8px)',
  '3xl': 'calc(var(--radius) + 12px)',
  full: '9999px',
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
  '3xl': '1920px',
} as const;

// ============================================================================
// COMPONENT SIZING
// ============================================================================

export const componentSizes = {
  // Touch targets
  touchTarget: {
    min: '44px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '56px',
  },
  
  // Icon sizes
  icon: {
    xs: '12px',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  
  // Avatar sizes
  avatar: {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '64px',
    '2xl': '96px',
    '3xl': '128px',
  },
  
  // Input heights
  input: {
    sm: '32px',
    md: '40px',
    lg: '48px',
  },
} as const;

// ============================================================================
// DATA DENSITY MODES
// ============================================================================

export const density = {
  compact: {
    padding: spacing[2],
    gap: spacing[1],
    fontSize: typography.scale.xs,
  },
  comfortable: {
    padding: spacing[4],
    gap: spacing[3],
    fontSize: typography.scale.sm,
  },
  spacious: {
    padding: spacing[6],
    gap: spacing[4],
    fontSize: typography.scale.base,
  },
} as const;

// Export all tokens as a unified design system object
export const designTokens = {
  typography,
  spacing,
  colors,
  animation,
  elevation,
  radius,
  zIndex,
  breakpoints,
  componentSizes,
  density,
} as const;

export type DesignTokens = typeof designTokens;
