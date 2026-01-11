// Native feature wrappers for Capacitor
// These provide fallbacks for web when native APIs aren't available

export const isNativePlatform = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.isNativePlatform();
};

export const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (typeof (window as any).Capacitor !== 'undefined') {
    const platform = (window as any).Capacitor.getPlatform();
    if (platform === 'ios' || platform === 'android') {
      return platform;
    }
  }
  return 'web';
};

// Browser detection for PWA handling
export type BrowserType = 'chrome' | 'edge' | 'firefox' | 'safari' | 'samsung' | 'opera' | 'unknown';

export const detectBrowser = (): BrowserType => {
  const ua = navigator.userAgent.toLowerCase();
  
  // Order matters - Edge contains Chrome in UA, Samsung contains Chrome etc.
  if (ua.includes('edg/') || ua.includes('edge/')) return 'edge';
  if (ua.includes('samsungbrowser')) return 'samsung';
  if (ua.includes('opr/') || ua.includes('opera')) return 'opera';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  if (ua.includes('chrome')) return 'chrome';
  
  return 'unknown';
};

export const isMobileDevice = (): boolean => {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
};

export const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent.toLowerCase());
};

export const isIOS = (): boolean => {
  return /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isSamsungDevice = (): boolean => {
  return /samsung|sm-/i.test(navigator.userAgent.toLowerCase());
};

// Camera wrapper with web fallback
export const takePhoto = async (): Promise<string | null> => {
  if (isNativePlatform()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });
      return photo.dataUrl || null;
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  } else {
    // Web fallback - use file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }
};

// Share wrapper with web fallback
export const shareContent = async (options: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> => {
  if (isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share(options);
      return true;
    } catch (error) {
      console.error('Share error:', error);
      return false;
    }
  } else if (navigator.share) {
    try {
      await navigator.share(options);
      return true;
    } catch (error) {
      console.error('Web Share error:', error);
      return false;
    }
  }
  return false;
};

// Haptic feedback wrapper
export const hapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> => {
  if (isNativePlatform()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch (error) {
      // Haptics not available
    }
  } else if ('vibrate' in navigator) {
    navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 25 : 50);
  }
};

// Store the install prompt for later use
let deferredInstallPrompt: any = null;

export const captureInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('[PWA] Install prompt captured');
  });
};

// Check if browser supports native PWA install prompt
export const supportsNativeInstallPrompt = (): boolean => {
  const browser = detectBrowser();
  // Chrome and Samsung Browser support beforeinstallprompt well
  // Edge on Android creates shortcuts instead of true installs
  // Safari requires manual Add to Home Screen
  return browser === 'chrome' || browser === 'samsung' || browser === 'opera';
};

// Check if app can be installed (PWA) - improved for Edge
export const canInstallPWA = (): boolean => {
  // If we have a deferred prompt, we can definitely install
  if (deferredInstallPrompt) return true;
  
  // On iOS, check if not in standalone mode
  if (isIOS()) {
    return (navigator as any).standalone === false || !(navigator as any).standalone;
  }
  
  // For browsers that support beforeinstallprompt
  if ('BeforeInstallPromptEvent' in window) return true;
  
  // For Edge and other browsers - can still install manually
  const browser = detectBrowser();
  if (browser === 'edge' || browser === 'firefox') {
    // These browsers can install PWAs but may not fire beforeinstallprompt
    return !isAppInstalled();
  }
  
  return false;
};

// Check if we have a captured prompt ready
export const hasInstallPrompt = (): boolean => {
  return !!deferredInstallPrompt;
};

export const promptInstall = async (): Promise<boolean> => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return result.outcome === 'accepted';
  }
  return false;
};

export const isAppInstalled = (): boolean => {
  // Check display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
  
  // Check iOS standalone
  if ((navigator as any).standalone === true) return true;
  
  // Check if running in TWA (Trusted Web Activity)
  if (document.referrer.includes('android-app://')) return true;
  
  return false;
};

// Get installation instructions based on browser/platform
export interface InstallInstructions {
  browser: BrowserType;
  platform: 'ios' | 'android' | 'desktop';
  canAutoInstall: boolean;
  steps: string[];
  note?: string;
}

export const getInstallInstructions = (): InstallInstructions => {
  const browser = detectBrowser();
  const platform = isIOS() ? 'ios' : isAndroid() ? 'android' : 'desktop';
  const canAutoInstall = hasInstallPrompt();
  
  if (platform === 'ios') {
    return {
      browser,
      platform,
      canAutoInstall: false,
      steps: [
        'Tap the Share button at the bottom of Safari',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" in the top right corner'
      ],
      note: browser !== 'safari' ? 'For the best experience, open this page in Safari' : undefined
    };
  }
  
  if (platform === 'android') {
    if (browser === 'edge') {
      return {
        browser,
        platform,
        canAutoInstall: false,
        steps: [
          'Tap the menu icon (⋯) at the bottom',
          'Tap "Add to Phone"',
          'Tap "Add" to confirm'
        ],
        note: 'Edge creates a shortcut. For a full app experience, try Chrome.'
      };
    }
    
    if (browser === 'samsung') {
      return {
        browser,
        platform,
        canAutoInstall,
        steps: canAutoInstall ? [
          'Tap the "Install" button below'
        ] : [
          'Tap the menu icon (☰)',
          'Tap "Add page to"',
          'Select "Home screen"'
        ]
      };
    }
    
    if (browser === 'firefox') {
      return {
        browser,
        platform,
        canAutoInstall: false,
        steps: [
          'Tap the menu icon (⋮)',
          'Tap "Install"',
          'Follow the prompts to add to home screen'
        ]
      };
    }
    
    // Chrome and others
    return {
      browser,
      platform,
      canAutoInstall,
      steps: canAutoInstall ? [
        'Tap the "Install" button below'
      ] : [
        'Tap the menu icon (⋮)',
        'Tap "Add to Home screen"',
        'Tap "Add" to confirm'
      ]
    };
  }
  
  // Desktop
  return {
    browser,
    platform,
    canAutoInstall,
    steps: canAutoInstall ? [
      'Click the "Install" button below'
    ] : browser === 'edge' ? [
      'Click the install icon in the address bar',
      'Or click menu (⋯) → Apps → Install this site as an app'
    ] : browser === 'chrome' ? [
      'Click the install icon in the address bar',
      'Or click menu (⋮) → "Install PICS..."'
    ] : [
      'This browser may not fully support PWA installation',
      'Try opening in Chrome or Edge for the best experience'
    ]
  };
};
