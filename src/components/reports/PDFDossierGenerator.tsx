import { useState, useCallback } from 'react';
import { FileText, Download, Loader2, User, Calendar, TrendingUp, Shield, Network, Brain, Image, Target, Clipboard, Heart, AlertTriangle, Mic, Zap, Eye, Crosshair, Sparkles, BookOpen, Gauge } from 'lucide-react';
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

type DossierTemplate = 'executive' | 'operational' | 'full' | 'surveillance';

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

export function PDFDossierGenerator({ profileId, profileName }: PDFDossierGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingIntel, setIsGeneratingIntel] = useState(false);
  const [intelProgress, setIntelProgress] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(profileId || null);
  const [selectedContactName, setSelectedContactName] = useState<string>(profileName || '');
  const [template, setTemplate] = useState<DossierTemplate>('full');
  const [dataStats, setDataStats] = useState<{media: number; voice: number; analyses: number} | null>(null);
  
  const [sections, setSections] = useState<DossierSection[]>([
    // Core sections
    { id: 'executive', label: 'Executive Brief', icon: Zap, enabled: true, category: 'core' },
    { id: 'overview', label: 'Contact Overview', icon: User, enabled: true, category: 'core' },
    { id: 'timeline', label: 'Interaction Timeline', icon: Calendar, enabled: true, category: 'core' },
    
    // Intelligence sections
    { id: 'psychological', label: 'Deep Psychological Profile', icon: Brain, enabled: true, category: 'intelligence' },
    { id: 'relationship', label: 'Relationship Intelligence', icon: Heart, enabled: true, category: 'intelligence' },
    { id: 'playbook', label: 'Engagement Playbook', icon: Target, enabled: true, category: 'intelligence' },
    { id: 'mediaIntel', label: 'Media Intelligence Synthesis', icon: Image, enabled: true, category: 'intelligence' },
    { id: 'voiceIntel', label: 'Voice Intelligence', icon: Mic, enabled: true, category: 'intelligence' },
    { id: 'actionPlans', label: 'Strategic Action Plans', icon: Clipboard, enabled: true, category: 'intelligence' },
    
    // Warfare sections
    { id: 'mice', label: 'MICE Vulnerability Matrix', icon: Crosshair, enabled: true, category: 'warfare' },
    { id: 'cialdini', label: 'RASCLS Influence Profile', icon: BookOpen, enabled: true, category: 'warfare' },
    { id: 'influence', label: 'Influence Vectors', icon: Eye, enabled: true, category: 'warfare' },
    { id: 'trauma', label: 'Trauma & Vulnerability Windows', icon: AlertTriangle, enabled: true, category: 'warfare' },
    { id: 'futureModeling', label: 'Behavioral Future Modeling', icon: TrendingUp, enabled: true, category: 'warfare' },
    { id: 'crossModal', label: 'Cross-Modal Deception Analysis', icon: Eye, enabled: true, category: 'warfare' },
    { id: 'threatActor', label: 'Threat Assessment', icon: AlertTriangle, enabled: true, category: 'warfare' },
    { id: 'betrayal', label: 'Betrayal & Crisis Prediction', icon: Gauge, enabled: true, category: 'warfare' },
    
    // Analysis sections
    { id: 'analysis', label: 'Behavioral Analysis', icon: TrendingUp, enabled: false, category: 'analysis' },
    { id: 'trust', label: 'Trust Assessment', icon: Shield, enabled: false, category: 'analysis' },
    { id: 'network', label: 'Network Position', icon: Network, enabled: false, category: 'analysis' },
  ]);

  const handleContactSelect = useCallback(async (id: string | null, contact?: { first_name: string; last_name: string | null }) => {
    setSelectedProfile(id);
    if (contact) {
      setSelectedContactName(`${contact.first_name} ${contact.last_name || ''}`.trim());
    } else {
      setSelectedContactName('');
    }
    
    // Fetch data stats for selected contact
    if (id) {
      const [mediaCount, voiceCount, analysesCount] = await Promise.all([
        supabase.from('media').select('id', { count: 'exact', head: true }).eq('profile_id', id).not('ai_metadata', 'is', null),
        supabase.from('voice_recording_sessions').select('id', { count: 'exact', head: true }).eq('profile_id', id),
        supabase.from('ai_analyses').select('id', { count: 'exact', head: true }).eq('profile_id', id),
      ]);
      setDataStats({
        media: mediaCount.count || 0,
        voice: voiceCount.count || 0,
        analyses: analysesCount.count || 0,
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
      executive: ['executive', 'overview', 'psychological', 'actionPlans'],
      operational: ['executive', 'overview', 'psychological', 'playbook', 'actionPlans', 'mice', 'cialdini', 'influence', 'trauma'],
      full: ['executive', 'overview', 'timeline', 'psychological', 'relationship', 'playbook', 'mediaIntel', 'voiceIntel', 'actionPlans', 'mice', 'cialdini', 'influence', 'trauma', 'futureModeling', 'crossModal', 'threatActor', 'betrayal'],
      surveillance: ['overview', 'mediaIntel', 'voiceIntel', 'timeline', 'network', 'threatActor', 'crossModal'],
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

    try {
      // Check what's missing
      const [miceExists, influenceExists, deepIntelExists] = await Promise.all([
        supabase.from('mice_assessments').select('id').eq('profile_id', targetProfileId).maybeSingle(),
        supabase.from('contact_influence_profiles').select('id').eq('profile_id', targetProfileId).maybeSingle(),
        supabase.from('ai_analyses').select('id').eq('profile_id', targetProfileId).eq('analysis_type', 'deep_intelligence').maybeSingle(),
      ]);

      const tasks: { name: string; fn: () => Promise<any> }[] = [];
      
      if (!miceExists.data) {
        tasks.push({
          name: 'MICE Vulnerability Analysis',
          fn: () => supabase.functions.invoke('mice-recruitment-analyzer', { body: { profileId: targetProfileId, analysisDepth: 'comprehensive' } }),
        });
      }
      
      if (!influenceExists.data) {
        tasks.push({
          name: 'Cialdini Influence Profile',
          fn: () => supabase.functions.invoke('analyze-influence-profile', { body: { profileId: targetProfileId } }),
        });
      }
      
      if (!deepIntelExists.data) {
        tasks.push({
          name: 'Deep Intelligence Engine',
          fn: () => supabase.functions.invoke('deep-intelligence-engine', { body: { profileId: targetProfileId } }),
        });
      }

      // Always run cross-modal synthesis for latest correlation
      tasks.push({
        name: 'Cross-Modal Synthesis',
        fn: () => supabase.functions.invoke('cross-modal-synthesis-v2', { body: { profileId: targetProfileId } }),
      });

      if (tasks.length === 0) {
        toast.info('All warfare intelligence already generated');
        setIsGeneratingIntel(false);
        return;
      }

      // Execute tasks sequentially with progress
      for (let i = 0; i < tasks.length; i++) {
        toast.info(`Running: ${tasks[i].name}...`);
        setIntelProgress(((i) / tasks.length) * 100);
        
        try {
          await tasks[i].fn();
        } catch (e) {
          console.warn(`${tasks[i].name} failed:`, e);
        }
        
        setIntelProgress(((i + 1) / tasks.length) * 100);
      }

      toast.success('Full intelligence package generated!');
    } catch (error) {
      console.error('Intel generation error:', error);
      toast.error('Some intelligence generation failed');
    } finally {
      setIsGeneratingIntel(false);
      setIntelProgress(0);
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

      // COMPREHENSIVE DATA FUSION - Fetch from ALL 18+ intelligence sources
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
        relationshipsData,
        betrayalData,
        traumaData,
        scenarioPredictions,
        crossModalData,
      ] = await Promise.all([
        // Communications timeline
        supabase.from('communications').select('*').eq('profile_id', targetProfileId).order('occurred_at', { ascending: false }).limit(30),
        
        // Psychological profiles - THE GOLD
        supabase.from('psychological_profiles').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        
        // ALL AI analyses (personality, playbook, relationship_score, sentiment, deep_intelligence, media_intelligence_aggregation)
        supabase.from('ai_analyses').select('*').eq('profile_id', targetProfileId).order('generated_at', { ascending: false }),
        
        // Media analyses with rich intelligence
        supabase.from('media_analyses').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }),
        
        // Media items with AI metadata - FIXED: using mime_type instead of media_type
        supabase.from('media').select('id, caption, ai_metadata, completed_analysis_modes, created_at, mime_type').eq('profile_id', targetProfileId).not('ai_metadata', 'is', null),
        
        // Voice recording sessions
        supabase.from('voice_recording_sessions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }),
        
        // Behavioral analyses
        supabase.from('behavioral_analyses').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(5),
        
        // Trust assessments
        supabase.from('trust_assessments').select('*').eq('profile_id', targetProfileId).order('assessed_at', { ascending: false }).limit(1),
        
        // MICE assessments
        supabase.from('mice_assessments').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        
        // Influence profiles (RASCLS/Cialdini)
        supabase.from('contact_influence_profiles').select('*').eq('profile_id', targetProfileId).limit(1),
        
        // Threat actor profiles
        supabase.from('threat_actors').select('*').eq('profile_id', targetProfileId).limit(1),
        
        // Observations
        supabase.from('contact_observations').select('*').eq('profile_id', targetProfileId).order('observed_at', { ascending: false }).limit(20),
        
        // Behavioral predictions
        supabase.from('behavioral_predictions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(10),
        
        // Anomalies
        supabase.from('behavioral_anomalies').select('*').eq('profile_id', targetProfileId).eq('is_resolved', false),
        
        // Life milestones
        supabase.from('contact_life_milestones').select('*').eq('profile_id', targetProfileId).order('milestone_date', { ascending: false }).limit(10),
        
        // Relationships
        supabase.from('contact_relationships').select('*, to_profile:profiles!contact_relationships_to_profile_id_fkey(first_name, last_name)').eq('from_profile_id', targetProfileId),
        
        // Betrayal predictions
        supabase.from('betrayal_predictions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        
        // Trauma exploitation windows
        supabase.from('trauma_exploitation_windows').select('*').eq('profile_id', targetProfileId).limit(1),
        
        // Behavioral scenario predictions (future modeling)
        supabase.from('behavioral_scenario_predictions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(5),
        
        // Cross-domain correlations (cross-modal deception)
        supabase.from('cross_domain_correlations').select('*').eq('profile_id', targetProfileId).order('updated_at', { ascending: false }).limit(5),
      ]);

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
      // ENHANCED PAGE BREAK HELPER - Consistent formatting
      // ========================================
      const checkPageBreak = (neededSpace: number): boolean => {
        if (yPos + neededSpace > maxContentY) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Safe print helper that always checks page break first
      const safePrint = (printFn: () => number) => {
        const estimatedHeight = printFn();
        return estimatedHeight;
      };

      // ========================================
      // SECTION HEADER - Colored bar with consistent spacing
      // ========================================
      const renderSectionHeader = (title: string, color: [number, number, number] = [0, 0, 0]) => {
        checkPageBreak(25);
        
        // Section divider line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos - 3, margin + contentWidth, yPos - 3);
        yPos += 2;
        
        // Colored background bar
        doc.setFillColor(color[0], color[1], color[2], 0.1);
        doc.rect(margin - 2, yPos - 2, contentWidth + 4, 10, 'F');
        
        // Left color accent
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
        
        // Background
        doc.setFillColor(230, 230, 230);
        doc.rect(barX, yPos - 5, barWidth, barHeight, 'F');
        
        // Fill
        doc.setFillColor(...color);
        doc.rect(barX, yPos - 5, fillWidth, barHeight, 'F');
        
        // Score text
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

      // Extract key analyses
      const personalityAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'personality');
      const playbookAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'playbook');
      const relationshipAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'relationship_score');
      const deepIntelAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'deep_intelligence');
      const mediaAggregation = allAnalyses.data?.find((a: any) => a.analysis_type === 'media_intelligence_aggregation');
      const voiceAggregation = allAnalyses.data?.find((a: any) => a.analysis_type === 'voice_intelligence_aggregation');

      // Count intelligence sources
      const totalMediaAnalyzed = mediaData.data?.length || 0;
      const totalVoiceSessions = voiceData.data?.length || 0;
      const totalObservations = observationsData.data?.length || 0;
      const totalCommunications = commData.data?.length || 0;
      const totalAnomalies = anomaliesData.data?.length || 0;

      // ========================================
      // COVER PAGE
      // ========================================
      doc.setFillColor(20, 30, 50);
      doc.rect(0, 0, pageWidth, 80, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text('CLASSIFICATION: CONFIDENTIAL', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('INTELLIGENCE DOSSIER', pageWidth / 2, 45, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(150, 200, 255);
      doc.text(template.toUpperCase() + ' PACKAGE', pageWidth / 2, 60, { align: 'center' });
      
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
      doc.roundedRect(margin, 135, contentWidth, 55, 3, 3, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(margin, 135, contentWidth, 55, 3, 3, 'S');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('INTELLIGENCE SOURCES', margin + 5, 147);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const col1X = margin + 10;
      const col2X = margin + 80;
      
      doc.text(`📷 Media Items Analyzed: ${totalMediaAnalyzed}`, col1X, 158);
      doc.text(`🎙️ Voice Sessions: ${totalVoiceSessions}`, col1X, 168);
      doc.text(`👁️ Observations: ${totalObservations}`, col1X, 178);
      
      doc.text(`💬 Communications: ${totalCommunications}`, col2X, 158);
      doc.text(`🧠 AI Analyses: ${allAnalyses.data?.length || 0}`, col2X, 168);
      doc.text(`⚠️ Active Anomalies: ${totalAnomalies}`, col2X, 178);
      
      // Risk level badge
      const riskLevel = totalAnomalies > 2 ? 'HIGH RISK' : totalAnomalies > 0 ? 'MEDIUM RISK' : 'LOW RISK';
      const riskColor: [number, number, number] = totalAnomalies > 2 ? [180, 0, 0] : totalAnomalies > 0 ? [180, 100, 0] : [0, 120, 0];
      doc.setFillColor(...riskColor);
      doc.roundedRect(margin + 135, 145, 30, 8, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(riskLevel, margin + 138, 150);
      doc.setTextColor(0);
      
      // Generation info
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy at HH:mm')}`, pageWidth / 2, 210, { align: 'center' });
      doc.text('PICS Intelligence System v2.0', pageWidth / 2, 218, { align: 'center' });
      doc.setTextColor(0);
      
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
      // DEEP PSYCHOLOGICAL PROFILE
      // ========================================
      if (sections.find(s => s.id === 'psychological')?.enabled && psychData.data?.length > 0) {
        renderSectionHeader('Deep Psychological Profile', [102, 0, 102]);
        
        const psych = psychData.data[0] as any;
        
        // Attachment Architecture
        if (psych.attachment_style) {
          const style = psych.attachment_style as any;
          renderSubsection('Attachment Architecture');
          
          // Visual attachment display
          doc.setFillColor(245, 240, 250);
          checkPageBreak(35);
          doc.roundedRect(margin, yPos - 2, contentWidth, 30, 2, 2, 'F');
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(102, 0, 102);
          doc.text(style.primary_style?.toUpperCase() || 'UNKNOWN', margin + 5, yPos + 8);
          doc.setTextColor(0);
          
          // Anxiety/Avoidance scores as bars
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
        
        // Deception Analysis
        if (psych.deception_analysis) {
          const dec = psych.deception_analysis as any;
          renderSubsection('Deception Analysis');
          
          if (dec.baseline_established) {
            renderKeyValue('Baseline', 'Established ✓');
          }
          if (dec.detected_tells?.length > 0) {
            doc.setTextColor(180, 100, 0);
            dec.detected_tells.slice(0, 4).forEach((t: string) => renderBullet(t, 5, '⚠'));
            doc.setTextColor(0);
          }
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
      // RELATIONSHIP INTELLIGENCE
      // ========================================
      if (sections.find(s => s.id === 'relationship')?.enabled && relationshipAnalysis) {
        renderSectionHeader('Relationship Intelligence', [0, 102, 51]);
        
        const result = relationshipAnalysis.result as any;
        
        // Score display box
        checkPageBreak(30);
        doc.setFillColor(240, 250, 245);
        doc.roundedRect(margin, yPos - 3, 100, 25, 3, 3, 'F');
        
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 102, 51);
        doc.text(`${result.score || 0}`, margin + 10, yPos + 14);
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(`/ 100`, margin + 42, yPos + 14);
        doc.setFontSize(16);
        doc.setTextColor(0, 102, 51);
        doc.text(`Grade: ${result.grade || 'N/A'}`, margin + 60, yPos + 14);
        doc.setTextColor(0);
        yPos += 30;
        
        // Factors
        if (result.factors?.length > 0) {
          renderSubsection('Relationship Factors');
          result.factors.forEach((factor: any) => {
            renderScoreBar(factor.name, factor.score, 100, [0, 102, 51]);
          });
          yPos += 3;
        }
        
        // Strengths
        if (result.strengths?.length > 0) {
          renderSubsection('Relationship Strengths');
          doc.setTextColor(0, 100, 0);
          result.strengths.slice(0, 5).forEach((s: string) => renderBullet(s, 5, '✓'));
          doc.setTextColor(0);
          yPos += 3;
        }
        
        // Areas for Improvement
        if (result.areasForImprovement?.length > 0) {
          renderSubsection('Areas for Improvement');
          doc.setTextColor(180, 100, 0);
          result.areasForImprovement.slice(0, 5).forEach((a: string) => renderBullet(a, 5, '△'));
          doc.setTextColor(0);
        }
        
        yPos += 8;
      }

      // ========================================
      // ENGAGEMENT PLAYBOOK
      // ========================================
      if (sections.find(s => s.id === 'playbook')?.enabled && playbookAnalysis) {
        renderSectionHeader('Engagement Playbook', [102, 51, 0]);
        
        const result = playbookAnalysis.result as any;
        
        // Things to Remember
        if (result.thingsToRemember?.length > 0) {
          renderSubsection('🧠 Key Intelligence Points');
          result.thingsToRemember.slice(0, 10).forEach((item: string) => renderBullet(item, 5));
          yPos += 5;
        }
        
        // Conversation Starters
        if (result.conversationStarters?.length > 0) {
          renderSubsection('💬 Tactical Conversation Openers');
          result.conversationStarters.slice(0, 5).forEach((starter: string) => {
            checkPageBreak(12);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(60, 60, 60);
            const lines = doc.splitTextToSize(`"${starter}"`, contentWidth - 10);
            doc.text(lines, margin + 5, yPos);
            doc.setTextColor(0);
            yPos += lines.length * lineHeight + 2;
          });
          yPos += 3;
        }
        
        // Rapport Builders
        if (result.rapportBuilders?.length > 0) {
          renderSubsection('🤝 Rapport Building Tactics');
          result.rapportBuilders.slice(0, 5).forEach((rb: string) => renderBullet(rb, 5));
          yPos += 3;
        }
        
        // Power words
        if (result.powerWords?.length > 0) {
          renderSubsection('⚡ Power Words');
          doc.setFontSize(9);
          doc.setTextColor(0, 100, 0);
          const powerWordsText = result.powerWords.slice(0, 10).join(' • ');
          const lines = doc.splitTextToSize(powerWordsText, contentWidth);
          checkPageBreak(lines.length * lineHeight + 5);
          doc.text(lines, margin + 5, yPos);
          doc.setTextColor(0);
          yPos += lines.length * lineHeight + 3;
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
      // MEDIA INTELLIGENCE SYNTHESIS
      // ========================================
      if (sections.find(s => s.id === 'mediaIntel')?.enabled) {
        const hasMediaAnalyses = mediaAnalyses.data && mediaAnalyses.data.length > 0;
        const hasMediaMetadata = mediaData.data && mediaData.data.length > 0;
        
        if (hasMediaAnalyses || hasMediaMetadata) {
          renderSectionHeader('Media Intelligence Synthesis', [51, 51, 102]);
          
          // Summary stats box
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
          
          // Use aggregated media intelligence if available
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
            
            if (agg.wealth_lifestyle) {
              const wl = agg.wealth_lifestyle;
              if (wl.indicators?.length > 0) {
                renderSubsection('💰 Wealth & Lifestyle Indicators');
                wl.indicators.slice(0, 5).forEach((i: string) => renderBullet(i, 5));
                yPos += 3;
              }
              if (wl.profession_cues?.length > 0) {
                renderSubsection('💼 Profession Cues');
                wl.profession_cues.slice(0, 4).forEach((p: string) => renderBullet(p, 5));
                yPos += 3;
              }
            }
            
            if (agg.interests?.length > 0) {
              renderSubsection('🎯 Detected Interests');
              const interestsText = agg.interests.slice(0, 12).join(' • ');
              const lines = doc.splitTextToSize(interestsText, contentWidth - 10);
              checkPageBreak(lines.length * lineHeight + 5);
              doc.setFontSize(9);
              doc.text(lines, margin + 5, yPos);
              yPos += lines.length * lineHeight + 3;
            }
            
            if (agg.red_flags?.length > 0) {
              renderSubsection('🚨 Red Flags from Media');
              doc.setTextColor(180, 0, 0);
              agg.red_flags.slice(0, 5).forEach((rf: string) => renderBullet(rf, 5, '⚠'));
              doc.setTextColor(0);
            }
          } else if (hasMediaAnalyses) {
            // Fallback to individual media analyses
            const allInsights: string[] = [];
            const allRedFlags: string[] = [];
            
            mediaAnalyses.data.forEach((ma: any) => {
              if (ma.key_insights) allInsights.push(...ma.key_insights);
              if (ma.red_flags) allRedFlags.push(...ma.red_flags);
            });
            
            if (allInsights.length > 0) {
              renderSubsection('Aggregated Insights');
              [...new Set(allInsights)].filter(i => !i.includes('extraction failed')).slice(0, 10)
                .forEach((insight: string) => renderBullet(insight, 5));
              yPos += 3;
            }
            
            if (allRedFlags.length > 0) {
              renderSubsection('Red Flags');
              doc.setTextColor(180, 0, 0);
              [...new Set(allRedFlags)].slice(0, 5).forEach((flag: string) => renderBullet(flag, 5, '⚠'));
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
        
        // Summary stats box
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
            yPos += 3;
          }
          
          if (voice.key_themes?.length > 0) {
            renderSubsection('📝 Key Conversation Themes');
            voice.key_themes.slice(0, 5).forEach((t: string) => renderBullet(t, 5));
          }
        } else if (voiceData.data?.length > 0) {
          renderSubsection('Recent Voice Sessions');
          voiceData.data.slice(0, 5).forEach((v: any) => {
            checkPageBreak(20);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`${format(new Date(v.created_at), 'MMM d, yyyy')} - ${v.recording_type || 'Voice'}`, margin, yPos);
            yPos += lineHeight;
            if (v.transcript_summary) {
              doc.setFont('helvetica', 'normal');
              const lines = doc.splitTextToSize(v.transcript_summary.substring(0, 200), contentWidth - 10);
              doc.text(lines, margin + 5, yPos);
              yPos += lines.length * lineHeight;
            }
            yPos += 3;
          });
        }
        
        yPos += 8;
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
              
              // Action title with priority badge
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
          
          // Do Not Do list - Critical section
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
        
        // MICE scores visual display
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
          
          // Label
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...m.color);
          doc.text(m.label, x, yPos + 5);
          
          // Score circle
          doc.setFillColor(...m.color);
          doc.circle(x + 15, yPos + 18, 10, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${m.score}`, x + 15, yPos + 21, { align: 'center' });
          
          doc.setTextColor(0);
        });
        yPos += 45;
        
        // Primary vulnerability and likelihood
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
        
        // Render 7 principles as score bars
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
          
          // Score bar
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
        
        // Optimal approach
        if (influence.optimal_approach || influence.primary_motivators) {
          renderSubsection('Optimal Influence Strategy');
          if (influence.optimal_approach) {
            renderBullet(influence.optimal_approach, 5);
          }
          if (influence.primary_motivators?.length > 0) {
            influence.primary_motivators.slice(0, 4).forEach((m: string) => renderBullet(m, 5));
          }
        }
        
        // Power words & triggers
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
          yPos += lines.length * lineHeight + 3;
        }
        
        yPos += 8;
      }

      // ========================================
      // INFLUENCE VECTORS
      // ========================================
      if (sections.find(s => s.id === 'influence')?.enabled && influenceData.data) {
        renderSectionHeader('Influence Vectors', [51, 102, 0]);
        
        const influence = influenceData.data as any;
        
        if (influence.influence_index !== undefined) {
          renderKeyValue('Influence Index', `${influence.influence_index}/100`);
        }
        if (influence.susceptibility_profile) {
          renderKeyValue('Susceptibility Profile', influence.susceptibility_profile);
        }
        if (influence.network_centrality !== undefined) {
          renderKeyValue('Network Centrality', `${influence.network_centrality}%`);
        }
        
        if (influence.persuasion_vectors?.length > 0) {
          renderSubsection('Optimal Persuasion Vectors');
          influence.persuasion_vectors.slice(0, 6).forEach((v: any) => {
            if (typeof v === 'string') {
              renderBullet(v, 5);
            } else {
              renderBullet(`${v.vector || v.type}: ${v.effectiveness || v.description}`, 5);
            }
          });
        }
        
        yPos += 8;
      }

      // ========================================
      // THREAT ASSESSMENT
      // ========================================
      if (sections.find(s => s.id === 'threatActor')?.enabled && threatData.data) {
        renderSectionHeader('Threat Assessment', [180, 0, 0]);
        
        const threat = threatData.data as any;
        
        // Threat level banner
        checkPageBreak(18);
        const threatLevel = threat.threat_level?.toUpperCase() || 'UNKNOWN';
        const threatColor: [number, number, number] = threatLevel === 'HIGH' ? [180, 0, 0] : threatLevel === 'MEDIUM' ? [180, 100, 0] : [100, 100, 100];
        doc.setFillColor(...threatColor, 0.15);
        doc.roundedRect(margin, yPos - 3, contentWidth, 14, 2, 2, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...threatColor);
        doc.text(`⚠ THREAT LEVEL: ${threatLevel}`, margin + 5, yPos + 6);
        doc.setTextColor(0);
        yPos += 20;
        
        if (threat.actor_type) renderKeyValue('Actor Type', threat.actor_type);
        if (threat.capability_assessment) renderKeyValue('Capability', threat.capability_assessment);
        if (threat.intent_assessment) renderKeyValue('Intent', threat.intent_assessment);
        
        if (threat.known_tactics?.length > 0) {
          renderSubsection('Known Tactics');
          threat.known_tactics.slice(0, 5).forEach((t: string) => renderBullet(t, 5));
          yPos += 3;
        }
        
        if (threat.countermeasures?.length > 0) {
          renderSubsection('Recommended Countermeasures');
          doc.setTextColor(0, 100, 0);
          threat.countermeasures.slice(0, 5).forEach((c: string) => renderBullet(c, 5, '✓'));
          doc.setTextColor(0);
        }
        
        yPos += 8;
      }

      // ========================================
      // BETRAYAL & CRISIS PREDICTION
      // ========================================
      if (sections.find(s => s.id === 'betrayal')?.enabled && betrayalData.data?.length > 0) {
        renderSectionHeader('Betrayal & Crisis Prediction', [100, 0, 50]);
        
        const betrayal = betrayalData.data[0] as any;
        
        // Overall betrayal risk
        if (betrayal.betrayal_likelihood !== undefined) {
          checkPageBreak(25);
          const risk = betrayal.betrayal_likelihood * 100;
          const riskColor: [number, number, number] = risk > 70 ? [180, 0, 0] : risk > 40 ? [180, 100, 0] : [0, 150, 0];
          
          doc.setFillColor(...riskColor, 0.1);
          doc.roundedRect(margin, yPos - 3, contentWidth, 20, 2, 2, 'F');
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...riskColor);
          doc.text(`Betrayal Risk: ${risk.toFixed(0)}%`, margin + 5, yPos + 8);
          doc.setTextColor(0);
          yPos += 25;
        }
        
        // Gottman's Four Horsemen
        if (betrayal.four_horsemen) {
          renderSubsection("Gottman's Four Horsemen Analysis");
          const horsemen = betrayal.four_horsemen as any;
          if (horsemen.criticism !== undefined) renderScoreBar('Criticism', horsemen.criticism, 100, [180, 0, 0]);
          if (horsemen.contempt !== undefined) renderScoreBar('Contempt', horsemen.contempt, 100, [150, 0, 50]);
          if (horsemen.defensiveness !== undefined) renderScoreBar('Defensiveness', horsemen.defensiveness, 100, [100, 100, 0]);
          if (horsemen.stonewalling !== undefined) renderScoreBar('Stonewalling', horsemen.stonewalling, 100, [50, 50, 150]);
          yPos += 3;
        }
        
        // Warning signs
        if (betrayal.warning_signs?.length > 0) {
          renderSubsection('⚠ Active Warning Signs');
          doc.setTextColor(180, 0, 0);
          betrayal.warning_signs.slice(0, 5).forEach((w: string) => renderBullet(w, 5));
          doc.setTextColor(0);
        }
        
        // Protective factors
        if (betrayal.protective_factors?.length > 0) {
          renderSubsection('✓ Protective Factors');
          doc.setTextColor(0, 100, 0);
          betrayal.protective_factors.slice(0, 5).forEach((p: string) => renderBullet(p, 5, '✓'));
          doc.setTextColor(0);
        }
        
        yPos += 8;
      }

      // ========================================
      // TRAUMA & VULNERABILITY WINDOWS
      // ========================================
      if (sections.find(s => s.id === 'trauma')?.enabled && traumaData?.data) {
        renderSectionHeader('Trauma & Vulnerability Windows', [120, 0, 60]);
        
        const trauma = traumaData.data as any;
        
        if (trauma.vulnerability_score !== undefined) {
          checkPageBreak(20);
          const score = (trauma.vulnerability_score * 100);
          const color: [number, number, number] = score > 60 ? [180, 0, 0] : score > 30 ? [180, 100, 0] : [0, 120, 0];
          doc.setFillColor(...color, 0.1);
          doc.roundedRect(margin, yPos - 3, contentWidth, 14, 2, 2, 'F');
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...color);
          doc.text(`Vulnerability Score: ${score.toFixed(0)}%`, margin + 5, yPos + 5);
          doc.setTextColor(0);
          yPos += 20;
        }

        if (trauma.detected_patterns?.length > 0) {
          renderSubsection('⚠ Detected Trauma Patterns');
          trauma.detected_patterns.slice(0, 6).forEach((p: any) => {
            doc.setTextColor(120, 0, 60);
            renderBullet(`${p.type}: ${p.trigger} (Severity: ${(p.severity * 100).toFixed(0)}%)`, 5);
            if (p.exploitationScript) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              doc.setTextColor(80, 80, 80);
              const lines = doc.splitTextToSize(`Script: "${p.exploitationScript}"`, contentWidth - 20);
              checkPageBreak(lines.length * 5 + 3);
              doc.text(lines, margin + 10, yPos);
              yPos += lines.length * 5 + 2;
            }
            doc.setTextColor(0);
          });
        }

        if (trauma.optimal_timing?.length > 0) {
          renderSubsection('⏰ Optimal Timing Windows');
          trauma.optimal_timing.slice(0, 4).forEach((t: string) => renderBullet(t, 5));
        }
        
        yPos += 8;
      }

      // ========================================
      // BEHAVIORAL FUTURE MODELING
      // ========================================
      if (sections.find(s => s.id === 'futureModeling')?.enabled && scenarioPredictions?.data?.length > 0) {
        renderSectionHeader('Behavioral Future Modeling', [0, 80, 120]);
        
        scenarioPredictions.data.slice(0, 4).forEach((pred: any) => {
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
          
          if (crossModal.correlation_strength !== undefined) {
            renderScoreBar('Deception Risk', crossModal.correlation_strength * 100, 100, [180, 50, 0]);
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

          if (crossModal.tactical_implications) {
            renderSubsection('Tactical Implications');
            const implications = String(crossModal.tactical_implications);
            const lines = doc.splitTextToSize(implications.substring(0, 500), contentWidth - 10);
            checkPageBreak(lines.length * 5 + 5);
            doc.setFontSize(8);
            doc.text(lines, margin + 5, yPos);
            yPos += lines.length * 5;
          }
        }
        
        yPos += 8;
      }
      // ========================================
      if (sections.find(s => s.id === 'timeline')?.enabled && commData.data?.length > 0) {
        renderSectionHeader('Interaction Timeline', [80, 80, 80]);
        
        commData.data.slice(0, 15).forEach((comm: any) => {
          checkPageBreak(20);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const date = format(new Date(comm.occurred_at), 'MMM d, yyyy HH:mm');
          doc.text(`${date} | ${comm.channel?.toUpperCase() || 'UNKNOWN'}`, margin, yPos);
          
          // Sentiment indicator
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
      // BEHAVIORAL ANALYSIS
      // ========================================
      if (sections.find(s => s.id === 'analysis')?.enabled && behavioralData.data?.length > 0) {
        renderSectionHeader('Behavioral Analysis', [60, 60, 120]);
        
        behavioralData.data.slice(0, 3).forEach((analysis: any) => {
          checkPageBreak(40);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(analysis.analysis_type || 'Behavioral Pattern', margin, yPos);
          yPos += lineHeight;
          
          if (analysis.behavioral_patterns) {
            const patterns = typeof analysis.behavioral_patterns === 'string' 
              ? analysis.behavioral_patterns 
              : JSON.stringify(analysis.behavioral_patterns).substring(0, 400);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const lines = doc.splitTextToSize(patterns, contentWidth - 10);
            doc.text(lines.slice(0, 6), margin + 5, yPos);
            yPos += Math.min(lines.length, 6) * 5;
          }
          
          yPos += 8;
        });
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
      // NETWORK POSITION
      // ========================================
      if (sections.find(s => s.id === 'network')?.enabled && relationshipsData.data?.length > 0) {
        renderSectionHeader('Network Position', [80, 80, 120]);
        
        renderSubsection(`${relationshipsData.data.length} Known Connections`);
        
        relationshipsData.data.slice(0, 12).forEach((rel: any) => {
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
      }

      // ========================================
      // FOOTER ON ALL PAGES
      // ========================================
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
        
        doc.setFontSize(7);
        doc.setTextColor(128);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
        doc.text('CONFIDENTIAL - PICS Intelligence System', margin, pageHeight - 8);
        doc.text(`${format(new Date(), 'yyyy-MM-dd HH:mm')} | ${contactName}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      }

      // Save
      const fileName = `intelligence-dossier-${contactName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
      doc.save(fileName);

      toast.success(`Intelligence dossier generated: ${pageCount} pages`);
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
              Intelligence Dossier Generator
            </CardTitle>
            <CardDescription>
              Generate comprehensive intelligence dossiers with deep psychological profiles, media synthesis, and warfare assessments
            </CardDescription>
          </div>
          {dataStats && (
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                📷 {dataStats.media} Media
              </Badge>
              <Badge variant="outline" className="text-xs">
                🎙️ {dataStats.voice} Voice
              </Badge>
              <Badge variant="outline" className="text-xs">
                🧠 {dataStats.analyses} Analyses
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
                <SelectItem value="full">Full Intelligence Package (Complete)</SelectItem>
                <SelectItem value="surveillance">Surveillance Report (Media Focus)</SelectItem>
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
          </div>
        </div>

        <div className="space-y-4">
          <Label>Include Sections</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">CORE</p>
                <div className="space-y-1.5">
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
              
              <div>
                <p className="text-xs font-medium text-blue-600 mb-2">INTELLIGENCE</p>
                <div className="space-y-1.5">
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
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-red-600 mb-2">WARFARE</p>
                <div className="space-y-1.5">
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
              
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">ANALYSIS</p>
                <div className="space-y-1.5">
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
        </div>

        <Button 
          onClick={generatePDF} 
          disabled={isGenerating || (!profileId && !selectedProfile)}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Intelligence Dossier...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Intelligence Dossier (PDF)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
