import { useState, useCallback } from 'react';
import { FileText, Download, Loader2, User, Calendar, TrendingUp, Shield, Network, Brain, Image, Target, Clipboard, Heart, AlertTriangle, Mic, Zap, Eye, Crosshair, Sparkles, BookOpen, Gauge, Dna, Clock, Users, Radio, Scale, Fingerprint, Compass, Wand2, ShieldQuestion, Split, Lightbulb, BarChart3, Database, MessageCircle, Lock, Layers, Atom, MapPin, Activity, Wind, Cpu, Crown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ScalableContactSearch } from '@/components/contacts/ScalableContactSearch';

interface PDFDossierGeneratorProps {
  profileId?: string;
  profileName?: string;
}

interface DossierSection {
  id: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  category: 'core' | 'intelligence' | 'warfare' | 'analysis';
}

type DossierTemplate = 'executive' | 'operational' | 'full' | 'surveillance' | 'warfare' | 'psychological';

// RASCLS/Cialdini's 7 Principles of Influence
const CIALDINI_PRINCIPLES = [
  { key: 'reciprocity', label: 'Reciprocity', description: 'Obligation to return favors' },
  { key: 'authority', label: 'Authority', description: 'Deference to expertise' },
  { key: 'scarcity', label: 'Scarcity', description: 'Value of rare opportunities' },
  { key: 'commitment', label: 'Commitment/Consistency', description: 'Honoring prior commitments' },
  { key: 'liking', label: 'Liking', description: 'Favor for those we like' },
  { key: 'social_proof', label: 'Social Proof', description: 'Following others\' actions' },
  { key: 'unity', label: 'Unity', description: 'Shared identity influence' },
];

// FBI Elicitation Techniques
const FBI_TECHNIQUES = [
  'Assumed Knowledge', 'Deliberate False Statement', 'Bracketing', 'Flattery',
  'Criticism', 'Appeal to Ego', 'Quid Pro Quo', 'Mutual Interest',
  'Conformity Pressure', 'Word Repetition', 'Feigned Naivete', 'Disbelief'
];

