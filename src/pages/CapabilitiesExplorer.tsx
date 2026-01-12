import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronRight, Star, Zap, Shield, Brain, Users,
  Camera, Mic, MapPin, Bell, FileText, BarChart3, Settings,
  Smartphone, Radio, Scan, MessageSquare, Clock, Database,
  Lock, Eye, Activity, Lightbulb, Compass, Target
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/AppLayout';
import { QuickVoiceRecorder } from '@/components/capture/QuickVoiceRecorder';
import { QuickMediaCapture } from '@/components/capture/QuickMediaCapture';
import { toast } from 'sonner';

type DialogType = 'voice' | 'photo' | 'scan' | null;

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  route?: string;
  dialogType?: DialogType;
  tags: string[];
  isNew?: boolean;
  isPremium?: boolean;
}

const FEATURES: Feature[] = [
  // Intelligence Category
  { id: 'ai-chat', name: 'AI Chat', description: 'Natural language interaction with your contact intelligence', category: 'Intelligence', icon: MessageSquare, route: '/ai-chat', tags: ['ai', 'chat', 'query'] },
  { id: 'semantic-search', name: 'Semantic Search', description: 'Find anything with natural language queries', category: 'Intelligence', icon: Search, route: '/semantic-search', tags: ['search', 'ai', 'nlp'] },
  { id: 'behavioral-analysis', name: 'Behavioral Analysis', description: 'Deep psychological profiling from interactions', category: 'Intelligence', icon: Brain, route: '/insights', tags: ['behavior', 'psychology', 'analysis'] },
  { id: 'network-intelligence', name: 'Network Intelligence', description: 'Map hidden connections between contacts', category: 'Intelligence', icon: Users, route: '/network-intelligence', tags: ['network', 'connections', 'graph'] },
  { id: 'counter-intelligence', name: 'Counter Intelligence', description: 'Detect deception and monitor threats', category: 'Intelligence', icon: Shield, route: '/counter-intelligence', tags: ['security', 'deception', 'threats'], isPremium: true },
  
  // Capture Category - These open dialogs instead of navigating
  { id: 'photo-capture', name: 'Photo Capture', description: 'AI-powered photo analysis with face recognition', category: 'Capture', icon: Camera, dialogType: 'photo', tags: ['photo', 'face', 'recognition'] },
  { id: 'voice-recording', name: 'Voice Recording', description: 'Transcribe and analyze conversations', category: 'Capture', icon: Mic, dialogType: 'voice', tags: ['voice', 'transcription', 'audio'] },
  { id: 'document-scan', name: 'Document Scanning', description: 'OCR and intelligent document processing', category: 'Capture', icon: FileText, route: '/documents', tags: ['document', 'ocr', 'scan'] },
  { id: 'face-scanner', name: 'Live Face Scanner', description: 'Real-time face detection and identification', category: 'Capture', icon: Scan, dialogType: 'scan', tags: ['face', 'biometric', 'live'], isNew: true },
  
  // Mobile Category
  { id: 'location-tracking', name: 'Location Tracking', description: 'Background location with geofence alerts', category: 'Mobile', icon: MapPin, route: '/mobile/ecosystem', tags: ['location', 'gps', 'geofence'] },
  { id: 'proximity-detection', name: 'Proximity Detection', description: 'Bluetooth-based contact detection', category: 'Mobile', icon: Radio, route: '/mobile/ecosystem', tags: ['bluetooth', 'proximity', 'nearby'] },
  { id: 'ambient-listening', name: 'Ambient Intelligence', description: 'Background speech and context awareness', category: 'Mobile', icon: Activity, route: '/mobile/ecosystem', tags: ['ambient', 'speech', 'context'], isNew: true },
  { id: 'push-notifications', name: 'Smart Notifications', description: 'Context-aware alerts and reminders', category: 'Mobile', icon: Bell, route: '/settings', tags: ['notifications', 'alerts', 'push'] },
  
  // Analysis Category
  { id: 'media-analysis', name: 'Media Analysis', description: 'AI-powered photo and video analysis', category: 'Analysis', icon: Eye, route: '/analysis', tags: ['media', 'ai', 'vision'] },
  { id: 'bulk-analysis', name: 'Bulk Analysis', description: 'Process multiple files simultaneously', category: 'Analysis', icon: Database, route: '/analysis/dashboard', tags: ['bulk', 'batch', 'processing'] },
  { id: 'reports', name: 'Intelligence Reports', description: 'Generate comprehensive dossiers', category: 'Analysis', icon: BarChart3, route: '/reports', tags: ['reports', 'dossier', 'export'] },
  { id: 'cross-modal', name: 'Cross-Modal Intelligence', description: 'Connect insights across all data types', category: 'Analysis', icon: Target, route: '/cross-modal-intelligence', tags: ['multimodal', 'fusion', 'insights'], isPremium: true },
  
  // Security Category
  { id: 'encryption', name: 'End-to-End Encryption', description: 'Military-grade data protection', category: 'Security', icon: Lock, route: '/security', tags: ['encryption', 'security', 'privacy'] },
  { id: 'access-control', name: 'Access Control', description: 'Role-based permissions and clearances', category: 'Security', icon: Shield, route: '/security', tags: ['access', 'permissions', 'rbac'] },
  { id: 'audit-logs', name: 'Audit Logging', description: 'Complete activity tracking', category: 'Security', icon: Clock, route: '/security', tags: ['audit', 'logs', 'compliance'] },
  
  // System Category
  { id: 'settings', name: 'Settings', description: 'Configure all system preferences', category: 'System', icon: Settings, route: '/settings', tags: ['settings', 'preferences', 'config'] },
  { id: 'ai-costs', name: 'AI Cost Center', description: 'Monitor and control AI usage', category: 'System', icon: BarChart3, route: '/ai-costs', tags: ['costs', 'budget', 'usage'] },
  { id: 'system-health', name: 'System Health', description: 'Monitor all services and performance', category: 'System', icon: Activity, route: '/system-health', tags: ['health', 'status', 'monitoring'] },
  { id: 'mobile-app', name: 'Mobile App', description: 'Install native mobile application', category: 'System', icon: Smartphone, route: '/install', tags: ['mobile', 'app', 'install'] },
];

