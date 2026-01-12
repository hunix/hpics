/**
 * Gallery Monitor Hook
 * Watch for new photos and automatically run face detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { faceDetectionService, DetectedFace } from '@/lib/faceDetection';
import { toast } from 'sonner';

interface GalleryPhoto {
  id: string;
  filepath: string;
  webviewPath?: string;
  createdAt: Date;
  processed: boolean;
  facesDetected: number;
  linkedProfiles: string[];
  location?: { latitude: number; longitude: number };
}

interface FaceMatch {
  photoId: string;
  faceIndex: number;
  profileId: string;
  profileName: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

interface UseGalleryMonitorOptions {
  autoProcess?: boolean;
  faceDetectionEnabled?: boolean;
  autoTagThreshold?: number;
  onNewPhoto?: (photo: GalleryPhoto) => void;
  onFaceMatch?: (match: FaceMatch) => void;
}

interface UseGalleryMonitorReturn {
  photos: GalleryPhoto[];
  isMonitoring: boolean;
  isProcessing: boolean;
  pendingPhotos: number;
  recentMatches: FaceMatch[];
  startMonitoring: () => Promise<boolean>;
  stopMonitoring: () => void;
  processPhoto: (photoPath: string) => Promise<GalleryPhoto | null>;
  processAllPending: () => Promise<void>;
  getUntaggedPhotos: () => GalleryPhoto[];
  tagPhotoWithProfile: (photoId: string, faceIndex: number, profileId: string) => Promise<boolean>;
}

export function useGalleryMonitor(
  options: UseGalleryMonitorOptions = {}
): UseGalleryMonitorReturn {
  const { user } = useAuth();
  const {
    autoProcess = true,
    faceDetectionEnabled = true,
    autoTagThreshold = 0.85,
    onNewPhoto,
    onFaceMatch
  } = options;

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState(0);
  const [recentMatches, setRecentMatches] = useState<FaceMatch[]>([]);

  const processingQueueRef = useRef<string[]>([]);
  const enrolledDescriptorsRef = useRef<{ profileId: string; descriptor: Float32Array; name: string }[]>([]);
  const lastCheckRef = useRef<Date>(new Date());

  // Load enrolled face descriptors
  useEffect(() => {
    if (!user) return;

    const loadDescriptors = async () => {
      const { data } = await supabase
        .from('contact_biometrics')
        .select(`
          profile_id,
          facial_features,
          profiles!contact_biometrics_profile_id_fkey (full_name)
        `)
        .eq('user_id', user.id)
        .not('facial_features', 'is', null);

      if (data) {
        enrolledDescriptorsRef.current = data
          .filter((d: any) => d.facial_features?.descriptor)
          .map((d: any) => ({
            profileId: d.profile_id,
            descriptor: faceDetectionService.deserializeDescriptor(
              JSON.stringify(d.facial_features.descriptor)
            ),
            name: d.profiles?.full_name || 'Unknown'
          }));
      }
    };

    loadDescriptors();
  }, [user]);

  // Process a single photo
  const processPhoto = useCallback(async (photoPath: string): Promise<GalleryPhoto | null> => {
    if (!user) return null;

    setIsProcessing(true);
    
    try {
      // Create image element for face detection
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photoPath;
      });

      let detectedFaces: DetectedFace[] = [];
      const linkedProfiles: string[] = [];
      const matches: FaceMatch[] = [];

      // Run face detection
      if (faceDetectionEnabled && faceDetectionService.isReady()) {
        detectedFaces = await faceDetectionService.detectFaces(img, { withDescriptors: true });

        // Match each face against enrolled descriptors
        for (let i = 0; i < detectedFaces.length; i++) {
          const face = detectedFaces[i];
          if (!face.descriptor) continue;

          // Find best match
          const match = faceDetectionService.findBestMatch(
            face.descriptor,
            enrolledDescriptorsRef.current,
            autoTagThreshold
          );

          if (match) {
            linkedProfiles.push(match.profileId);
            
            const enrolled = enrolledDescriptorsRef.current.find(e => e.profileId === match.profileId);
            
            const faceMatch: FaceMatch = {
              photoId: photoPath,
              faceIndex: i,
              profileId: match.profileId,
              profileName: enrolled?.name || 'Unknown',
              confidence: match.confidence,
              boundingBox: {
                x: face.box.x,
                y: face.box.y,
                width: face.box.width,
                height: face.box.height
              }
            };
            
            matches.push(faceMatch);
            onFaceMatch?.(faceMatch);
          }
        }
      }

      const photo: GalleryPhoto = {
        id: `photo-${Date.now()}`,
        filepath: photoPath,
        webviewPath: photoPath,
        createdAt: new Date(),
        processed: true,
        facesDetected: detectedFaces.length,
        linkedProfiles: [...new Set(linkedProfiles)]
      };

      setPhotos(prev => [...prev, photo]);
      setRecentMatches(prev => [...prev, ...matches].slice(-20));
      onNewPhoto?.(photo);

      // Store in database if faces were detected
      if (detectedFaces.length > 0 && linkedProfiles.length > 0) {
        // Link to profiles
        for (const profileId of linkedProfiles) {
          await supabase.from('media').insert({
            user_id: user.id,
            profile_id: profileId,
            media_type: 'image',
            storage_path: photoPath,
            source: 'gallery_auto',
            ai_analysis: {
              auto_detected: true,
              faces_count: detectedFaces.length,
              matched_at: new Date().toISOString()
            }
          });
        }

        toast.success(
          `Auto-tagged ${linkedProfiles.length} contact${linkedProfiles.length > 1 ? 's' : ''}`,
          { description: matches.map(m => m.profileName).join(', ') }
        );
      }

      return photo;
    } catch (error) {
      console.error('Error processing photo:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user, faceDetectionEnabled, autoTagThreshold, onNewPhoto, onFaceMatch]);

  // Start monitoring gallery
  const startMonitoring = useCallback(async (): Promise<boolean> => {
    // Initialize face detection models
    if (faceDetectionEnabled && !faceDetectionService.isReady()) {
      const loaded = await faceDetectionService.loadModels();
      if (!loaded) {
        toast.error('Failed to load face detection models');
        return false;
      }
    }

    setIsMonitoring(true);

    // On native platforms, we'd use a file system watcher
    // For web, we'll poll the camera roll periodically
    if (Capacitor.isNativePlatform()) {
      // Note: Real implementation would use @capacitor/filesystem
      // to watch the camera directory
      toast.success('Gallery monitoring started');
    } else {
      toast.info('Gallery monitoring active');
    }

    return true;
  }, [faceDetectionEnabled]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Process all pending photos
  const processAllPending = useCallback(async () => {
    const pending = photos.filter(p => !p.processed);
    setPendingPhotos(pending.length);

    for (const photo of pending) {
      await processPhoto(photo.filepath);
      setPendingPhotos(prev => prev - 1);
    }
  }, [photos, processPhoto]);

  // Get untagged photos
  const getUntaggedPhotos = useCallback((): GalleryPhoto[] => {
    return photos.filter(p => p.processed && p.facesDetected > 0 && p.linkedProfiles.length === 0);
  }, [photos]);

  // Manually tag a photo with a profile
  const tagPhotoWithProfile = useCallback(async (
    photoId: string,
    faceIndex: number,
    profileId: string
  ): Promise<boolean> => {
    if (!user) return false;

    const photo = photos.find(p => p.id === photoId);
    if (!photo) return false;

    try {
      // Create media record
      await supabase.from('media').insert({
        user_id: user.id,
        profile_id: profileId,
        media_type: 'image',
        storage_path: photo.filepath,
        source: 'gallery_manual',
        ai_analysis: {
          manual_tag: true,
          face_index: faceIndex,
          tagged_at: new Date().toISOString()
        }
      });

      // Update local state
      setPhotos(prev => prev.map(p => {
        if (p.id === photoId) {
          return {
            ...p,
            linkedProfiles: [...new Set([...p.linkedProfiles, profileId])]
          };
        }
        return p;
      }));

      toast.success('Photo tagged');
      return true;
    } catch (error) {
      console.error('Error tagging photo:', error);
      toast.error('Failed to tag photo');
      return false;
    }
  }, [user, photos]);

  return {
    photos,
    isMonitoring,
    isProcessing,
    pendingPhotos,
    recentMatches,
    startMonitoring,
    stopMonitoring,
    processPhoto,
    processAllPending,
    getUntaggedPhotos,
    tagPhotoWithProfile
  };
}