export function PDFDossierGenerator({ profileId, profileName }: PDFDossierGeneratorProps) {
  // Version logging for cache debugging
  console.log('[PDFDossierGenerator] v3.0 - Ultimate Intelligence - 47 Sections Loaded');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingIntel, setIsGeneratingIntel] = useState(false);
  const [intelProgress, setIntelProgress] = useState(0);
  const [taskResults, setTaskResults] = useState<{ name: string; status: 'pending' | 'running' | 'success' | 'failed'; error?: string }[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(profileId || null);
  const [selectedContactName, setSelectedContactName] = useState<string>(profileName || '');
  const [template, setTemplate] = useState<DossierTemplate>('full');
  const [dataStats, setDataStats] = useState<{media: number; voice: number; analyses: number; sources: number} | null>(null);
  
  const [sections, setSections] = useState<DossierSection[]>([
    // ============== CORE SECTIONS ==============
    { id: 'executive', label: 'Executive Intelligence Brief', icon: Zap, enabled: true, category: 'core' },
    { id: 'sourceDashboard', label: 'Intelligence Source Dashboard', icon: Database, enabled: true, category: 'core' },
    { id: 'overview', label: 'Contact Overview', icon: User, enabled: true, category: 'core' },
    { id: 'behavioralDna', label: 'Contact DNA Fingerprint', icon: Dna, enabled: true, category: 'core' },
    { id: 'patternOfLife', label: 'Pattern-of-Life Analysis', icon: Clock, enabled: true, category: 'core' },
    { id: 'relationshipEcosystem', label: 'Relationship Ecosystem Map', icon: Users, enabled: true, category: 'core' },
    { id: 'timeline', label: 'Interaction Timeline', icon: Calendar, enabled: false, category: 'core' },
    
    // ============== INTELLIGENCE SECTIONS ==============
    { id: 'psychological', label: 'Deep Psychological Profile', icon: Brain, enabled: true, category: 'intelligence' },
    { id: 'quantumCognition', label: 'Quantum Cognition Analysis', icon: Atom, enabled: true, category: 'intelligence' },
    { id: 'relationship', label: 'Relationship Intelligence', icon: Heart, enabled: true, category: 'intelligence' },
    { id: 'playbook', label: 'Engagement Playbook', icon: Target, enabled: true, category: 'intelligence' },
    { id: 'hypnoticPatterns', label: 'Hypnotic Language Patterns', icon: Wand2, enabled: true, category: 'intelligence' },
    { id: 'elicitation', label: 'Elicitation Technique Guide', icon: MessageCircle, enabled: true, category: 'intelligence' },
    { id: 'cognitiveLoad', label: 'Cognitive Load Exploitation', icon: Cpu, enabled: true, category: 'intelligence' },
    { id: 'mediaIntel', label: 'Media Intelligence Synthesis', icon: Image, enabled: true, category: 'intelligence' },
    { id: 'voiceIntel', label: 'Voice Intelligence', icon: Mic, enabled: true, category: 'intelligence' },
    { id: 'deceptionAnalysis', label: 'Deception Analysis Deep Dive', icon: Eye, enabled: true, category: 'intelligence' },
    { id: 'actionPlans', label: 'Strategic Action Plans', icon: Clipboard, enabled: true, category: 'intelligence' },
    
    // ============== WARFARE SECTIONS ==============
    { id: 'mice', label: 'MICE Vulnerability Matrix', icon: Crosshair, enabled: true, category: 'warfare' },
    { id: 'cialdini', label: 'RASCLS Influence Profile', icon: BookOpen, enabled: true, category: 'warfare' },
    { id: 'sacredValues', label: 'Sacred Values Profile', icon: Crown, enabled: true, category: 'warfare' },
    { id: 'realityTesting', label: 'Reality Testing Vulnerability', icon: Split, enabled: true, category: 'warfare' },
    { id: 'identityDestab', label: 'Identity Destabilization Profile', icon: Fingerprint, enabled: true, category: 'warfare' },
    { id: 'influence', label: 'Influence Vectors', icon: Radio, enabled: true, category: 'warfare' },
    { id: 'trauma', label: 'Trauma & Vulnerability Windows', icon: AlertTriangle, enabled: true, category: 'warfare' },
    { id: 'semanticWarfare', label: 'Semantic Warfare Profile', icon: MessageCircle, enabled: true, category: 'warfare' },
    { id: 'memeticPropagation', label: 'Memetic Propagation Analysis', icon: Wind, enabled: true, category: 'warfare' },
    { id: 'futureModeling', label: 'Behavioral Future Modeling', icon: TrendingUp, enabled: true, category: 'warfare' },
    { id: 'precognitive', label: 'Precognitive Pattern Analysis', icon: Compass, enabled: true, category: 'warfare' },
    { id: 'crossModal', label: 'Cross-Modal Deception Analysis', icon: Layers, enabled: true, category: 'warfare' },
    { id: 'choiceArchitecture', label: 'Choice Architecture Exploitation', icon: Scale, enabled: true, category: 'warfare' },
    { id: 'betrayal', label: 'Betrayal & Crisis Prediction', icon: Gauge, enabled: true, category: 'warfare' },
    { id: 'influenceOps', label: 'Influence Operation Planning', icon: MapPin, enabled: true, category: 'warfare' },
    { id: 'threatActor', label: 'Threat Assessment', icon: ShieldQuestion, enabled: true, category: 'warfare' },
    
    // ============== ANALYSIS SECTIONS ==============
    { id: 'analysis', label: 'Behavioral Analysis', icon: TrendingUp, enabled: true, category: 'analysis' },
    { id: 'trust', label: 'Trust Assessment', icon: Shield, enabled: true, category: 'analysis' },
    { id: 'influenceResistance', label: 'Influence Resistance Profile', icon: Lock, enabled: true, category: 'analysis' },
    { id: 'behavioralEconomics', label: 'Behavioral Economics Profile', icon: BarChart3, enabled: true, category: 'analysis' },
    { id: 'network', label: 'Network Position', icon: Network, enabled: true, category: 'analysis' },
    { id: 'predictionAccuracy', label: 'Prediction Accuracy Tracking', icon: Activity, enabled: true, category: 'analysis' },
    { id: 'counterIntel', label: 'Counter-Intelligence Assessment', icon: Lightbulb, enabled: true, category: 'analysis' },
  ]);

  const handleContactSelect = useCallback(async (id: string | null, contact?: { first_name: string; last_name: string | null }) => {
    setSelectedProfile(id);
    if (contact) {
      setSelectedContactName(`${contact.first_name} ${contact.last_name || ''}`.trim());
    } else {
      setSelectedContactName('');
    }
    
    if (id) {
      const [mediaCount, voiceCount, analysesCount, psychCount, miceCount, influenceCount] = await Promise.all([
        supabase.from('media').select('id', { count: 'exact', head: true }).eq('profile_id', id).not('ai_metadata', 'is', null),
        supabase.from('voice_recording_sessions').select('id', { count: 'exact', head: true }).eq('profile_id', id),
        supabase.from('ai_analyses').select('id', { count: 'exact', head: true }).eq('profile_id', id),
        supabase.from('psychological_profiles').select('id', { count: 'exact', head: true }).eq('profile_id', id),
        supabase.from('mice_assessments').select('id', { count: 'exact', head: true }).eq('profile_id', id),
        supabase.from('contact_influence_profiles').select('id', { count: 'exact', head: true }).eq('profile_id', id),
      ]);
      setDataStats({
        media: mediaCount.count || 0,
        voice: voiceCount.count || 0,
        analyses: analysesCount.count || 0,
        sources: (mediaCount.count || 0) + (voiceCount.count || 0) + (analysesCount.count || 0) + (psychCount.count || 0) + (miceCount.count || 0) + (influenceCount.count || 0),
      });
    } else {
      setDataStats(null);
    }
  }, []);

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const applyTemplate = (templateType: DossierTemplate) => {
    setTemplate(templateType);
    const enabledIds: Record<DossierTemplate, string[]> = {
      executive: ['executive', 'sourceDashboard', 'overview', 'psychological', 'actionPlans'],
      operational: ['executive', 'sourceDashboard', 'overview', 'behavioralDna', 'psychological', 'playbook', 'actionPlans', 'mice', 'cialdini', 'influence', 'trauma', 'elicitation'],
      full: sections.map(s => s.id), // All sections
      surveillance: ['overview', 'sourceDashboard', 'patternOfLife', 'mediaIntel', 'voiceIntel', 'timeline', 'network', 'threatActor', 'crossModal', 'deceptionAnalysis'],
      warfare: ['executive', 'mice', 'cialdini', 'sacredValues', 'realityTesting', 'identityDestab', 'trauma', 'semanticWarfare', 'memeticPropagation', 'choiceArchitecture', 'influenceOps', 'betrayal', 'threatActor', 'hypnoticPatterns', 'elicitation', 'cognitiveLoad'],
      psychological: ['executive', 'behavioralDna', 'psychological', 'quantumCognition', 'relationship', 'playbook', 'deceptionAnalysis', 'behavioralEconomics', 'trust', 'influenceResistance', 'futureModeling', 'precognitive'],
    };
    
    setSections(sections.map(s => ({
      ...s,
      enabled: enabledIds[templateType].includes(s.id),
    })));
  };

  // Generate missing warfare intelligence before PDF export
  const generateFullIntelligence = async () => {
    const targetProfileId = profileId || selectedProfile;
    if (!targetProfileId) {
      toast.error('Please select a contact first');
      return;
    }

    setIsGeneratingIntel(true);
    setIntelProgress(0);
    setTaskResults([]);

    try {
      // Check what's missing
      const [miceExists, influenceExists, deepIntelExists, behavioralDnaExists, sacredValuesExists] = await Promise.all([
        supabase.from('mice_assessments').select('id').eq('profile_id', targetProfileId).maybeSingle(),
        supabase.from('contact_influence_profiles').select('id').eq('profile_id', targetProfileId).maybeSingle(),
        supabase.from('ai_analyses').select('id').eq('profile_id', targetProfileId).eq('analysis_type', 'deep_intelligence').maybeSingle(),
        supabase.from('ai_analyses').select('id').eq('profile_id', targetProfileId).eq('analysis_type', 'behavioral_dna').maybeSingle(),
        supabase.from('ai_analyses').select('id').eq('profile_id', targetProfileId).eq('analysis_type', 'sacred_values').maybeSingle(),
      ]);

      const tasks: { name: string; fn: () => Promise<any>; required: boolean }[] = [];
      
      if (!miceExists.data) {
        tasks.push({
          name: 'MICE Vulnerability Analysis',
          fn: () => supabase.functions.invoke('mice-recruitment-analyzer', { body: { profileId: targetProfileId, analysisDepth: 'comprehensive' } }),
          required: true,
        });
      }
      
      if (!influenceExists.data) {
        tasks.push({
          name: 'Cialdini Influence Profile',
          fn: () => supabase.functions.invoke('analyze-influence-profile', { body: { profileId: targetProfileId } }),
          required: true,
        });
      }
      
      if (!deepIntelExists.data) {
        tasks.push({
          name: 'Deep Intelligence Engine',
          fn: () => supabase.functions.invoke('deep-intelligence-engine', { body: { profileId: targetProfileId } }),
          required: true,
        });
      }
      
      if (!behavioralDnaExists.data) {
        tasks.push({
          name: 'Behavioral DNA Sequencer',
          fn: () => supabase.functions.invoke('behavioral-dna-sequencer', { body: { profileId: targetProfileId } }),
          required: false,
        });
      }
      
      if (!sacredValuesExists.data) {
        tasks.push({
          name: 'Sacred Values Mapper',
          fn: () => supabase.functions.invoke('sacred-values-mapper', { body: { profileId: targetProfileId } }),
          required: false,
        });
      }

      // Always run these for latest data
      tasks.push({
        name: 'Cross-Modal Synthesis',
        fn: () => supabase.functions.invoke('cross-modal-synthesis-v2', { body: { profileId: targetProfileId } }),
        required: false,
      });
      
      tasks.push({
        name: 'Precognitive Pattern Engine',
        fn: () => supabase.functions.invoke('precognitive-pattern-engine', { body: { profileId: targetProfileId } }),
        required: false,
      });

      if (tasks.length === 0) {
        toast.info('All intelligence already generated');
        setIsGeneratingIntel(false);
        return;
      }

      // Initialize task results
      setTaskResults(tasks.map(t => ({ name: t.name, status: 'pending' as const })));

      let completedCount = 0;
      let failedCount = 0;
      const failedTasks: string[] = [];

      // Execute tasks sequentially with progress and detailed tracking
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        
        // Update status to running
        setTaskResults(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status: 'running' as const } : t
        ));
        
        setIntelProgress(((i) / tasks.length) * 100);
        
        try {
          console.log(`[IntelGen] Starting: ${task.name}`);
          const result = await task.fn();
          
          // Check for function-level errors
          if (result.error) {
            throw new Error(result.error.message || 'Function returned error');
          }
          
          // Update status to success
          setTaskResults(prev => prev.map((t, idx) => 
            idx === i ? { ...t, status: 'success' as const } : t
          ));
          completedCount++;
          console.log(`[IntelGen] Success: ${task.name}`);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : 'Unknown error';
          console.error(`[IntelGen] Failed: ${task.name}`, e);
          
          // Update status to failed with error message
          setTaskResults(prev => prev.map((t, idx) => 
            idx === i ? { ...t, status: 'failed' as const, error: errorMsg } : t
          ));
          failedCount++;
          failedTasks.push(task.name);
        }
        
        setIntelProgress(((i + 1) / tasks.length) * 100);
      }

      // Show summary toast
      if (failedCount === 0) {
        toast.success(`Intelligence package complete! ${completedCount} analyses generated.`);
      } else if (completedCount > 0) {
        toast.warning(`${completedCount} succeeded, ${failedCount} failed`, {
          description: `Failed: ${failedTasks.join(', ')}`,
          duration: 8000,
        });
      } else {
        toast.error(`All ${failedCount} intelligence tasks failed`, {
          description: 'Check console for details',
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('[IntelGen] Critical error:', error);
      toast.error('Intelligence generation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsGeneratingIntel(false);
      setIntelProgress(0);
    }
  };

  // Retry a single failed task
  const retryTask = async (taskName: string) => {
    const targetProfileId = profileId || selectedProfile;
    if (!targetProfileId) return;

    const taskMap: Record<string, () => Promise<any>> = {
      'MICE Vulnerability Analysis': () => supabase.functions.invoke('mice-recruitment-analyzer', { body: { profileId: targetProfileId, analysisDepth: 'comprehensive' } }),
      'Cialdini Influence Profile': () => supabase.functions.invoke('analyze-influence-profile', { body: { profileId: targetProfileId } }),
      'Deep Intelligence Engine': () => supabase.functions.invoke('deep-intelligence-engine', { body: { profileId: targetProfileId } }),
      'Behavioral DNA Sequencer': () => supabase.functions.invoke('behavioral-dna-sequencer', { body: { profileId: targetProfileId } }),
      'Sacred Values Mapper': () => supabase.functions.invoke('sacred-values-mapper', { body: { profileId: targetProfileId } }),
      'Cross-Modal Synthesis': () => supabase.functions.invoke('cross-modal-synthesis-v2', { body: { profileId: targetProfileId } }),
      'Precognitive Pattern Engine': () => supabase.functions.invoke('precognitive-pattern-engine', { body: { profileId: targetProfileId } }),
    };

    const taskFn = taskMap[taskName];
    if (!taskFn) return;

    setTaskResults(prev => prev.map(t => 
      t.name === taskName ? { ...t, status: 'running' as const, error: undefined } : t
    ));

    try {
      toast.info(`Retrying: ${taskName}...`);
      const result = await taskFn();
      
      if (result.error) {
        throw new Error(result.error.message || 'Function returned error');
      }
      
      setTaskResults(prev => prev.map(t => 
        t.name === taskName ? { ...t, status: 'success' as const } : t
      ));
      toast.success(`${taskName} completed!`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      setTaskResults(prev => prev.map(t => 
        t.name === taskName ? { ...t, status: 'failed' as const, error: errorMsg } : t
      ));
      toast.error(`${taskName} failed again`, { description: errorMsg });
    }
  };

  const generatePDF = async () => {
    if (!selectedProfile && !profileId) {
      toast.error('Please select a contact');
      return;
    }

    setIsGenerating(true);
    const targetProfileId = profileId || selectedProfile;

    try {
      // Fetch contact data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetProfileId)
        .single();

      if (!profile) throw new Error('Contact not found');

      const contactName = `${profile.first_name} ${profile.last_name || ''}`.trim();

      // ========================================
      // COMPREHENSIVE DATA FUSION - 30+ Sources
      // Split into two batches to avoid TypeScript recursion limits
      // ========================================
      
      // Batch 1: Core intelligence sources
      const [
        commData,
        psychData,
        allAnalyses,
        mediaAnalyses,
        mediaData,
        voiceData,
        behavioralData,
        trustData,
        miceData,
        influenceData,
        threatData,
        observationsData,
        predictionsData,
        anomaliesData,
        milestonesData,
      ] = await Promise.all([
        supabase.from('communications').select('*').eq('profile_id', targetProfileId).order('occurred_at', { ascending: false }).limit(30),
        supabase.from('psychological_profiles').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        supabase.from('ai_analyses').select('*').eq('profile_id', targetProfileId).order('generated_at', { ascending: false }),
        supabase.from('media_analyses').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }),
        supabase.from('media').select('id, caption, ai_metadata, completed_analysis_modes, created_at, mime_type').eq('profile_id', targetProfileId).not('ai_metadata', 'is', null),
        supabase.from('voice_recording_sessions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }),
        supabase.from('behavioral_analyses').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(5),
        supabase.from('trust_assessments').select('*').eq('profile_id', targetProfileId).order('assessed_at', { ascending: false }).limit(1),
        supabase.from('mice_assessments').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        supabase.from('contact_influence_profiles').select('*').eq('profile_id', targetProfileId).limit(1),
        supabase.from('threat_actors').select('*').eq('profile_id', targetProfileId).limit(1),
        supabase.from('contact_observations').select('*').eq('profile_id', targetProfileId).order('observed_at', { ascending: false }).limit(20),
        supabase.from('behavioral_predictions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(10),
        supabase.from('behavioral_anomalies').select('*').eq('profile_id', targetProfileId).eq('is_resolved', false),
        supabase.from('contact_life_milestones').select('*').eq('profile_id', targetProfileId).order('milestone_date', { ascending: false }).limit(10),
      ]);

      // Batch 2: Relationships & predictions
      const [
        relationshipsData,
        betrayalData,
        traumaData,
        scenarioPredictions,
        crossModalData,
        cognitiveSuperpositions,
        precursorSignatures,
        timelineProbabilities,
      ] = await Promise.all([
        supabase.from('contact_relationships').select('*, to_profile:profiles!contact_relationships_to_profile_id_fkey(first_name, last_name)').eq('from_profile_id', targetProfileId),
        supabase.from('betrayal_predictions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        supabase.from('trauma_exploitation_windows').select('*').eq('profile_id', targetProfileId).limit(1),
        supabase.from('behavioral_scenario_predictions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(5),
        supabase.from('cross_domain_correlations').select('*').eq('profile_id', targetProfileId).order('updated_at', { ascending: false }).limit(5),
        supabase.from('cognitive_superpositions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        supabase.from('precursor_signatures').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(10),
        supabase.from('timeline_probabilities').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(10),
      ]);

      // Batch 3: Warfare intelligence sources
      const elicitationSessions = await supabase.from('elicitation_sessions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(5);
      const financialPsychology = await supabase.from('financial_psychology_profiles').select('*').eq('profile_id', targetProfileId).limit(1);
      const sacredValuesData = await supabase.from('sacred_values').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false });
      const memeticCampaignsData = await supabase.from('memetic_campaigns').select('*').limit(5);
      const semanticOpsData = await supabase.from('semantic_operations').select('*').limit(5);
      const identityDestabData = await supabase.from('identity_destabilization_logs').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(5);
      const realityFrameworksData = await supabase.from('reality_frameworks').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1);

      // Create PDF with enhanced styling
      const doc = new jsPDF();
      let yPos = 20;
      const lineHeight = 6;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      const footerHeight = 15;
      const maxContentY = pageHeight - footerHeight - margin;

      // ========================================
      // ENHANCED PAGE BREAK HELPER
      // ========================================
      const checkPageBreak = (neededSpace: number): boolean => {
        if (yPos + neededSpace > maxContentY) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // ========================================
      // SECTION HEADER - Colored bar with consistent spacing
      // ========================================
      const renderSectionHeader = (title: string, color: [number, number, number] = [0, 0, 0]) => {
        checkPageBreak(25);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos - 3, margin + contentWidth, yPos - 3);
        yPos += 2;
        
        doc.setFillColor(color[0], color[1], color[2], 0.1);
        doc.rect(margin - 2, yPos - 2, contentWidth + 4, 10, 'F');
        
        doc.setFillColor(...color);
        doc.rect(margin - 2, yPos - 2, 3, 10, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...color);
        doc.text(title.toUpperCase(), margin + 5, yPos + 5);
        doc.setTextColor(0);
        yPos += 15;
      };

      // ========================================
      // SUBSECTION HEADER
      // ========================================
      const renderSubsection = (title: string) => {
        checkPageBreak(12);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(title, margin, yPos);
        doc.setTextColor(0);
        yPos += lineHeight + 2;
      };

      // ========================================
      // BULLET POINT with smart wrapping
      // ========================================
      const renderBullet = (text: string, indent: number = 0, bulletChar: string = '•') => {
        const availableWidth = contentWidth - indent - 5;
        const lines = doc.splitTextToSize(`${bulletChar} ${text}`, availableWidth);
        checkPageBreak(lines.length * lineHeight + 2);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(lines, margin + indent, yPos);
        yPos += lines.length * lineHeight;
      };

      // ========================================
      // KEY-VALUE PAIR with proper alignment
      // ========================================
      const renderKeyValue = (key: string, value: string, keyWidth: number = 55) => {
        checkPageBreak(10);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(key + ':', margin, yPos);
        doc.setFont('helvetica', 'normal');
        
        const valueStr = String(value || 'N/A');
        const lines = doc.splitTextToSize(valueStr, contentWidth - keyWidth - 5);
        doc.text(lines, margin + keyWidth, yPos);
        yPos += Math.max(lines.length * lineHeight, lineHeight);
      };

      // ========================================
      // SCORE BAR visualization
      // ========================================
      const renderScoreBar = (label: string, score: number, maxScore: number = 100, color: [number, number, number] = [0, 100, 200]) => {
        checkPageBreak(14);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(label, margin, yPos);
        
        const barX = margin + 50;
        const barWidth = 80;
        const barHeight = 6;
        const fillWidth = (score / maxScore) * barWidth;
        
        doc.setFillColor(230, 230, 230);
        doc.rect(barX, yPos - 5, barWidth, barHeight, 'F');
        
        doc.setFillColor(...color);
        doc.rect(barX, yPos - 5, fillWidth, barHeight, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${Math.round(score)}%`, barX + barWidth + 5, yPos);
        
        yPos += 8;
      };

      // ========================================
      // PRIORITY BADGE
      // ========================================
      const renderPriorityBadge = (priority: string, x: number, y: number) => {
        const colors: Record<string, [number, number, number]> = {
          critical: [180, 0, 0],
          high: [200, 100, 0],
          medium: [200, 180, 0],
          low: [0, 150, 0],
        };
        const color = colors[priority.toLowerCase()] || [100, 100, 100];
        
        doc.setFillColor(...color);
        doc.roundedRect(x, y - 3, 18, 5, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text(priority.toUpperCase(), x + 2, y);
        doc.setTextColor(0);
      };

      // ========================================
      // MINI RADAR CHART
      // ========================================
      const renderMiniRadar = (values: {label: string; score: number}[], centerX: number, centerY: number, radius: number) => {
        const n = values.length;
        if (n < 3) return;
        
        // Draw axes
        doc.setDrawColor(200, 200, 200);
        for (let i = 0; i < n; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          doc.line(centerX, centerY, x, y);
          
          // Label
          doc.setFontSize(6);
          const labelX = centerX + Math.cos(angle) * (radius + 8);
          const labelY = centerY + Math.sin(angle) * (radius + 8);
          doc.text(values[i].label, labelX, labelY, { align: 'center' });
        }
        
        // Draw polygon
        doc.setDrawColor(100, 100, 200);
        doc.setFillColor(100, 100, 200, 0.3);
        let points: [number, number][] = [];
        for (let i = 0; i < n; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (values[i].score / 100) * radius;
          points.push([centerX + Math.cos(angle) * r, centerY + Math.sin(angle) * r]);
        }
        // Close path
        if (points.length > 0) {
          for (let i = 0; i < points.length; i++) {
            const next = (i + 1) % points.length;
            doc.line(points[i][0], points[i][1], points[next][0], points[next][1]);
          }
        }
      };

      // Extract key analyses
      const personalityAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'personality');
      const playbookAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'playbook');
      const relationshipAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'relationship_score');
      const deepIntelAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'deep_intelligence');
      const mediaAggregation = allAnalyses.data?.find((a: any) => a.analysis_type === 'media_intelligence_aggregation');
      const voiceAggregation = allAnalyses.data?.find((a: any) => a.analysis_type === 'voice_intelligence_aggregation');
      const behavioralDnaAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'behavioral_dna');
      const sacredValuesAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'sacred_values');

      // Count intelligence sources
      const totalMediaAnalyzed = mediaData.data?.length || 0;
      const totalVoiceSessions = voiceData.data?.length || 0;
      const totalObservations = observationsData.data?.length || 0;
      const totalCommunications = commData.data?.length || 0;
      const totalAnomalies = anomaliesData.data?.length || 0;
      const totalAnalyses = allAnalyses.data?.length || 0;
      const totalRelationships = relationshipsData.data?.length || 0;
      const intelligenceCompleteness = Math.min(100, ((totalMediaAnalyzed > 0 ? 15 : 0) + (totalVoiceSessions > 0 ? 15 : 0) + (psychData.data?.length ? 20 : 0) + (miceData.data?.length ? 15 : 0) + (influenceData.data ? 15 : 0) + (behavioralDnaAnalysis ? 20 : 0)));

      // ========================================
      // COVER PAGE
      // ========================================
      doc.setFillColor(20, 30, 50);
      doc.rect(0, 0, pageWidth, 80, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text('CLASSIFICATION: TOP SECRET // NOFORN', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('INTELLIGENCE DOSSIER', pageWidth / 2, 40, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(150, 200, 255);
      doc.text(template.toUpperCase() + ' PACKAGE', pageWidth / 2, 55, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`Intelligence Completeness: ${intelligenceCompleteness}%`, pageWidth / 2, 70, { align: 'center' });
      
      doc.setTextColor(0);
      
      // Subject name
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(contactName.toUpperCase(), pageWidth / 2, 105, { align: 'center' });
      
      if (profile.organization) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(profile.organization, pageWidth / 2, 118, { align: 'center' });
        doc.setTextColor(0);
      }
      
      // Intelligence summary box
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(margin, 130, contentWidth, 65, 3, 3, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(margin, 130, contentWidth, 65, 3, 3, 'S');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('INTELLIGENCE SOURCES SUMMARY', margin + 5, 142);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const col1X = margin + 10;
      const col2X = margin + 70;
      const col3X = margin + 130;
      
      doc.text(`📷 Media: ${totalMediaAnalyzed}`, col1X, 153);
      doc.text(`🎙️ Voice: ${totalVoiceSessions}`, col1X, 163);
      doc.text(`👁️ Observations: ${totalObservations}`, col1X, 173);
      doc.text(`🔗 Relationships: ${totalRelationships}`, col1X, 183);
      
      doc.text(`💬 Communications: ${totalCommunications}`, col2X, 153);
      doc.text(`🧠 AI Analyses: ${totalAnalyses}`, col2X, 163);
      doc.text(`⚠️ Anomalies: ${totalAnomalies}`, col2X, 173);
      
      // Risk level badge
      const riskLevel = totalAnomalies > 2 ? 'HIGH RISK' : totalAnomalies > 0 ? 'MEDIUM RISK' : 'LOW RISK';
      const riskColor: [number, number, number] = totalAnomalies > 2 ? [180, 0, 0] : totalAnomalies > 0 ? [180, 100, 0] : [0, 120, 0];
      doc.setFillColor(...riskColor);
      doc.roundedRect(col3X, 150, 30, 8, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(riskLevel, col3X + 3, 155);
      doc.setTextColor(0);
      
      // Key assessments preview
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('KEY ASSESSMENTS:', col3X, 168);
      doc.setFont('helvetica', 'normal');
      if (miceData.data?.[0]) {
        const mice = miceData.data[0] as any;
        doc.text(`MICE: ${mice.primary_vulnerability || 'Unknown'}`, col3X, 177);
      }
      if (psychData.data?.[0]) {
        const psych = psychData.data[0] as any;
        const style = psych.attachment_style as any;
        doc.text(`Attach: ${style?.primary_style || 'Unknown'}`, col3X, 186);
      }
      
      // Generation info
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy at HH:mm')}`, pageWidth / 2, 210, { align: 'center' });
      doc.text('PICS Autonomous General Intelligence System v3.0', pageWidth / 2, 218, { align: 'center' });
      doc.text(`${sections.filter(s => s.enabled).length} Intelligence Sections Active`, pageWidth / 2, 226, { align: 'center' });
      doc.setTextColor(0);
      
      doc.addPage();
      yPos = margin;

      // ========================================
      // TABLE OF CONTENTS
      // ========================================
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TABLE OF CONTENTS', margin, yPos);
      yPos += 12;
      
      let tocPage = 3; // Starting page after cover and TOC
      const enabledSections = sections.filter(s => s.enabled);
      enabledSections.forEach((section, idx) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const categoryColors: Record<string, [number, number, number]> = {
          core: [50, 50, 50],
          intelligence: [0, 51, 102],
          warfare: [102, 0, 0],
          analysis: [0, 80, 120],
        };
        doc.setTextColor(...categoryColors[section.category]);
        doc.text(`${idx + 1}. ${section.label}`, margin, yPos);
        doc.text(`${section.category.toUpperCase()}`, margin + 120, yPos);
        doc.setTextColor(0);
        yPos += 6;
        if (yPos > maxContentY - 20) {
          doc.addPage();
          yPos = margin;
        }
      });
      
      doc.addPage();
      yPos = margin;

      // ========================================
      // EXECUTIVE INTELLIGENCE BRIEF
      // ========================================
      if (sections.find(s => s.id === 'executive')?.enabled) {
        renderSectionHeader('Executive Intelligence Brief', [0, 51, 102]);
        
        const psych = psychData.data?.[0] as any;
        const attachmentStyle = psych?.attachment_style as any;
        
        // Subject Classification Box
        doc.setFillColor(riskColor[0], riskColor[1], riskColor[2], 0.15);
        doc.roundedRect(margin, yPos - 2, contentWidth, 14, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...riskColor);
        doc.text(`SUBJECT CLASSIFICATION: ${riskLevel.replace(' RISK', '')} PRIORITY`, margin + 5, yPos + 6);
        doc.setTextColor(0);
        yPos += 20;
        
        // Key Assessment Summary
        renderSubsection('Strategic Assessment');
        
        if (attachmentStyle?.primary_style) {
          renderBullet(`Attachment Pattern: ${attachmentStyle.primary_style} (Anxiety: ${attachmentStyle.anxiety_score || 0}%, Avoidance: ${attachmentStyle.avoidance_score || 0}%)`);
        }
        
        if (relationshipAnalysis?.result) {
          const rel = relationshipAnalysis.result as any;
          renderBullet(`Relationship Status: Score ${rel.score || 0}/100, Grade ${rel.grade || 'N/A'}`);
        }
        
        if (trustData.data?.[0]) {
          const trust = trustData.data[0] as any;
          renderBullet(`Trust Level: ${trust.overall_trust_score || 0}% (${trust.trust_trajectory || 'stable'})`);
        }
        
        if (miceData.data?.[0]) {
          const mice = miceData.data[0] as any;
          renderBullet(`Primary MICE Vulnerability: ${mice.primary_vulnerability || 'Not assessed'} (${(mice.recruitment_likelihood * 100 || 0).toFixed(0)}% recruitability)`);
        }
        
        if (influenceData.data) {
          const inf = influenceData.data as any;
          let topScore = 0;
          let topLabel = '';
          CIALDINI_PRINCIPLES.forEach(p => {
            const score = inf[`${p.key}_susceptibility`] || inf[p.key] || 0;
            if (score > topScore) {
              topScore = score;
              topLabel = p.label;
            }
          });
          if (topLabel) {
            renderBullet(`Primary Influence Vector: ${topLabel} (${topScore}% susceptibility)`);
          }
        }
        
        // Critical Findings from Deep Intelligence
        if (deepIntelAnalysis?.result) {
          const deep = deepIntelAnalysis.result as any;
          if (deep.key_findings?.length > 0) {
            yPos += 3;
            renderSubsection('Critical Intelligence Findings');
            deep.key_findings.slice(0, 5).forEach((f: any) => {
              const importance = f.importance?.toUpperCase() || 'MEDIUM';
              const color: [number, number, number] = importance === 'HIGH' ? [180, 0, 0] : importance === 'MEDIUM' ? [180, 100, 0] : [0, 100, 0];
              doc.setTextColor(...color);
              renderBullet(`[${importance}] ${f.finding}`);
              doc.setTextColor(0);
            });
          }
        }
        
        // Immediate Actions Required
        const actionPlans = psych?.action_plans as any;
        if (actionPlans?.immediate?.length > 0) {
          yPos += 3;
          renderSubsection('⚡ Immediate Actions Required');
          actionPlans.immediate.slice(0, 3).forEach((action: any) => {
            checkPageBreak(25);
            doc.setTextColor(180, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(`[${action.priority?.toUpperCase() || 'HIGH'}] ${action.title}`, margin + 5, yPos);
            doc.setTextColor(0);
            yPos += lineHeight;
            
            if (action.script) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              doc.setTextColor(60, 60, 60);
              const scriptLines = doc.splitTextToSize(`Script: "${action.script}"`, contentWidth - 15);
              checkPageBreak(scriptLines.length * 5 + 5);
              doc.text(scriptLines, margin + 10, yPos);
              doc.setTextColor(0);
              yPos += scriptLines.length * 5 + 3;
            }
          });
        }
        
        yPos += 8;
      }

      // ========================================
      // INTELLIGENCE SOURCE DASHBOARD
      // ========================================
      if (sections.find(s => s.id === 'sourceDashboard')?.enabled) {
        renderSectionHeader('Intelligence Source Dashboard', [80, 80, 80]);
        
        // Data Completeness Score
        checkPageBreak(35);
        doc.setFillColor(240, 245, 250);
        doc.roundedRect(margin, yPos - 3, contentWidth, 30, 3, 3, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Intelligence Completeness', margin + 5, yPos + 5);
        
        // Progress bar
        const barX = margin + 5;
        const barWidth = contentWidth - 50;
        doc.setFillColor(220, 220, 220);
        doc.rect(barX, yPos + 10, barWidth, 8, 'F');
        const complColor: [number, number, number] = intelligenceCompleteness >= 80 ? [0, 150, 0] : intelligenceCompleteness >= 50 ? [200, 150, 0] : [200, 50, 0];
        doc.setFillColor(...complColor);
        doc.rect(barX, yPos + 10, (intelligenceCompleteness / 100) * barWidth, 8, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...complColor);
        doc.text(`${intelligenceCompleteness}%`, barX + barWidth + 5, yPos + 17);
        doc.setTextColor(0);
        
        yPos += 35;
        
        // Source breakdown
        renderSubsection('Source Breakdown');
        const sourceBreakdown = [
          { label: 'Visual Media Intelligence', count: totalMediaAnalyzed, status: totalMediaAnalyzed > 0 ? '✓' : '○' },
          { label: 'Voice Pattern Analysis', count: totalVoiceSessions, status: totalVoiceSessions > 0 ? '✓' : '○' },
          { label: 'Psychological Profile', count: psychData.data?.length || 0, status: psychData.data?.length ? '✓' : '○' },
          { label: 'MICE Assessment', count: miceData.data?.length || 0, status: miceData.data?.length ? '✓' : '○' },
          { label: 'Influence Profile', count: influenceData.data ? 1 : 0, status: influenceData.data ? '✓' : '○' },
          { label: 'Behavioral DNA', count: behavioralDnaAnalysis ? 1 : 0, status: behavioralDnaAnalysis ? '✓' : '○' },
          { label: 'Sacred Values Map', count: sacredValuesAnalysis ? 1 : 0, status: sacredValuesAnalysis ? '✓' : '○' },
          { label: 'Quantum Cognition', count: cognitiveSuperpositions.data?.length || 0, status: cognitiveSuperpositions.data?.length ? '✓' : '○' },
        ];
        
        sourceBreakdown.forEach(source => {
          doc.setFontSize(8);
          const statusColor: [number, number, number] = source.status === '✓' ? [0, 150, 0] : [200, 200, 200];
          doc.setTextColor(...statusColor);
          doc.text(source.status, margin, yPos);
          doc.setTextColor(0);
          doc.text(`${source.label}: ${source.count}`, margin + 8, yPos);
          yPos += 5;
        });
        
        yPos += 8;
      }

      // ========================================
      // CONTACT OVERVIEW
      // ========================================
      if (sections.find(s => s.id === 'overview')?.enabled) {
        renderSectionHeader('Contact Overview', [50, 50, 50]);
        
        renderKeyValue('Full Name', contactName);
        renderKeyValue('Organization', profile.organization || 'Unknown');
        renderKeyValue('Position', profile.job_title || 'Unknown');
        renderKeyValue('Relationship Type', profile.relationship_type || 'Unclassified');
        renderKeyValue('Last Contact', profile.last_contact_date ? format(new Date(profile.last_contact_date), 'MMM d, yyyy') : 'Unknown');
        
        if (profile.notes) {
          yPos += 3;
          renderSubsection('Notes');
          const noteLines = doc.splitTextToSize(profile.notes, contentWidth);
          checkPageBreak(noteLines.length * lineHeight + 5);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(noteLines, margin, yPos);
          yPos += noteLines.length * lineHeight;
        }
        
        // Life milestones
        if (milestonesData.data?.length > 0) {
          yPos += 3;
          renderSubsection('Key Life Milestones');
          milestonesData.data.slice(0, 5).forEach((m: any) => {
            renderBullet(`${format(new Date(m.milestone_date), 'MMM yyyy')}: ${m.milestone_type} - ${m.description || ''}`, 5);
          });
        }
        
        yPos += 8;
      }

      // ========================================
      // BEHAVIORAL DNA FINGERPRINT
      // ========================================
      if (sections.find(s => s.id === 'behavioralDna')?.enabled && behavioralDnaAnalysis) {
        renderSectionHeader('Contact DNA Fingerprint', [102, 0, 102]);
        
        const dna = behavioralDnaAnalysis.result as any;
        
        if (dna.behavioral_genome?.core_traits?.length > 0) {
          renderSubsection('Core Behavioral Traits');
          
          // Group traits by category
          const traitsByCategory: Record<string, any[]> = {};
          dna.behavioral_genome.core_traits.forEach((trait: any) => {
            const cat = trait.category || 'general';
            if (!traitsByCategory[cat]) traitsByCategory[cat] = [];
            traitsByCategory[cat].push(trait);
          });
          
          Object.entries(traitsByCategory).slice(0, 4).forEach(([category, traits]) => {
            checkPageBreak(20);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(102, 0, 102);
            doc.text(category.toUpperCase(), margin, yPos);
            doc.setTextColor(0);
            yPos += 5;
            
            (traits as any[]).slice(0, 3).forEach((trait: any) => {
              renderScoreBar(trait.trait, trait.strength || 50, 100, [102, 50, 102]);
            });
            yPos += 3;
          });
        }
        
        if (dna.decision_architecture) {
          renderSubsection('Decision Architecture');
          const arch = dna.decision_architecture;
          renderKeyValue('Primary Archetype', arch.primary_archetype);
          renderKeyValue('Decision Speed', arch.decision_speed);
          renderKeyValue('Information Needs', arch.information_needs);
          if (arch.sunk_cost_vulnerability) {
            renderScoreBar('Sunk Cost Vulnerability', arch.sunk_cost_vulnerability, 100, [200, 100, 0]);
          }
        }
        
        if (dna.manipulation_vulnerability) {
          renderSubsection('🎯 Manipulation Vulnerability');
          const vuln = dna.manipulation_vulnerability;
          renderScoreBar('Overall Vulnerability', vuln.overall_vulnerability || 50, 100, [180, 0, 0]);
          
          if (vuln.effective_vectors?.length > 0) {
            doc.setTextColor(180, 0, 0);
            vuln.effective_vectors.slice(0, 4).forEach((v: any) => {
              renderBullet(`${v.vector} (${v.effectiveness}% effective)`, 5);
            });
            doc.setTextColor(0);
          }
          
          if (vuln.cognitive_biases?.length > 0) {
            yPos += 3;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Exploitable Cognitive Biases:', margin, yPos);
            yPos += 5;
            vuln.cognitive_biases.slice(0, 4).forEach((b: any) => {
              renderBullet(`${b.bias}: ${b.exploitation_method}`, 5);
            });
          }
        }
        
        if (dna.behavioral_tells) {
          const tells = dna.behavioral_tells;
          if (tells.deception_tells?.length > 0) {
            renderSubsection('Deception Tells');
            tells.deception_tells.slice(0, 3).forEach((t: any) => {
              renderBullet(`${t.tell} (${t.reliability}% reliable)`, 5);
            });
          }
          if (tells.stress_tells?.length > 0) {
            renderSubsection('Stress Tells');
            tells.stress_tells.slice(0, 3).forEach((t: any) => {
              renderBullet(`${t.tell} (${t.reliability}% reliable)`, 5);
            });
          }
        }
        
        yPos += 8;
      }

      // ========================================
      // PATTERN-OF-LIFE ANALYSIS
      // ========================================
      if (sections.find(s => s.id === 'patternOfLife')?.enabled) {
        renderSectionHeader('Pattern-of-Life Analysis', [0, 80, 80]);
        
        const dna = behavioralDnaAnalysis?.result as any;
        
        if (dna?.micro_patterns) {
          const patterns = dna.micro_patterns;
          
          if (patterns.communication_timing) {
            renderSubsection('Communication Rhythms');
            const timing = patterns.communication_timing;
            if (timing.peak_response_hours?.length > 0) {
              renderKeyValue('Peak Hours', timing.peak_response_hours.join(', '));
            }
            if (timing.response_latency_baseline) {
              renderKeyValue('Response Baseline', timing.response_latency_baseline);
            }
            if (timing.urgency_indicators?.length > 0) {
              doc.setFontSize(8);
              doc.text('Urgency Indicators:', margin, yPos);
              yPos += 4;
              timing.urgency_indicators.slice(0, 3).forEach((i: string) => renderBullet(i, 10));
            }
          }
          
          if (patterns.linguistic_fingerprint) {
            renderSubsection('Linguistic Fingerprint');
            const ling = patterns.linguistic_fingerprint;
            renderKeyValue('Vocabulary Tier', ling.vocabulary_tier);
            renderKeyValue('Sentence Complexity', ling.sentence_complexity);
            renderKeyValue('Emotional Expression', ling.emotional_expression);
            if (ling.signature_phrases?.length > 0) {
              doc.setFontSize(8);
              doc.text('Signature Phrases:', margin, yPos);
              yPos += 4;
              ling.signature_phrases.slice(0, 4).forEach((p: string) => renderBullet(`"${p}"`, 10));
            }
          }
          
          if (patterns.behavioral_rhythms) {
            renderSubsection('Behavioral Rhythms');
            const rhythms = patterns.behavioral_rhythms;
            if (rhythms.energy_cycles) renderKeyValue('Energy Cycles', rhythms.energy_cycles);
            if (rhythms.productivity_patterns) renderKeyValue('Productivity', rhythms.productivity_patterns);
          }
        }
        
        // Chronotype from observations
        const chronotypeObs = observationsData.data?.find((o: any) => o.observation_type === 'chronotype');
        if (chronotypeObs) {
          renderSubsection('Chronotype Profile');
          renderKeyValue('Type', (chronotypeObs as any).summary || 'Unknown');
        }
        
        yPos += 8;
      }

      // ========================================
      // RELATIONSHIP ECOSYSTEM MAP
      // ========================================
      if (sections.find(s => s.id === 'relationshipEcosystem')?.enabled && relationshipsData.data?.length > 0) {
        renderSectionHeader('Relationship Ecosystem Map', [0, 102, 102]);
        
        renderSubsection(`${relationshipsData.data.length} Known Connections`);
        
        // Group by relationship type
        const byType: Record<string, any[]> = {};
        relationshipsData.data.forEach((rel: any) => {
          const type = rel.relationship_type || 'Other';
          if (!byType[type]) byType[type] = [];
          byType[type].push(rel);
        });
        
        Object.entries(byType).slice(0, 5).forEach(([type, rels]) => {
          checkPageBreak(15);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(`${type} (${rels.length})`, margin, yPos);
          yPos += 5;
          
          (rels as any[]).slice(0, 4).forEach((rel: any) => {
            const name = rel.to_profile 
              ? `${rel.to_profile.first_name} ${rel.to_profile.last_name || ''}`.trim()
              : 'Unknown';
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`  • ${name} | Strength: ${rel.strength || 'Unknown'}`, margin, yPos);
            yPos += 4;
          });
          yPos += 3;
        });
        
        // Influence flow if available
        if (relationshipsData.data.some((r: any) => r.influence_direction)) {
          renderSubsection('Influence Flow');
          const influencers = relationshipsData.data.filter((r: any) => r.influence_direction === 'inbound');
          const influenced = relationshipsData.data.filter((r: any) => r.influence_direction === 'outbound');
          if (influencers.length > 0) {
            renderBullet(`Influenced BY: ${influencers.length} connections`, 5);
          }
          if (influenced.length > 0) {
            renderBullet(`Influences: ${influenced.length} connections`, 5);
          }
        }
        
        yPos += 8;
      }

      // ========================================
      // DEEP PSYCHOLOGICAL PROFILE
      // ========================================
      if (sections.find(s => s.id === 'psychological')?.enabled && psychData.data?.length > 0) {
        renderSectionHeader('Deep Psychological Profile', [102, 0, 102]);
        
        const psych = psychData.data[0] as any;
        
        // Attachment Architecture
        if (psych.attachment_style) {
          const style = psych.attachment_style as any;
          renderSubsection('Attachment Architecture');
          
          checkPageBreak(35);
          doc.setFillColor(245, 240, 250);
          doc.roundedRect(margin, yPos - 2, contentWidth, 30, 2, 2, 'F');
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(102, 0, 102);
          doc.text(style.primary_style?.toUpperCase() || 'UNKNOWN', margin + 5, yPos + 8);
          doc.setTextColor(0);
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text('Anxiety:', margin + 70, yPos + 5);
          doc.setFillColor(200, 200, 200);
          doc.rect(margin + 95, yPos + 1, 50, 5, 'F');
          doc.setFillColor(200, 50, 50);
          doc.rect(margin + 95, yPos + 1, (style.anxiety_score || 0) / 2, 5, 'F');
          doc.text(`${style.anxiety_score || 0}%`, margin + 148, yPos + 5);
          
          doc.text('Avoidance:', margin + 70, yPos + 15);
          doc.setFillColor(200, 200, 200);
          doc.rect(margin + 95, yPos + 11, 50, 5, 'F');
          doc.setFillColor(50, 50, 200);
          doc.rect(margin + 95, yPos + 11, (style.avoidance_score || 0) / 2, 5, 'F');
          doc.text(`${style.avoidance_score || 0}%`, margin + 148, yPos + 15);
          
          yPos += 35;
          
          if (style.evidence?.length > 0) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Supporting Evidence:', margin, yPos);
            yPos += 5;
            style.evidence.slice(0, 3).forEach((e: string) => {
              const lines = doc.splitTextToSize(`- ${e}`, contentWidth - 10);
              checkPageBreak(lines.length * 5 + 2);
              doc.text(lines, margin + 5, yPos);
              yPos += lines.length * 5;
            });
          }
          yPos += 5;
        }
        
        // Dark Triad Indicators
        if (psych.dark_triad_indicators) {
          const dark = psych.dark_triad_indicators as any;
          renderSubsection('Dark Triad Analysis');
          
          if (dark.narcissism !== undefined) renderScoreBar('Narcissism', dark.narcissism, 100, [180, 0, 0]);
          if (dark.machiavellianism !== undefined) renderScoreBar('Machiavellianism', dark.machiavellianism, 100, [100, 0, 100]);
          if (dark.psychopathy !== undefined) renderScoreBar('Psychopathy', dark.psychopathy, 100, [50, 50, 50]);
          
          if (dark.manifestations?.length > 0) {
            yPos += 2;
            dark.manifestations.slice(0, 4).forEach((m: string) => renderBullet(m, 5));
          }
          yPos += 5;
        }
        
        // Emotional Intelligence
        if (psych.emotional_intelligence) {
          const ei = psych.emotional_intelligence as any;
          renderSubsection('Emotional Intelligence Map');
          
          if (ei.self_awareness !== undefined) renderScoreBar('Self-Awareness', ei.self_awareness, 100, [0, 100, 150]);
          if (ei.self_regulation !== undefined) renderScoreBar('Self-Regulation', ei.self_regulation, 100, [0, 100, 150]);
          if (ei.empathy !== undefined) renderScoreBar('Empathy', ei.empathy, 100, [0, 150, 100]);
          if (ei.social_skills !== undefined) renderScoreBar('Social Skills', ei.social_skills, 100, [0, 150, 100]);
          yPos += 3;
        }
        
        // Vulnerabilities
        const vulnerabilities = psych.vulnerabilities || psych.vulnerability_map;
        if (vulnerabilities && Array.isArray(vulnerabilities) && vulnerabilities.length > 0) {
          renderSubsection('🎯 Identified Vulnerabilities');
          doc.setTextColor(180, 0, 0);
          vulnerabilities.slice(0, 6).forEach((vuln: string) => renderBullet(vuln, 5));
          doc.setTextColor(0);
          yPos += 3;
        }
        
        // Leverage Points
        const leveragePoints = psych.leverage_points || psych.influence_vectors;
        if (leveragePoints && Array.isArray(leveragePoints) && leveragePoints.length > 0) {
          renderSubsection('💪 Leverage Points');
          doc.setTextColor(0, 100, 0);
          leveragePoints.slice(0, 6).forEach((lp: string) => renderBullet(lp, 5));
          doc.setTextColor(0);
        }
        
        yPos += 8;
      }

      // ========================================
      // QUANTUM COGNITION ANALYSIS
      // ========================================
      if (sections.find(s => s.id === 'quantumCognition')?.enabled && cognitiveSuperpositions.data?.length > 0) {
        renderSectionHeader('Quantum Cognition Analysis', [0, 100, 150]);
        
        const quantum = cognitiveSuperpositions.data[0] as any;
        
        if (quantum.superposition_states?.length > 0) {
          renderSubsection('Superposition States');
          doc.setFontSize(8);
          doc.setTextColor(0, 100, 150);
          (quantum.superposition_states as any[]).slice(0, 4).forEach((state: any) => {
            const text = typeof state === 'string' ? state : `${state.belief || state.state}: ${(state.probability * 100 || 50).toFixed(0)}% likelihood`;
            renderBullet(text, 5);
          });
          doc.setTextColor(0);
        }
        
        if (quantum.collapse_probability !== undefined) {
          yPos += 3;
          renderScoreBar('Collapse Probability', quantum.collapse_probability * 100, 100, [0, 100, 150]);
        }
        
        if (quantum.interference_patterns) {
          renderSubsection('Interference Patterns');
          const patterns = quantum.interference_patterns;
          if (typeof patterns === 'object') {
            Object.entries(patterns).slice(0, 4).forEach(([key, value]) => {
              renderKeyValue(key.replace(/_/g, ' '), String(value));
            });
          }
        }
        
        if (quantum.entanglement_partners?.length > 0) {
          renderSubsection('Entanglement Partners');
          doc.setFontSize(8);
          (quantum.entanglement_partners as any[]).slice(0, 4).forEach((partner: any) => {
            const text = typeof partner === 'string' ? partner : `${partner.name || 'Unknown'}: ${partner.correlation || 'Correlated'}`;
            renderBullet(text, 5);
          });
        }
        
        yPos += 8;
      }

      // ========================================
      // ENGAGEMENT PLAYBOOK
      // ========================================
      if (sections.find(s => s.id === 'playbook')?.enabled && playbookAnalysis) {
        renderSectionHeader('Engagement Playbook', [0, 102, 51]);
        
        const result = playbookAnalysis.result as any;
        
        // Power Words
        if (result.powerWords?.length > 0) {
          renderSubsection('✓ Power Words');
          doc.setTextColor(0, 100, 0);
          const wordsText = result.powerWords.slice(0, 10).join(' • ');
          const lines = doc.splitTextToSize(wordsText, contentWidth - 10);
          checkPageBreak(lines.length * lineHeight + 5);
          doc.setFontSize(9);
          doc.text(lines, margin + 5, yPos);
          doc.setTextColor(0);
          yPos += lines.length * lineHeight + 3;
        }
        
        // Words to Avoid
        if (result.avoidWords?.length > 0) {
          renderSubsection('✗ Words to Avoid');
          doc.setTextColor(180, 0, 0);
          const avoidText = result.avoidWords.slice(0, 10).join(' • ');
          const lines = doc.splitTextToSize(avoidText, contentWidth - 10);
          checkPageBreak(lines.length * lineHeight + 5);
          doc.setFontSize(9);
          doc.text(lines, margin + 5, yPos);
          doc.setTextColor(0);
          yPos += lines.length * lineHeight + 3;
        }
        
        // Scenario Scripts
        if (result.scenarioScripts?.length > 0) {
          renderSubsection('Scenario-Based Scripts');
          result.scenarioScripts.slice(0, 4).forEach((script: any) => {
            checkPageBreak(25);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(`When: ${script.scenario || script.trigger}`, margin, yPos);
            yPos += lineHeight;
            
            if (script.script || script.response) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              doc.setTextColor(60, 60, 60);
              const scriptLines = doc.splitTextToSize(`"${script.script || script.response}"`, contentWidth - 15);
              checkPageBreak(scriptLines.length * 5 + 3);
              doc.text(scriptLines, margin + 10, yPos);
              doc.setTextColor(0);
              yPos += scriptLines.length * 5 + 5;
            }
          });
        }
        
        // Topics to Avoid
        if (result.topicsToAvoid?.length > 0) {
          renderSubsection('🚫 CRITICAL: Topics to Avoid');
          doc.setTextColor(180, 0, 0);
          result.topicsToAvoid.slice(0, 5).forEach((topic: string) => renderBullet(`${topic}`, 5, '✗'));
          doc.setTextColor(0);
        }
        
        yPos += 8;
      }

      // ========================================
      // HYPNOTIC LANGUAGE PATTERNS
      // ========================================
      if (sections.find(s => s.id === 'hypnoticPatterns')?.enabled) {
        renderSectionHeader('Hypnotic Language Patterns', [100, 0, 100]);
        
        const psych = psychData.data?.[0] as any;
        const personality = psych?.personality_traits || {};
        
        // Recommend patterns based on personality
        const patterns = [
          { name: 'Embedded Commands', desc: 'Hidden imperatives in casual speech', effectiveness: personality.agreeableness > 50 ? 85 : 70 },
          { name: 'Presuppositions', desc: 'Assumptions embedded in statements', effectiveness: 82 },
          { name: 'Future Pacing', desc: 'Visualizing desired outcome as accomplished', effectiveness: personality.openness > 50 ? 88 : 75 },
          { name: 'Double Binds', desc: 'Illusory choices leading to same outcome', effectiveness: 89 },
          { name: 'Yes-Set Pattern', desc: 'Building agreement momentum', effectiveness: personality.agreeableness > 50 ? 90 : 78 },
        ];
        
        renderSubsection('Optimal Patterns for This Target');
        patterns.forEach(p => {
          renderScoreBar(p.name, p.effectiveness, 100, [100, 0, 100]);
        });
        
        // Example scripts
        renderSubsection('Sample Scripts');
        checkPageBreak(40);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const scripts = [
          `[Embedded Command] "I'm wondering if you might consider this proposal as we continue..."`,
          `[Presupposition] "Before you agree, you might want to consider the benefits..."`,
          `[Future Pacing] "Imagine a month from now, when you've already decided, looking back..."`,
          `[Double Bind] "Would you prefer to decide now, or would you rather think about it tonight?"`,
        ];
        scripts.forEach(script => {
          const lines = doc.splitTextToSize(script, contentWidth - 10);
          checkPageBreak(lines.length * 5 + 3);
          doc.text(lines, margin + 5, yPos);
          yPos += lines.length * 5 + 2;
        });
        doc.setTextColor(0);
        
        yPos += 8;
      }

      // ========================================
      // ELICITATION TECHNIQUE GUIDE
      // ========================================
      if (sections.find(s => s.id === 'elicitation')?.enabled) {
        renderSectionHeader('Elicitation Technique Guide', [0, 80, 100]);
        
        const psych = psychData.data?.[0] as any;
        
        // Calculate optimal techniques based on profile
        const egoLevel = (psych?.dark_triad_indicators?.narcissism || 50) / 100;
        const suspicionLevel = (psych?.suspicion_baseline || 30) / 100;
        
        renderSubsection('FBI Elicitation Techniques - Ranked for Target');
        
        const rankedTechniques = [
          { name: 'Flattery', category: 'ego', effectiveness: Math.round((0.8 + egoLevel * 0.15) * 100), detectability: 40 },
          { name: 'Quid Pro Quo', category: 'reciprocity', effectiveness: 85, detectability: 30 },
          { name: 'Assumed Knowledge', category: 'assumption', effectiveness: 75, detectability: 30 },
          { name: 'Deliberate False Statement', category: 'assumption', effectiveness: Math.round(85 * (1 - suspicionLevel * 0.3)), detectability: 25 },
          { name: 'Feigned Naivete', category: 'cognitive', effectiveness: 78, detectability: 30 },
          { name: 'Word Repetition', category: 'cognitive', effectiveness: 75, detectability: 20 },
        ].sort((a, b) => b.effectiveness - a.effectiveness);
        
        rankedTechniques.slice(0, 5).forEach((tech, idx) => {
          checkPageBreak(12);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}. ${tech.name}`, margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(`[${tech.category}] Eff: ${tech.effectiveness}% | Det: ${tech.detectability}%`, margin + 60, yPos);
          yPos += 7;
        });
        
        // Previous elicitation sessions
        if (elicitationSessions.data?.length > 0) {
          yPos += 3;
          renderSubsection('Previous Elicitation Sessions');
          (elicitationSessions.data as any[]).slice(0, 3).forEach((session: any) => {
            checkPageBreak(15);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`Session: ${session.session_type || 'Unknown'}`, margin, yPos);
            yPos += 5;
            if (session.techniques_used?.length > 0) {
              doc.setFont('helvetica', 'normal');
              doc.text(`Techniques: ${session.techniques_used.slice(0, 3).join(', ')}`, margin + 5, yPos);
              yPos += 5;
            }
          });
        }
        
        yPos += 8;
      }

      // ========================================
      // COGNITIVE LOAD EXPLOITATION
      // ========================================
      if (sections.find(s => s.id === 'cognitiveLoad')?.enabled) {
        renderSectionHeader('Cognitive Load Exploitation', [80, 0, 80]);
        
        const dna = behavioralDnaAnalysis?.result as any;
        const decisionArch = dna?.decision_architecture;
        
        renderSubsection('Cognitive State Indicators');
        
        if (decisionArch) {
          renderKeyValue('Decision Fatigue Threshold', decisionArch.decision_fatigue_threshold || 'Medium');
          if (decisionArch.regret_sensitivity) {
            renderScoreBar('Regret Sensitivity', decisionArch.regret_sensitivity, 100, [180, 100, 0]);
          }
          if (decisionArch.sunk_cost_vulnerability) {
            renderScoreBar('Sunk Cost Vulnerability', decisionArch.sunk_cost_vulnerability, 100, [180, 0, 0]);
          }
        }
        
        renderSubsection('Exploitation Windows');
        const windows = [
          { window: 'Post-Meeting Fatigue', timing: 'After long meetings', technique: 'Default option strategy' },
          { window: 'End of Day', timing: '4-6 PM', technique: 'Emotional appeals' },
          { window: 'Information Overload', timing: 'After complex discussions', technique: 'Simplification anchoring' },
          { window: 'Ego Depletion', timing: 'After self-control exertion', technique: 'Impulse-friendly offers' },
        ];
        
        windows.forEach(w => {
          checkPageBreak(15);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text(`${w.window}`, margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(`[${w.timing}] → ${w.technique}`, margin + 50, yPos);
          yPos += 6;
        });
        
        yPos += 8;
      }

      // ========================================
      // MEDIA INTELLIGENCE SYNTHESIS
      // ========================================
      if (sections.find(s => s.id === 'mediaIntel')?.enabled) {
        const hasMediaAnalyses = mediaAnalyses.data && mediaAnalyses.data.length > 0;
        const hasMediaMetadata = mediaData.data && mediaData.data.length > 0;
        
        if (hasMediaAnalyses || hasMediaMetadata) {
          renderSectionHeader('Media Intelligence Synthesis', [51, 51, 102]);
          
          checkPageBreak(20);
          doc.setFillColor(245, 245, 255);
          doc.roundedRect(margin, yPos - 3, contentWidth, 18, 2, 2, 'F');
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 51, 102);
          doc.text(`📷 ${totalMediaAnalyzed} MEDIA ITEMS ANALYZED`, margin + 5, yPos + 5);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`${mediaAnalyses.data?.length || 0} Deep Analyses Performed`, margin + 5, yPos + 12);
          doc.setTextColor(0);
          yPos += 22;
          
          if (mediaAggregation?.result) {
            const agg = mediaAggregation.result as any;
            
            if (agg.certainties?.length > 0) {
              renderSubsection('✓ High-Confidence Conclusions');
              doc.setTextColor(0, 100, 0);
              agg.certainties.slice(0, 8).forEach((c: string) => renderBullet(c, 5, '✓'));
              doc.setTextColor(0);
              yPos += 3;
            }
            
            if (agg.people_network?.identified_individuals?.length > 0) {
              renderSubsection('👥 Network Analysis (from Media)');
              agg.people_network.identified_individuals.slice(0, 6).forEach((p: any) => {
                renderBullet(`${p.description || p.name}: ${p.relationship_type || 'Unknown relationship'}`, 5);
              });
              yPos += 3;
            }
            
            if (agg.location_timeline?.length > 0) {
              renderSubsection('📍 Location Intelligence');
              agg.location_timeline.slice(0, 6).forEach((l: any) => {
                renderBullet(`${l.location}: ${l.frequency || 1} occurrence(s)${l.date_range ? ` (${l.date_range})` : ''}`, 5);
              });
              yPos += 3;
            }
            
            if (agg.red_flags?.length > 0) {
              renderSubsection('🚨 Red Flags from Media');
              doc.setTextColor(180, 0, 0);
              agg.red_flags.slice(0, 5).forEach((rf: string) => renderBullet(rf, 5, '⚠'));
              doc.setTextColor(0);
            }
          }
          
          yPos += 8;
        }
      }

      // ========================================
      // VOICE INTELLIGENCE
      // ========================================
      if (sections.find(s => s.id === 'voiceIntel')?.enabled && (voiceData.data?.length > 0 || voiceAggregation?.result)) {
        renderSectionHeader('Voice Intelligence', [102, 0, 51]);
        
        checkPageBreak(18);
        doc.setFillColor(255, 245, 250);
        doc.roundedRect(margin, yPos - 3, contentWidth, 14, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 0, 51);
        doc.text(`🎙️ ${totalVoiceSessions} VOICE SESSIONS ANALYZED`, margin + 5, yPos + 5);
        doc.setTextColor(0);
        yPos += 20;
        
        if (voiceAggregation?.result) {
          const voice = voiceAggregation.result as any;
          
          if (voice.vocal_psychology) {
            renderSubsection('🧠 Vocal Psychology');
            const vp = voice.vocal_psychology;
            if (vp.baseline_emotional_state) renderKeyValue('Baseline Emotional State', vp.baseline_emotional_state);
            if (vp.stress_indicators?.length > 0) {
              vp.stress_indicators.slice(0, 3).forEach((s: string) => renderBullet(s, 5));
            }
            yPos += 3;
          }
          
          if (voice.deception_markers?.length > 0) {
            renderSubsection('⚠ Deception Markers Detected');
            doc.setTextColor(180, 100, 0);
            voice.deception_markers.slice(0, 4).forEach((m: string) => renderBullet(m, 5));
            doc.setTextColor(0);
          }
        }
        
        yPos += 8;
      }

      // ========================================
      // DECEPTION ANALYSIS DEEP DIVE
      // ========================================
      if (sections.find(s => s.id === 'deceptionAnalysis')?.enabled) {
        const psych = psychData.data?.[0] as any;
        const deception = psych?.deception_analysis;
        
        if (deception || crossModalData.data?.length > 0) {
          renderSectionHeader('Deception Analysis Deep Dive', [180, 100, 0]);
          
          if (deception) {
            renderSubsection('Authenticity Assessment');
            if (deception.baseline_established) {
              renderKeyValue('Deception Baseline', 'Established ✓');
            }
            if (deception.authenticity_score !== undefined) {
              renderScoreBar('Authenticity Score', deception.authenticity_score, 100, [0, 150, 0]);
            }
            
            if (deception.detected_tells?.length > 0) {
              renderSubsection('Detected Deception Tells');
              doc.setTextColor(180, 100, 0);
              deception.detected_tells.slice(0, 5).forEach((t: string) => renderBullet(t, 5, '⚠'));
              doc.setTextColor(0);
            }
            
            if (deception.trigger_topics?.length > 0) {
              renderSubsection('Topics That Trigger Deception');
              doc.setTextColor(180, 0, 0);
              deception.trigger_topics.slice(0, 4).forEach((t: string) => renderBullet(t, 5));
              doc.setTextColor(0);
            }
          }
          
          // Cross-modal deception synthesis
          const deceptionCorrelation = crossModalData.data?.find((c: any) => c.correlation_type === 'deception_synthesis');
          if (deceptionCorrelation) {
            renderSubsection('Cross-Modal Deception Fingerprint');
            const patternData = (deceptionCorrelation as any).pattern_data;
            if (patternData?.deception_score) {
              renderScoreBar('Deception Risk', patternData.deception_score * 100, 100, [180, 50, 0]);
            }
          }
          
          yPos += 8;
        }
      }

      // ========================================
      // STRATEGIC ACTION PLANS
      // ========================================
      if (sections.find(s => s.id === 'actionPlans')?.enabled && psychData.data?.length > 0) {
        const actionPlans = (psychData.data[0] as any).action_plans as any;
        
        if (actionPlans) {
          renderSectionHeader('Strategic Action Plans', [0, 102, 102]);
          
          const renderActionCategory = (title: string, actions: any[], urgencyColor: [number, number, number], emoji: string) => {
            if (!actions?.length) return;
            
            checkPageBreak(25);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(...urgencyColor);
            doc.text(`${emoji} ${title}`, margin, yPos);
            doc.setTextColor(0);
            yPos += lineHeight + 3;
            
            actions.slice(0, 5).forEach((action: any) => {
              checkPageBreak(35);
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              const priority = action.priority?.toLowerCase() || 'normal';
              renderPriorityBadge(priority, margin, yPos);
              doc.text(action.title, margin + 22, yPos);
              yPos += lineHeight + 2;
              
              if (action.description) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                const lines = doc.splitTextToSize(action.description, contentWidth - 20);
                doc.text(lines, margin + 10, yPos);
                yPos += lines.length * 5;
              }
              
              if (action.script) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8);
                doc.setTextColor(80, 80, 80);
                const scriptLines = doc.splitTextToSize(`📝 Script: "${action.script}"`, contentWidth - 25);
                checkPageBreak(scriptLines.length * 5 + 3);
                doc.text(scriptLines, margin + 15, yPos);
                doc.setTextColor(0);
                yPos += scriptLines.length * 5 + 2;
              }
              
              yPos += 4;
            });
            
            yPos += 3;
          };
          
          renderActionCategory('IMMEDIATE ACTIONS (Critical)', actionPlans.immediate, [180, 0, 0], '🔴');
          renderActionCategory('SHORT-TERM ACTIONS', actionPlans.short_term, [180, 100, 0], '🟠');
          renderActionCategory('LONG-TERM ACTIONS', actionPlans.long_term, [0, 100, 0], '🟢');
          
          // Do Not Do list
          if (actionPlans.do_not_do?.length > 0) {
            checkPageBreak(30);
            doc.setFillColor(255, 230, 230);
            doc.roundedRect(margin, yPos - 2, contentWidth, 10, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(180, 0, 0);
            doc.text('🚫 CRITICAL: DO NOT DO', margin + 5, yPos + 5);
            doc.setTextColor(0);
            yPos += 15;
            
            actionPlans.do_not_do.slice(0, 6).forEach((item: any) => {
              checkPageBreak(18);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(180, 0, 0);
              doc.text(`✗ ${item.action || item}`, margin + 5, yPos);
              doc.setTextColor(0);
              yPos += lineHeight;
              
              if (item.reason) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                const lines = doc.splitTextToSize(`Reason: ${item.reason}`, contentWidth - 15);
                doc.text(lines, margin + 10, yPos);
                doc.setTextColor(0);
                yPos += lines.length * 5;
              }
              yPos += 3;
            });
          }
          
          yPos += 8;
        }
      }

      // ========================================
      // MICE VULNERABILITY MATRIX
      // ========================================
      if (sections.find(s => s.id === 'mice')?.enabled && miceData.data?.length > 0) {
        renderSectionHeader('MICE Vulnerability Matrix', [102, 0, 0]);
        
        const mice = miceData.data[0] as any;
        
        checkPageBreak(45);
        doc.setFillColor(255, 248, 248);
        doc.roundedRect(margin, yPos - 3, contentWidth, 40, 3, 3, 'F');
        
        const miceScores = [
          { label: 'MONEY', score: mice.money_score || 0, color: [0, 150, 0] as [number, number, number] },
          { label: 'IDEOLOGY', score: mice.ideology_score || 0, color: [0, 100, 200] as [number, number, number] },
          { label: 'COMPROMISE', score: mice.compromise_score || 0, color: [200, 0, 0] as [number, number, number] },
          { label: 'EGO', score: mice.ego_score || 0, color: [150, 100, 0] as [number, number, number] },
        ];
        
        const boxWidth = (contentWidth - 15) / 4;
        miceScores.forEach((m, i) => {
          const x = margin + 5 + (i * boxWidth);
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...m.color);
          doc.text(m.label, x, yPos + 5);
          
          doc.setFillColor(...m.color);
          doc.circle(x + 15, yPos + 18, 10, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${m.score}`, x + 15, yPos + 21, { align: 'center' });
          
          doc.setTextColor(0);
        });
        yPos += 45;
        
        if (mice.primary_vulnerability) {
          doc.setFillColor(255, 200, 200);
          doc.roundedRect(margin, yPos - 2, contentWidth, 12, 2, 2, 'F');
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`Primary Vulnerability: ${mice.primary_vulnerability.toUpperCase()}`, margin + 5, yPos + 5);
          if (mice.recruitment_likelihood) {
            doc.text(`Recruitment Likelihood: ${(mice.recruitment_likelihood * 100).toFixed(0)}%`, margin + 110, yPos + 5);
          }
          yPos += 18;
        }
        
        if (mice.approach_recommendations?.length > 0) {
          renderSubsection('Recommended Approaches');
          mice.approach_recommendations.slice(0, 5).forEach((r: string) => renderBullet(r, 5));
        }
        
        yPos += 8;
      }

      // ========================================
      // RASCLS/CIALDINI INFLUENCE PROFILE
      // ========================================
      if (sections.find(s => s.id === 'cialdini')?.enabled && influenceData.data) {
        renderSectionHeader('RASCLS Influence Profile (Cialdini)', [0, 102, 153]);
        
        const influence = influenceData.data as any;
        
        checkPageBreak(80);
        doc.setFillColor(245, 250, 255);
        doc.roundedRect(margin, yPos - 3, contentWidth, 70, 2, 2, 'F');
        yPos += 5;
        
        CIALDINI_PRINCIPLES.forEach((principle) => {
          const score = influence[`${principle.key}_susceptibility`] || influence[principle.key] || 0;
          const displayScore = typeof score === 'number' ? score : 50;
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text(principle.label, margin + 5, yPos);
          
          const barX = margin + 55;
          const barWidth = 70;
          doc.setFillColor(220, 220, 220);
          doc.rect(barX, yPos - 4, barWidth, 5, 'F');
          
          const color: [number, number, number] = displayScore > 70 ? [0, 150, 0] : displayScore > 40 ? [200, 150, 0] : [150, 150, 150];
          doc.setFillColor(...color);
          doc.rect(barX, yPos - 4, (displayScore / 100) * barWidth, 5, 'F');
          
          doc.setFont('helvetica', 'normal');
          doc.text(`${displayScore}%`, barX + barWidth + 5, yPos);
          
          yPos += 9;
        });
        
        yPos += 5;
        
        if (influence.optimal_approach) {
          renderSubsection('Optimal Influence Strategy');
          renderBullet(influence.optimal_approach, 5);
        }
        
        if (influence.positive_triggers?.length > 0) {
          renderSubsection('✓ Positive Triggers');
          doc.setTextColor(0, 100, 0);
          const triggerText = influence.positive_triggers.slice(0, 8).join(' • ');
          const lines = doc.splitTextToSize(triggerText, contentWidth - 10);
          checkPageBreak(lines.length * lineHeight + 5);
          doc.setFontSize(9);
          doc.text(lines, margin + 5, yPos);
          doc.setTextColor(0);
          yPos += lines.length * lineHeight + 3;
        }
        
        if (influence.negative_triggers?.length > 0) {
          renderSubsection('✗ Negative Triggers (Avoid)');
          doc.setTextColor(180, 0, 0);
          const triggerText = influence.negative_triggers.slice(0, 8).join(' • ');
          const lines = doc.splitTextToSize(triggerText, contentWidth - 10);
          checkPageBreak(lines.length * lineHeight + 5);
          doc.setFontSize(9);
          doc.text(lines, margin + 5, yPos);
          doc.setTextColor(0);
          yPos += lines.length * lineHeight;
        }
        
        yPos += 8;
      }

      // ========================================
      // SACRED VALUES PROFILE
      // ========================================
      if (sections.find(s => s.id === 'sacredValues')?.enabled && sacredValuesAnalysis) {
        renderSectionHeader('Sacred Values Profile', [120, 60, 0]);
        
        const sacred = sacredValuesAnalysis.result as any;
        
        if (sacred.sacred_values?.length > 0) {
          renderSubsection('Identified Sacred Values');
          (sacred.sacred_values as any[]).slice(0, 5).forEach((val: any) => {
            checkPageBreak(20);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(120, 60, 0);
            doc.text(`${val.domain?.toUpperCase() || 'VALUE'}: ${val.value}`, margin, yPos);
            doc.setTextColor(0);
            yPos += 5;
            
            if (val.protection_level !== undefined) {
              renderScoreBar('Protection Level', val.protection_level * 100, 100, [180, 0, 0]);
            }
            if (val.trigger_phrases?.length > 0) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'italic');
              doc.text(`Triggers: ${val.trigger_phrases.slice(0, 3).join(', ')}`, margin + 5, yPos);
              yPos += 5;
            }
            yPos += 3;
          });
        }
        
        if (sacred.tribal_identities?.length > 0) {
          renderSubsection('Tribal Identities');
          (sacred.tribal_identities as any[]).slice(0, 3).forEach((tribe: any) => {
            renderBullet(`${tribe.tribe}: ${(tribe.strength * 100 || 50).toFixed(0)}% strength`, 5);
          });
        }
        
        if (sacred.manipulation_vectors?.length > 0) {
          renderSubsection('Manipulation Vectors');
          (sacred.manipulation_vectors as any[]).slice(0, 4).forEach((vec: any) => {
            checkPageBreak(12);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`[${vec.approach?.toUpperCase() || 'UNKNOWN'}] ${vec.vector}`, margin, yPos);
            yPos += 5;
            if (vec.expected_response) {
              doc.setFont('helvetica', 'normal');
              doc.text(`→ ${vec.expected_response}`, margin + 10, yPos);
              yPos += 5;
            }
          });
        }
        
        yPos += 8;
      }

      // ========================================
      // REALITY TESTING VULNERABILITY
      // ========================================
      if (sections.find(s => s.id === 'realityTesting')?.enabled) {
        const crossModal = crossModalData.data?.find((c: any) => c.correlation_type === 'identity_destabilization' || c.correlation_type === 'reality_testing');
        
        if (crossModal) {
          renderSectionHeader('Reality Testing Vulnerability', [80, 0, 80]);
          
          const patternData = (crossModal as any).pattern_data;
          
          if ((crossModal as any).correlation_strength !== undefined) {
            renderScoreBar('Reality Testing Weakness', (crossModal as any).correlation_strength * 100, 100, [180, 0, 0]);
          }
          
          if (patternData?.vulnerability_domains?.length > 0) {
            renderSubsection('Vulnerable Domains');
            patternData.vulnerability_domains.slice(0, 4).forEach((d: string) => renderBullet(d, 5));
          }
          
          renderSubsection('Applicable Techniques');
          const techniques = [
            { name: 'Contradiction Injection', desc: 'Introduce conflicting information' },
            { name: 'Source Confusion', desc: 'Blur origin of information' },
            { name: 'Memory Manipulation', desc: 'Suggest alternative memories' },
            { name: 'Perception Distortion', desc: 'Reframe observations' },
          ];
          
          techniques.forEach(tech => {
            checkPageBreak(10);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${tech.name}:`, margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(tech.desc, margin + 45, yPos);
            yPos += 5;
          });
          
          yPos += 8;
        }
      }

      // ========================================
      // CHOICE ARCHITECTURE EXPLOITATION
      // ========================================
      if (sections.find(s => s.id === 'choiceArchitecture')?.enabled) {
        renderSectionHeader('Choice Architecture Exploitation', [0, 80, 120]);
        
        const finPsych = financialPsychology.data?.[0] as any;
        
        renderSubsection('Effective Nudges');
        const nudges = [
          { name: 'Default Effect', effectiveness: 85, desc: 'Pre-select desired option' },
          { name: 'Decoy Effect', effectiveness: 75, desc: 'Add inferior option to make target look better' },
          { name: 'Middle-Option Bias', effectiveness: 70, desc: 'Position target in center' },
          { name: 'Scarcity Cues', effectiveness: finPsych?.scarcity_response ? finPsych.scarcity_response * 100 : 80, desc: 'Highlight limited availability' },
          { name: 'Social Proof', effectiveness: 75, desc: 'Show others choosing target' },
          { name: 'Loss Framing', effectiveness: finPsych?.loss_aversion_score ? finPsych.loss_aversion_score * 100 : 82, desc: 'Frame as avoiding loss' },
        ];
        
        nudges.forEach(nudge => {
          renderScoreBar(nudge.name, nudge.effectiveness, 100, [0, 80, 120]);
        });
        
        if (finPsych) {
          yPos += 3;
          renderSubsection('Behavioral Economics Profile');
          if (finPsych.loss_aversion_score) renderScoreBar('Loss Aversion', finPsych.loss_aversion_score * 100, 100, [180, 0, 0]);
          if (finPsych.sunk_cost_fallacy_susceptibility) renderScoreBar('Sunk Cost Fallacy', finPsych.sunk_cost_fallacy_susceptibility * 100, 100, [180, 100, 0]);
          if (finPsych.anchoring_susceptibility) renderScoreBar('Anchoring Susceptibility', finPsych.anchoring_susceptibility * 100, 100, [100, 100, 0]);
        }
        
        yPos += 8;
      }

      // ========================================
      // BETRAYAL & CRISIS PREDICTION
      // ========================================
      if (sections.find(s => s.id === 'betrayal')?.enabled && betrayalData.data?.length > 0) {
        renderSectionHeader('Betrayal & Crisis Prediction', [150, 0, 0]);
        
        const betrayal = betrayalData.data[0] as any;
        
        if (betrayal.betrayal_likelihood !== undefined) {
          renderScoreBar('Betrayal Likelihood', betrayal.betrayal_likelihood * 100, 100, [180, 0, 0]);
        }
        
        // Gottman Four Horsemen
        if (betrayal.gottman_analysis) {
          renderSubsection('Gottman Four Horsemen Analysis');
          const horsemen = betrayal.gottman_analysis;
          
          const horsemanScores = [
            { name: 'Criticism', score: horsemen.criticism_score || 0 },
            { name: 'Contempt', score: horsemen.contempt_score || 0 },
            { name: 'Defensiveness', score: horsemen.defensiveness_score || 0 },
            { name: 'Stonewalling', score: horsemen.stonewalling_score || 0 },
          ];
          
          horsemanScores.forEach(h => {
            const color: [number, number, number] = h.score > 70 ? [180, 0, 0] : h.score > 40 ? [180, 100, 0] : [0, 100, 0];
            renderScoreBar(h.name, h.score, 100, color);
          });
        }
        
        if (betrayal.warning_signs?.length > 0) {
          renderSubsection('⚠ Warning Signs Detected');
          doc.setTextColor(180, 0, 0);
          betrayal.warning_signs.slice(0, 5).forEach((w: string) => renderBullet(w, 5, '⚠'));
          doc.setTextColor(0);
        }
        
        if (betrayal.protective_factors?.length > 0) {
          renderSubsection('✓ Protective Factors');
          doc.setTextColor(0, 100, 0);
          betrayal.protective_factors.slice(0, 4).forEach((p: string) => renderBullet(p, 5, '✓'));
          doc.setTextColor(0);
        }
        
        yPos += 8;
      }

      // ========================================
      // PRECOGNITIVE PATTERN ANALYSIS
      // ========================================
      if (sections.find(s => s.id === 'precognitive')?.enabled) {
        if (timelineProbabilities.data?.length > 0 || precursorSignatures.data?.length > 0) {
          renderSectionHeader('Precognitive Pattern Analysis', [0, 80, 100]);
          
          if (timelineProbabilities.data?.length > 0) {
            renderSubsection('Timeline Probabilities');
            (timelineProbabilities.data as any[]).slice(0, 5).forEach((prob: any) => {
              checkPageBreak(15);
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              doc.text(`${prob.event_type}`, margin, yPos);
              yPos += 5;
              renderScoreBar('Probability', (prob.probability_score || 0.5) * 100, 100, [0, 100, 150]);
              if (prob.timeframe) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(`Timeframe: ${prob.timeframe}`, margin + 5, yPos);
                yPos += 5;
              }
            });
          }
          
          if (precursorSignatures.data?.length > 0) {
            renderSubsection('Precursor Signatures to Monitor');
            (precursorSignatures.data as any[]).slice(0, 5).forEach((sig: any) => {
              checkPageBreak(12);
              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.text(`[${sig.signature_type || 'Signal'}]`, margin, yPos);
              doc.setFont('helvetica', 'normal');
              doc.text(sig.pattern_description || 'Pattern detected', margin + 35, yPos);
              yPos += 5;
              if (sig.confidence_score) {
                doc.text(`Confidence: ${(sig.confidence_score * 100).toFixed(0)}%`, margin + 10, yPos);
                yPos += 5;
              }
            });
          }
          
          yPos += 8;
        }
      }

      // ========================================
      // BEHAVIORAL FUTURE MODELING
      // ========================================
      if (sections.find(s => s.id === 'futureModeling')?.enabled && scenarioPredictions?.data?.length > 0) {
        renderSectionHeader('Behavioral Future Modeling', [0, 80, 120]);
        
        (scenarioPredictions.data as any[]).slice(0, 4).forEach((pred: any) => {
          checkPageBreak(40);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 80, 120);
          doc.text(`Scenario: ${pred.scenario_type || 'Unknown'}`, margin, yPos);
          doc.setTextColor(0);
          yPos += lineHeight + 2;

          if (pred.predicted_response) {
            renderKeyValue('Predicted Response', pred.predicted_response);
          }
          if (pred.confidence_score) {
            renderScoreBar('Confidence', pred.confidence_score * 100, 100, [0, 100, 150]);
          }
          if (pred.influence_opportunities?.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(0, 100, 0);
            pred.influence_opportunities.slice(0, 2).forEach((o: string) => renderBullet(o, 10, '→'));
            doc.setTextColor(0);
          }
          yPos += 5;
        });
        
        yPos += 8;
      }

      // ========================================
      // CROSS-MODAL DECEPTION ANALYSIS
      // ========================================
      if (sections.find(s => s.id === 'crossModal')?.enabled && crossModalData?.data?.length > 0) {
        renderSectionHeader('Cross-Modal Deception Analysis', [100, 50, 0]);
        
        const crossModal = crossModalData.data.find((c: any) => c.correlation_type === 'deception_synthesis' || c.correlation_type === 'cross_modal') || crossModalData.data[0];
        
        if (crossModal) {
          const patternData = (crossModal as any).pattern_data;
          
          if ((crossModal as any).correlation_strength !== undefined) {
            renderScoreBar('Deception Risk', (crossModal as any).correlation_strength * 100, 100, [180, 50, 0]);
          }

          if (patternData?.contradictions?.length > 0) {
            renderSubsection('⚠ Detected Contradictions');
            doc.setTextColor(180, 50, 0);
            patternData.contradictions.slice(0, 4).forEach((c: any) => {
              const text = typeof c === 'string' ? c : `${c.modality_a} vs ${c.modality_b}: ${c.description || c.explanation}`;
              renderBullet(text, 5);
            });
            doc.setTextColor(0);
          }

          if (patternData?.corroborated_findings?.length > 0) {
            renderSubsection('✓ Corroborated Findings');
            doc.setTextColor(0, 100, 0);
            patternData.corroborated_findings.slice(0, 4).forEach((f: string) => renderBullet(f, 5, '✓'));
            doc.setTextColor(0);
          }
        }
        
        yPos += 8;
      }

      // ========================================
      // TRAUMA & VULNERABILITY WINDOWS
      // ========================================
      if (sections.find(s => s.id === 'trauma')?.enabled && traumaData.data?.length > 0) {
        renderSectionHeader('Trauma & Vulnerability Windows', [150, 50, 50]);
        
        const trauma = traumaData.data[0] as any;
        
        if (trauma.vulnerability_score !== undefined) {
          renderScoreBar('Vulnerability Score', trauma.vulnerability_score * 100, 100, [180, 0, 0]);
        }
        
        if (trauma.detected_patterns?.length > 0) {
          renderSubsection('Detected Trauma Patterns');
          (trauma.detected_patterns as any[]).slice(0, 4).forEach((pattern: any) => {
            checkPageBreak(18);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(150, 50, 50);
            doc.text(`${pattern.pattern_type || pattern.type || 'Trauma Pattern'}`, margin, yPos);
            doc.setTextColor(0);
            yPos += 5;
            
            if (pattern.trigger) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'normal');
              doc.text(`Trigger: ${pattern.trigger}`, margin + 5, yPos);
              yPos += 5;
            }
            if (pattern.exploitation_script) {
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(100, 100, 100);
              const lines = doc.splitTextToSize(`Script: "${pattern.exploitation_script}"`, contentWidth - 15);
              doc.text(lines.slice(0, 2), margin + 5, yPos);
              doc.setTextColor(0);
              yPos += lines.slice(0, 2).length * 5;
            }
            yPos += 3;
          });
        }
        
        if (trauma.optimal_timing_windows?.length > 0) {
          renderSubsection('Optimal Timing Windows');
          (trauma.optimal_timing_windows as any[]).slice(0, 3).forEach((window: any) => {
            renderBullet(`${window.window || window}: ${window.description || 'Vulnerability window'}`, 5);
          });
        }
        
        yPos += 8;
      }

      // ========================================
      // TRUST ASSESSMENT
      // ========================================
      if (sections.find(s => s.id === 'trust')?.enabled && trustData.data?.length > 0) {
        renderSectionHeader('Trust Assessment', [0, 100, 100]);
        
        const trust = trustData.data[0] as any;
        
        if (trust.overall_trust_score !== undefined) {
          checkPageBreak(25);
          doc.setFillColor(240, 250, 250);
          doc.roundedRect(margin, yPos - 3, 80, 20, 3, 3, 'F');
          doc.setFontSize(24);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 100, 100);
          doc.text(`${trust.overall_trust_score}%`, margin + 10, yPos + 11);
          doc.setFontSize(10);
          doc.text('TRUST', margin + 50, yPos + 11);
          doc.setTextColor(0);
          yPos += 25;
        }
        
        if (trust.trust_factors) {
          const factors = trust.trust_factors as any;
          Object.entries(factors).slice(0, 5).forEach(([key, value]) => {
            renderScoreBar(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), Number(value) || 0, 100, [0, 100, 100]);
          });
        }
        
        if (trust.trust_trajectory) {
          renderKeyValue('Trajectory', trust.trust_trajectory);
        }
        
        yPos += 8;
      }

      // ========================================
      // INFLUENCE RESISTANCE PROFILE
      // ========================================
      if (sections.find(s => s.id === 'influenceResistance')?.enabled) {
        renderSectionHeader('Influence Resistance Profile', [100, 50, 0]);
        
        const influence = influenceData.data as any;
        const dna = behavioralDnaAnalysis?.result as any;
        
        if (influence || dna?.manipulation_vulnerability) {
          renderSubsection('Resistance by Principle');
          
          CIALDINI_PRINCIPLES.forEach(p => {
            const susceptibility = influence?.[`${p.key}_susceptibility`] || influence?.[p.key] || 50;
            const resistance = 100 - susceptibility;
            renderScoreBar(p.label, resistance, 100, resistance > 60 ? [0, 100, 0] : [200, 100, 0]);
          });
          
          if (dna?.manipulation_vulnerability?.resistant_to?.length > 0) {
            yPos += 3;
            renderSubsection('Strong Against');
            doc.setTextColor(0, 100, 0);
            dna.manipulation_vulnerability.resistant_to.slice(0, 4).forEach((r: string) => renderBullet(r, 5, '✓'));
            doc.setTextColor(0);
          }
        }
        
        yPos += 8;
      }

      // ========================================
      // BEHAVIORAL ECONOMICS PROFILE
      // ========================================
      if (sections.find(s => s.id === 'behavioralEconomics')?.enabled) {
        const finPsych = financialPsychology.data?.[0] as any;
        const dna = behavioralDnaAnalysis?.result as any;
        
        if (finPsych || dna?.decision_architecture) {
          renderSectionHeader('Behavioral Economics Profile', [0, 80, 80]);
          
          if (finPsych) {
            if (finPsych.loss_aversion_score) renderScoreBar('Loss Aversion', finPsych.loss_aversion_score * 100, 100, [180, 0, 0]);
            if (finPsych.endowment_effect_susceptibility) renderScoreBar('Endowment Effect', finPsych.endowment_effect_susceptibility * 100, 100, [180, 100, 0]);
            if (finPsych.sunk_cost_fallacy_susceptibility) renderScoreBar('Sunk Cost Fallacy', finPsych.sunk_cost_fallacy_susceptibility * 100, 100, [180, 100, 0]);
            if (finPsych.hyperbolic_discounting_rate) renderScoreBar('Hyperbolic Discounting', finPsych.hyperbolic_discounting_rate * 100, 100, [100, 100, 0]);
            if (finPsych.anchoring_susceptibility) renderScoreBar('Anchoring', finPsych.anchoring_susceptibility * 100, 100, [0, 100, 100]);
          }
          
          if (dna?.decision_architecture) {
            yPos += 3;
            renderSubsection('Decision Making Profile');
            renderKeyValue('Primary Archetype', dna.decision_architecture.primary_archetype);
            renderKeyValue('Decision Speed', dna.decision_architecture.decision_speed);
            renderKeyValue('Information Needs', dna.decision_architecture.information_needs);
          }
          
          yPos += 8;
        }
      }

      // ========================================
      // NETWORK POSITION
      // ========================================
      if (sections.find(s => s.id === 'network')?.enabled && relationshipsData.data?.length > 0) {
        renderSectionHeader('Network Position Analysis', [80, 80, 120]);
        
        renderSubsection(`${relationshipsData.data.length} Known Connections`);
        
        (relationshipsData.data as any[]).slice(0, 12).forEach((rel: any) => {
          checkPageBreak(12);
          const name = rel.to_profile 
            ? `${rel.to_profile.first_name} ${rel.to_profile.last_name || ''}`.trim()
            : 'Unknown';
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(name, margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(`| ${rel.relationship_type || 'Connected'} | Strength: ${rel.strength || 'Unknown'}`, margin + 55, yPos);
          yPos += lineHeight;
        });
        
        yPos += 8;
      }

      // ========================================
      // COUNTER-INTELLIGENCE ASSESSMENT
      // ========================================
      if (sections.find(s => s.id === 'counterIntel')?.enabled) {
        renderSectionHeader('Counter-Intelligence Assessment', [80, 0, 0]);
        
        const psych = psychData.data?.[0] as any;
        const suspicionLevel = psych?.suspicion_baseline || 30;
        
        renderSubsection('Detection Risk Assessment');
        renderScoreBar('Suspicion Baseline', suspicionLevel, 100, suspicionLevel > 50 ? [180, 0, 0] : [0, 100, 0]);
        
        renderSubsection('OPSEC Recommendations');
        const recommendations = [
          suspicionLevel > 50 ? 'Use indirect elicitation only' : 'Direct and indirect approaches viable',
          suspicionLevel > 70 ? 'Avoid pattern repetition' : 'Standard operational tempo acceptable',
          'Vary communication channels',
          'Limit information revelation pace',
        ];
        recommendations.forEach(r => renderBullet(r, 5));
        
        yPos += 8;
      }

      // ========================================
      // TIMELINE
      // ========================================
      if (sections.find(s => s.id === 'timeline')?.enabled && commData.data?.length > 0) {
        renderSectionHeader('Interaction Timeline', [80, 80, 80]);
        
        (commData.data as any[]).slice(0, 15).forEach((comm: any) => {
          checkPageBreak(20);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const date = format(new Date(comm.occurred_at), 'MMM d, yyyy HH:mm');
          doc.text(`${date} | ${comm.channel?.toUpperCase() || 'UNKNOWN'}`, margin, yPos);
          
          if (comm.sentiment_score !== undefined) {
            const sentColor: [number, number, number] = comm.sentiment_score > 0 ? [0, 150, 0] : comm.sentiment_score < 0 ? [180, 0, 0] : [100, 100, 100];
            doc.setTextColor(...sentColor);
            doc.text(`[${comm.sentiment_score > 0 ? '+' : ''}${comm.sentiment_score}]`, margin + 100, yPos);
            doc.setTextColor(0);
          }
          yPos += lineHeight;
          
          if (comm.subject || comm.content) {
            doc.setFont('helvetica', 'normal');
            const text = comm.subject || comm.content?.substring(0, 120);
            const lines = doc.splitTextToSize(text, contentWidth - 10);
            doc.text(lines.slice(0, 2), margin + 5, yPos);
            yPos += Math.min(lines.length, 2) * lineHeight;
          }
          
          yPos += 3;
        });
        
        yPos += 8;
      }

      // ========================================
      // FOOTER ON ALL PAGES
      // ========================================
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
        
        doc.setFontSize(7);
        doc.setTextColor(128);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
        doc.text('TOP SECRET // NOFORN - PICS AGIS v3.0', margin, pageHeight - 8);
        doc.text(`${format(new Date(), 'yyyy-MM-dd HH:mm')} | ${contactName}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      }

      // Save
      const fileName = `intelligence-dossier-${contactName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
      doc.save(fileName);

      toast.success(`Intelligence dossier generated: ${pageCount} pages, ${sections.filter(s => s.enabled).length} sections`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate dossier');
    } finally {
      setIsGenerating(false);
    }
  };

  const sectionsByCategory = {
    core: sections.filter(s => s.category === 'core'),
    intelligence: sections.filter(s => s.category === 'intelligence'),
    warfare: sections.filter(s => s.category === 'warfare'),
    analysis: sections.filter(s => s.category === 'analysis'),
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ultimate Intelligence Dossier Generator
            </CardTitle>
            <CardDescription>
              Generate comprehensive 47-section dossiers with behavioral DNA, quantum cognition, sacred values, and advanced warfare assessments
            </CardDescription>
          </div>
          {dataStats && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                📷 {dataStats.media} Media
              </Badge>
              <Badge variant="outline" className="text-xs">
                🎙️ {dataStats.voice} Voice
              </Badge>
              <Badge variant="outline" className="text-xs">
                🧠 {dataStats.analyses} Analyses
              </Badge>
              <Badge variant="secondary" className="text-xs">
                📊 {dataStats.sources} Total Sources
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!profileId && (
          <div className="space-y-2">
            <Label>Select Contact</Label>
            <ScalableContactSearch
              selectedId={selectedProfile}
              onSelect={handleContactSelect}
              placeholder="Search and select a contact..."
              showAddressBook={false}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Dossier Template</Label>
            <Select value={template} onValueChange={(v: DossierTemplate) => applyTemplate(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="executive">Executive Brief (1-2 pages)</SelectItem>
                <SelectItem value="operational">Operational Dossier (5-10 pages)</SelectItem>
                <SelectItem value="full">Full Intelligence Package (Complete - All 47 Sections)</SelectItem>
                <SelectItem value="surveillance">Surveillance Report (Media Focus)</SelectItem>
                <SelectItem value="warfare">Warfare Assessment (MICE, Cialdini, Sacred Values)</SelectItem>
                <SelectItem value="psychological">Psychological Deep Dive (DNA, Quantum, Behavioral)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Pre-Generation</Label>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={generateFullIntelligence}
              disabled={isGeneratingIntel || (!profileId && !selectedProfile)}
            >
              {isGeneratingIntel ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Intelligence...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Full Intelligence Package
                </>
              )}
            </Button>
            {isGeneratingIntel && (
              <Progress value={intelProgress} className="h-1" />
            )}
            
            {/* Task Results Display */}
            {taskResults.length > 0 && (
              <div className="mt-3 space-y-1.5 p-3 bg-muted/30 rounded-lg border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Intelligence Tasks</p>
                {taskResults.map((task) => (
                  <div key={task.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {task.status === 'pending' && (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                      )}
                      {task.status === 'running' && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      )}
                      {task.status === 'success' && (
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      )}
                      {task.status === 'failed' && (
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                      )}
                      <span className={task.status === 'failed' ? 'text-destructive' : ''}>{task.name}</span>
                    </div>
                    {task.status === 'failed' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 px-2 text-xs"
                        onClick={() => retryTask(task.name)}
                        disabled={isGeneratingIntel}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                ))}
                {taskResults.some(t => t.status === 'failed') && (
                  <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
                    Failed tasks may still allow PDF generation with partial data
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Include Sections ({sections.filter(s => s.enabled).length}/{sections.length})</Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSections(sections.map(s => ({ ...s, enabled: true })))}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSections(sections.map(s => ({ ...s, enabled: false })))}>
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">CORE ({sectionsByCategory.core.filter(s => s.enabled).length})</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {sectionsByCategory.core.map(section => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={section.enabled}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      <Label htmlFor={section.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {section.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-medium text-blue-600 mb-2">INTELLIGENCE ({sectionsByCategory.intelligence.filter(s => s.enabled).length})</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {sectionsByCategory.intelligence.map(section => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={section.enabled}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      <Label htmlFor={section.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <Icon className="h-3.5 w-3.5 text-blue-500" />
                        {section.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-medium text-red-600 mb-2">WARFARE ({sectionsByCategory.warfare.filter(s => s.enabled).length})</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {sectionsByCategory.warfare.map(section => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={section.enabled}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      <Label htmlFor={section.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <Icon className="h-3.5 w-3.5 text-red-500" />
                        {section.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">ANALYSIS ({sectionsByCategory.analysis.filter(s => s.enabled).length})</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {sectionsByCategory.analysis.map(section => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={section.enabled}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      <Label htmlFor={section.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {section.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={generatePDF}
          disabled={isGenerating || (!profileId && !selectedProfile)}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating {sections.filter(s => s.enabled).length}-Section Dossier...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Ultimate Intelligence Dossier
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
