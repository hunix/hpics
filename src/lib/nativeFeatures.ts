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

// Check if app can be installed (PWA)
export const canInstallPWA = (): boolean => {
  return 'BeforeInstallPromptEvent' in window || 
         (navigator as any).standalone === false;
};

// Store the install prompt for later use
let deferredInstallPrompt: any = null;

export const captureInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
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
  return window.matchMedia('(display-mode: standalone)').matches ||
         (navigator as any).standalone === true;
};