const CATEGORIES = ['All', 'Intelligence', 'Capture', 'Mobile', 'Analysis', 'Security', 'System'];

const CATEGORY_COLORS: Record<string, string> = {
  Intelligence: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  Capture: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Mobile: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Analysis: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Security: 'bg-red-500/20 text-red-400 border-red-500/30',
  System: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function CapabilitiesExplorer() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  const filteredFeatures = useMemo(() => {
    return FEATURES.filter(feature => {
      const matchesSearch = searchQuery === '' || 
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || feature.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleFeatureClick = useCallback((feature: Feature) => {
    if (feature.dialogType) {
      if (feature.dialogType === 'scan') {
        // Navigate to contacts with scanner mode
        navigate('/contacts?mode=scanner');
        return;
      }
      setActiveDialog(feature.dialogType);
    } else if (feature.route) {
      navigate(feature.route);
    }
  }, [navigate]);

  const handleCaptureComplete = useCallback((url: string, type: string) => {
    toast.success(`${type === 'photo' ? 'Photo' : 'Video'} captured successfully!`);
    setActiveDialog(null);
  }, []);

  const handleRecordingComplete = useCallback((url: string) => {
    toast.success('Voice recording saved!');
    setActiveDialog(null);
  }, []);

  return (
    <AppLayout title="Capabilities Explorer">
      <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Compass className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Capabilities Explorer</h1>
                <Badge variant="outline" className="text-xs">
                  {FEATURES.length} features
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/command-center')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Command Center
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search features, capabilities, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="-mx-4 sm:-mx-6 border-b border-border/30 bg-muted/20">
        <div className="px-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 py-3">
              {CATEGORIES.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "group cursor-pointer border-border/50 hover:border-primary/50 transition-all hover:shadow-lg",
                    favorites.has(feature.id) && "ring-1 ring-amber-500/50"
                  )}
                  onClick={() => handleFeatureClick(feature)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "p-2 rounded-lg border",
                        CATEGORY_COLORS[feature.category]
                      )}>
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        {feature.isNew && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            New
                          </Badge>
                        )}
                        {feature.isPremium && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            Premium
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(feature.id);
                          }}
                        >
                          <Star className={cn(
                            "h-4 w-4",
                            favorites.has(feature.id) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                          )} />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-base mt-3">{feature.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {feature.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No features found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Voice Recorder Dialog */}
      <QuickVoiceRecorder
        open={activeDialog === 'voice'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onComplete={handleRecordingComplete}
      />

      {/* Photo/Video Capture Dialog */}
      <QuickMediaCapture
        open={activeDialog === 'photo'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onComplete={handleCaptureComplete}
      />
    </AppLayout>
  );
}
