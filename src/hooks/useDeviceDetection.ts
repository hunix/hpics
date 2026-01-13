import { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Check if running in Capacitor native app
const isCapacitorNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// Check for force mobile URL parameter
const hasForceMobileParam = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('forceMobile') === 'true';
};
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type Orientation = 'portrait' | 'landscape';

interface DeviceInfo {
  deviceType: DeviceType;
  screenSize: ScreenSize;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  hasMouse: boolean;
  isStandalone: boolean; // PWA mode
  isSamsung: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenWidth: number;
  screenHeight: number;
  hasNotch: boolean;
}

function getDeviceType(width: number): DeviceType {
  // Force mobile for Capacitor native apps or forceMobile URL param
  if (isCapacitorNative() || hasForceMobileParam()) {
    return 'mobile';
  }
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getScreenSize(width: number): ScreenSize {
  if (width < 475) return 'xs';
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
}

function getOrientation(): Orientation {
  if (typeof window === 'undefined') return 'portrait';
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

function detectSamsung(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('samsung') || ua.includes('sm-');
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function detectAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

function detectNotch(): boolean {
  if (typeof window === 'undefined') return false;
  // Check for safe area insets
  const style = getComputedStyle(document.documentElement);
  const safeAreaTop = parseInt(style.getPropertyValue('--sat') || '0', 10);
  return safeAreaTop > 0 || detectIOS() || detectSamsung();
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function detectMouse(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function useDeviceDetection(): DeviceInfo {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return useMemo(() => {
    const deviceType = getDeviceType(dimensions.width);
    
    return {
      deviceType,
      screenSize: getScreenSize(dimensions.width),
      orientation: getOrientation(),
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      hasTouch: detectTouch(),
      hasMouse: detectMouse(),
      isStandalone: detectStandalone(),
      isSamsung: detectSamsung(),
      isIOS: detectIOS(),
      isAndroid: detectAndroid(),
      screenWidth: dimensions.width,
      screenHeight: dimensions.height,
      hasNotch: detectNotch(),
    };
  }, [dimensions]);
}

// Utility hook for responsive breakpoints
export function useBreakpoint(breakpoint: ScreenSize): boolean {
  const { screenSize } = useDeviceDetection();
  
  const breakpoints: ScreenSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpoints.indexOf(screenSize);
  const targetIndex = breakpoints.indexOf(breakpoint);
  
  return currentIndex >= targetIndex;
}

// Utility hook to check if we should use touch-optimized UI
export function useTouchOptimized(): boolean {
  const { hasTouch, hasMouse, isMobile, isTablet } = useDeviceDetection();
  return hasTouch && (!hasMouse || isMobile || isTablet);
}
