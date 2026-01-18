import { useState, useCallback } from 'react';
import { FileText, Download, Loader2, User, Calendar, TrendingUp, Shield, Network, Brain, Image, Target, Clipboard, Heart, AlertTriangle, Mic, Zap, Eye, Crosshair } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export function PDFDossierGenerator({ profileId, profileName }: PDFDossierGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(profileId || null);
  const [selectedContactName, setSelectedContactName] = useState<string>(profileName || '');
  const [template, setTemplate] = useState<DossierTemplate>('full');
  
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
    { id: 'influence', label: 'Influence Vectors', icon: Eye, enabled: true, category: 'warfare' },
    { id: 'threatActor', label: 'Threat Assessment', icon: AlertTriangle, enabled: true, category: 'warfare' },
    
    // Analysis sections
    { id: 'analysis', label: 'Behavioral Analysis', icon: TrendingUp, enabled: false, category: 'analysis' },
    { id: 'trust', label: 'Trust Assessment', icon: Shield, enabled: false, category: 'analysis' },
    { id: 'network', label: 'Network Position', icon: Network, enabled: false, category: 'analysis' },
  ]);

  const handleContactSelect = useCallback((id: string | null, contact?: { first_name: string; last_name: string | null }) => {
    setSelectedProfile(id);
    if (contact) {
      setSelectedContactName(`${contact.first_name} ${contact.last_name || ''}`.trim());
    } else {
      setSelectedContactName('');
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
      operational: ['executive', 'overview', 'psychological', 'playbook', 'actionPlans', 'mice', 'influence'],
      full: ['executive', 'overview', 'timeline', 'psychological', 'relationship', 'playbook', 'mediaIntel', 'voiceIntel', 'actionPlans', 'mice', 'influence', 'threatActor'],
      surveillance: ['overview', 'mediaIntel', 'voiceIntel', 'timeline', 'network', 'threatActor'],
    };
    
    setSections(sections.map(s => ({
      ...s,
      enabled: enabledIds[templateType].includes(s.id),
    })));
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

      // COMPREHENSIVE DATA FUSION - Fetch from ALL intelligence sources
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
      ] = await Promise.all([
        // Communications timeline
        supabase.from('communications').select('*').eq('profile_id', targetProfileId).order('occurred_at', { ascending: false }).limit(30),
        
        // Psychological profiles - THE GOLD
        supabase.from('psychological_profiles').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        
        // ALL AI analyses (personality, playbook, relationship_score, sentiment, deep_intelligence, media_intelligence_aggregation)
        supabase.from('ai_analyses').select('*').eq('profile_id', targetProfileId).order('generated_at', { ascending: false }),
        
        // Media analyses with rich intelligence
        supabase.from('media_analyses').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }),
        
        // Media items with AI metadata - ALL OF THEM
        supabase.from('media').select('id, caption, ai_metadata, completed_analysis_modes, created_at, media_type').eq('profile_id', targetProfileId).not('ai_metadata', 'is', null),
        
        // Voice recording sessions
        supabase.from('voice_recording_sessions').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }),
        
        // Behavioral analyses
        supabase.from('behavioral_analyses').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(5),
        
        // Trust assessments
        supabase.from('trust_assessments').select('*').eq('profile_id', targetProfileId).order('assessed_at', { ascending: false }).limit(1),
        
        // MICE assessments
        supabase.from('mice_assessments').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        
        // Influence profiles
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
      ]);

      // Create PDF with enhanced styling
      const doc = new jsPDF();
      let yPos = 20;
      const lineHeight = 6;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Helper function for page breaks
      const checkPageBreak = (neededSpace: number) => {
        if (yPos > 280 - neededSpace) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Helper for section headers
      const renderSectionHeader = (title: string, color: [number, number, number] = [0, 0, 0]) => {
        checkPageBreak(20);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin - 5, yPos - 5, contentWidth + 10, 12, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...color);
        doc.text(title.toUpperCase(), margin, yPos);
        doc.setTextColor(0);
        yPos += lineHeight * 2.5;
      };

      // Helper for subsection headers
      const renderSubsection = (title: string) => {
        checkPageBreak(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPos);
        yPos += lineHeight * 1.5;
      };

      // Helper for bullet points
      const renderBullet = (text: string, indent: number = 0) => {
        checkPageBreak(10);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(`• ${text}`, contentWidth - indent);
        doc.text(lines, margin + indent, yPos);
        yPos += lines.length * lineHeight;
      };

      // Helper for key-value pairs
      const renderKeyValue = (key: string, value: string, keyWidth: number = 50) => {
        checkPageBreak(10);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(key + ':', margin, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(String(value || 'N/A'), contentWidth - keyWidth - 5);
        doc.text(lines, margin + keyWidth, yPos);
        yPos += lines.length * lineHeight;
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

      // ========================================
      // COVER PAGE
      // ========================================
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('INTELLIGENCE DOSSIER', pageWidth / 2, 60, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('CLASSIFICATION: CONFIDENTIAL', pageWidth / 2, 75, { align: 'center' });
      doc.setTextColor(0);
      
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(contactName.toUpperCase(), pageWidth / 2, 100, { align: 'center' });
      
      if (profile.organization) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(profile.organization, pageWidth / 2, 112, { align: 'center' });
      }
      
      // Intelligence summary box
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, 130, contentWidth, 50, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INTELLIGENCE SOURCES', margin + 5, 140);
      doc.setFont('helvetica', 'normal');
      doc.text(`Media Items Analyzed: ${totalMediaAnalyzed}`, margin + 10, 152);
      doc.text(`Voice Sessions: ${totalVoiceSessions}`, margin + 10, 160);
      doc.text(`Observations: ${totalObservations}`, margin + 10, 168);
      doc.text(`Communications: ${totalCommunications}`, margin + 80, 152);
      doc.text(`AI Analyses: ${allAnalyses.data?.length || 0}`, margin + 80, 160);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, pageWidth / 2, 200, { align: 'center' });
      doc.text(`Template: ${template.toUpperCase()}`, pageWidth / 2, 208, { align: 'center' });
      doc.setTextColor(0);
      
      doc.addPage();
      yPos = 20;

      // ========================================
      // EXECUTIVE INTELLIGENCE BRIEF
      // ========================================
      if (sections.find(s => s.id === 'executive')?.enabled) {
        renderSectionHeader('Executive Intelligence Brief', [0, 51, 102]);
        
        // Subject Classification
        const psych = psychData.data?.[0] as any;
        const attachmentStyle = psych?.attachment_style as any;
        const riskLevel = anomaliesData.data?.length > 2 ? 'HIGH' : anomaliesData.data?.length > 0 ? 'MEDIUM' : 'LOW';
        
        doc.setFillColor(riskLevel === 'HIGH' ? 255 : riskLevel === 'MEDIUM' ? 255 : 200, 
                         riskLevel === 'HIGH' ? 200 : riskLevel === 'MEDIUM' ? 230 : 255, 
                         200);
        doc.rect(margin, yPos - 3, contentWidth, 12, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`SUBJECT CLASSIFICATION: ${riskLevel} PRIORITY`, margin + 5, yPos + 5);
        yPos += 18;
        
        // Key Assessment
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
        
        // Critical Findings from Deep Intelligence
        if (deepIntelAnalysis?.result) {
          const deep = deepIntelAnalysis.result as any;
          if (deep.key_findings?.length > 0) {
            yPos += 5;
            renderSubsection('Critical Intelligence Findings');
            deep.key_findings.slice(0, 5).forEach((f: any) => {
              renderBullet(`[${f.importance?.toUpperCase() || 'MEDIUM'}] ${f.finding}`);
            });
          }
        }
        
        // Immediate Actions Required
        const actionPlans = psych?.action_plans as any;
        if (actionPlans?.immediate?.length > 0) {
          yPos += 5;
          renderSubsection('Immediate Actions Required');
          actionPlans.immediate.slice(0, 3).forEach((action: any) => {
            doc.setTextColor(180, 0, 0);
            renderBullet(`[${action.priority?.toUpperCase() || 'HIGH'}] ${action.title}`);
            doc.setTextColor(0);
            if (action.script) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'italic');
              const scriptLines = doc.splitTextToSize(`Script: "${action.script}"`, contentWidth - 15);
              doc.text(scriptLines, margin + 10, yPos);
              yPos += scriptLines.length * 5 + 2;
            }
          });
        }
        
        yPos += 10;
      }

      // ========================================
      // CONTACT OVERVIEW
      // ========================================
      if (sections.find(s => s.id === 'overview')?.enabled) {
        renderSectionHeader('Contact Overview');
        
        renderKeyValue('Full Name', contactName);
        renderKeyValue('Organization', profile.organization || 'Unknown');
        renderKeyValue('Position', profile.job_title || 'Unknown');
        renderKeyValue('Relationship Type', profile.relationship_type || 'Unclassified');
        renderKeyValue('Last Contact', profile.last_contact_date ? format(new Date(profile.last_contact_date), 'MMM d, yyyy') : 'Unknown');
        
        if (profile.notes) {
          yPos += 5;
          renderSubsection('Notes');
          const noteLines = doc.splitTextToSize(profile.notes, contentWidth);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(noteLines, margin, yPos);
          yPos += noteLines.length * lineHeight;
        }
        
        yPos += 10;
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
          renderKeyValue('Primary Style', style.primary_style || 'Unknown');
          renderKeyValue('Anxiety Score', `${style.anxiety_score || 0}%`);
          renderKeyValue('Avoidance Score', `${style.avoidance_score || 0}%`);
          if (style.evidence?.length > 0) {
            yPos += 3;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('Evidence:', margin, yPos);
            yPos += 5;
            style.evidence.slice(0, 3).forEach((e: string) => {
              const lines = doc.splitTextToSize(`- ${e}`, contentWidth - 10);
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
          if (dark.narcissism !== undefined) renderKeyValue('Narcissism', `${dark.narcissism}%`);
          if (dark.machiavellianism !== undefined) renderKeyValue('Machiavellianism', `${dark.machiavellianism}%`);
          if (dark.psychopathy !== undefined) renderKeyValue('Psychopathy', `${dark.psychopathy}%`);
          if (dark.manifestations?.length > 0) {
            dark.manifestations.slice(0, 3).forEach((m: string) => renderBullet(m, 5));
          }
          yPos += 5;
        }
        
        // Emotional Intelligence
        if (psych.emotional_intelligence) {
          const ei = psych.emotional_intelligence as any;
          renderSubsection('Emotional Intelligence Map');
          if (ei.self_awareness) renderKeyValue('Self-Awareness', `${ei.self_awareness}%`);
          if (ei.self_regulation) renderKeyValue('Self-Regulation', `${ei.self_regulation}%`);
          if (ei.empathy) renderKeyValue('Empathy', `${ei.empathy}%`);
          if (ei.social_skills) renderKeyValue('Social Skills', `${ei.social_skills}%`);
          yPos += 5;
        }
        
        // Deception Analysis
        if (psych.deception_analysis) {
          const dec = psych.deception_analysis as any;
          renderSubsection('Deception Analysis');
          if (dec.baseline_established) {
            renderKeyValue('Baseline', 'Established');
          }
          if (dec.detected_tells?.length > 0) {
            dec.detected_tells.slice(0, 4).forEach((t: string) => renderBullet(t, 5));
          }
          yPos += 5;
        }
        
        // Vulnerabilities
        const vulnerabilities = psych.vulnerabilities || psych.vulnerability_map;
        if (vulnerabilities && Array.isArray(vulnerabilities) && vulnerabilities.length > 0) {
          renderSubsection('Identified Vulnerabilities');
          vulnerabilities.slice(0, 6).forEach((vuln: string) => {
            doc.setTextColor(180, 0, 0);
            renderBullet(vuln, 5);
            doc.setTextColor(0);
          });
          yPos += 5;
        }
        
        // Leverage Points
        const leveragePoints = psych.leverage_points || psych.influence_vectors;
        if (leveragePoints && Array.isArray(leveragePoints) && leveragePoints.length > 0) {
          renderSubsection('Leverage Points');
          leveragePoints.slice(0, 6).forEach((lp: string) => {
            doc.setTextColor(0, 100, 0);
            renderBullet(lp, 5);
            doc.setTextColor(0);
          });
        }
        
        yPos += 10;
      }

      // ========================================
      // RELATIONSHIP INTELLIGENCE
      // ========================================
      if (sections.find(s => s.id === 'relationship')?.enabled && relationshipAnalysis) {
        renderSectionHeader('Relationship Intelligence', [0, 102, 51]);
        
        const result = relationshipAnalysis.result as any;
        
        // Score display
        doc.setFillColor(240, 245, 240);
        doc.rect(margin, yPos - 3, 80, 20, 'F');
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(`${result.score || 0}`, margin + 10, yPos + 10);
        doc.setFontSize(12);
        doc.text(`/ 100`, margin + 35, yPos + 10);
        doc.setFontSize(14);
        doc.text(`Grade: ${result.grade || 'N/A'}`, margin + 55, yPos + 10);
        yPos += 25;
        
        // Factors
        if (result.factors?.length > 0) {
          renderSubsection('Relationship Factors');
          result.factors.forEach((factor: any) => {
            renderKeyValue(factor.name, `${factor.score}%`, 60);
          });
          yPos += 5;
        }
        
        // Strengths
        if (result.strengths?.length > 0) {
          renderSubsection('Relationship Strengths');
          result.strengths.slice(0, 5).forEach((s: string) => renderBullet(s, 5));
          yPos += 5;
        }
        
        // Areas for Improvement
        if (result.areasForImprovement?.length > 0) {
          renderSubsection('Areas for Improvement');
          result.areasForImprovement.slice(0, 5).forEach((a: string) => renderBullet(a, 5));
        }
        
        yPos += 10;
      }

      // ========================================
      // ENGAGEMENT PLAYBOOK
      // ========================================
      if (sections.find(s => s.id === 'playbook')?.enabled && playbookAnalysis) {
        renderSectionHeader('Engagement Playbook', [102, 51, 0]);
        
        const result = playbookAnalysis.result as any;
        
        // Things to Remember
        if (result.thingsToRemember?.length > 0) {
          renderSubsection('Key Intelligence Points');
          result.thingsToRemember.slice(0, 10).forEach((item: string) => renderBullet(item));
          yPos += 5;
        }
        
        // Conversation Starters
        if (result.conversationStarters?.length > 0) {
          renderSubsection('Tactical Conversation Openers');
          result.conversationStarters.slice(0, 5).forEach((starter: string) => {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            const lines = doc.splitTextToSize(`"${starter}"`, contentWidth - 10);
            checkPageBreak(lines.length * lineHeight + 5);
            doc.text(lines, margin + 5, yPos);
            yPos += lines.length * lineHeight + 2;
          });
          yPos += 5;
        }
        
        // Rapport Builders
        if (result.rapportBuilders?.length > 0) {
          renderSubsection('Rapport Building Tactics');
          result.rapportBuilders.slice(0, 5).forEach((rb: string) => renderBullet(rb, 5));
          yPos += 5;
        }
        
        // Topics to Avoid
        if (result.topicsToAvoid?.length > 0) {
          renderSubsection('CRITICAL: Topics to Avoid');
          doc.setTextColor(180, 0, 0);
          result.topicsToAvoid.slice(0, 5).forEach((topic: string) => {
            renderBullet(`⚠ ${topic}`, 5);
          });
          doc.setTextColor(0);
        }
        
        yPos += 10;
      }

      // ========================================
      // MEDIA INTELLIGENCE SYNTHESIS
      // ========================================
      if (sections.find(s => s.id === 'mediaIntel')?.enabled) {
        const hasMediaAnalyses = mediaAnalyses.data && mediaAnalyses.data.length > 0;
        const hasMediaMetadata = mediaData.data && mediaData.data.length > 0;
        
        if (hasMediaAnalyses || hasMediaMetadata) {
          renderSectionHeader('Media Intelligence Synthesis', [51, 51, 102]);
          
          // Summary stats
          doc.setFillColor(245, 245, 250);
          doc.rect(margin, yPos - 3, contentWidth, 15, 'F');
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${totalMediaAnalyzed} MEDIA ITEMS ANALYZED`, margin + 5, yPos + 5);
          doc.text(`${mediaAnalyses.data?.length || 0} Deep Analyses`, margin + 90, yPos + 5);
          yPos += 20;
          
          // Use aggregated media intelligence if available
          if (mediaAggregation?.result) {
            const agg = mediaAggregation.result as any;
            
            if (agg.certainties?.length > 0) {
              renderSubsection('High-Confidence Conclusions');
              agg.certainties.slice(0, 6).forEach((c: string) => {
                doc.setTextColor(0, 100, 0);
                renderBullet(`✓ ${c}`, 5);
                doc.setTextColor(0);
              });
              yPos += 5;
            }
            
            if (agg.people_network?.identified_individuals?.length > 0) {
              renderSubsection('Network Analysis');
              agg.people_network.identified_individuals.slice(0, 5).forEach((p: any) => {
                renderBullet(`${p.description || p.name}: ${p.relationship_type || 'Unknown relationship'}`, 5);
              });
              yPos += 5;
            }
            
            if (agg.location_timeline?.length > 0) {
              renderSubsection('Location Intelligence');
              agg.location_timeline.slice(0, 5).forEach((l: any) => {
                renderBullet(`${l.location}: ${l.frequency || 1} occurrence(s)`, 5);
              });
              yPos += 5;
            }
            
            if (agg.wealth_lifestyle) {
              const wl = agg.wealth_lifestyle;
              if (wl.indicators?.length > 0) {
                renderSubsection('Lifestyle Indicators');
                wl.indicators.slice(0, 5).forEach((i: string) => renderBullet(i, 5));
              }
              if (wl.profession_cues?.length > 0) {
                renderSubsection('Profession Cues');
                wl.profession_cues.slice(0, 4).forEach((p: string) => renderBullet(p, 5));
              }
              yPos += 5;
            }
            
            if (agg.red_flags?.length > 0) {
              renderSubsection('Red Flags from Media');
              doc.setTextColor(180, 0, 0);
              agg.red_flags.slice(0, 5).forEach((rf: string) => {
                renderBullet(`⚠ ${rf}`, 5);
              });
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
              yPos += 5;
            }
            
            if (allRedFlags.length > 0) {
              renderSubsection('Red Flags');
              doc.setTextColor(180, 0, 0);
              [...new Set(allRedFlags)].slice(0, 5).forEach((flag: string) => renderBullet(`⚠ ${flag}`, 5));
              doc.setTextColor(0);
            }
          }
          
          yPos += 10;
        }
      }

      // ========================================
      // VOICE INTELLIGENCE
      // ========================================
      if (sections.find(s => s.id === 'voiceIntel')?.enabled && (voiceData.data?.length > 0 || voiceAggregation?.result)) {
        renderSectionHeader('Voice Intelligence', [102, 0, 51]);
        
        doc.setFillColor(250, 245, 248);
        doc.rect(margin, yPos - 3, contentWidth, 12, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${totalVoiceSessions} VOICE SESSIONS ANALYZED`, margin + 5, yPos + 4);
        yPos += 18;
        
        if (voiceAggregation?.result) {
          const voice = voiceAggregation.result as any;
          
          if (voice.vocal_psychology) {
            renderSubsection('Vocal Psychology');
            const vp = voice.vocal_psychology;
            if (vp.baseline_emotional_state) renderKeyValue('Baseline Emotional State', vp.baseline_emotional_state);
            if (vp.stress_indicators?.length > 0) {
              vp.stress_indicators.slice(0, 3).forEach((s: string) => renderBullet(s, 5));
            }
          }
          
          if (voice.deception_markers?.length > 0) {
            renderSubsection('Deception Markers Detected');
            doc.setTextColor(180, 100, 0);
            voice.deception_markers.slice(0, 4).forEach((m: string) => renderBullet(m, 5));
            doc.setTextColor(0);
          }
          
          if (voice.key_themes?.length > 0) {
            renderSubsection('Key Conversation Themes');
            voice.key_themes.slice(0, 5).forEach((t: string) => renderBullet(t, 5));
          }
        } else if (voiceData.data?.length > 0) {
          // Show recent voice session summaries
          renderSubsection('Recent Voice Sessions');
          voiceData.data.slice(0, 5).forEach((v: any) => {
            checkPageBreak(15);
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
        
        yPos += 10;
      }

      // ========================================
      // STRATEGIC ACTION PLANS
      // ========================================
      if (sections.find(s => s.id === 'actionPlans')?.enabled && psychData.data?.length > 0) {
        const actionPlans = (psychData.data[0] as any).action_plans as any;
        
        if (actionPlans) {
          renderSectionHeader('Strategic Action Plans', [0, 102, 102]);
          
          const renderActionCategory = (title: string, actions: any[], urgencyColor: [number, number, number]) => {
            if (!actions?.length) return;
            
            checkPageBreak(40);
            doc.setFillColor(...urgencyColor, 0.1);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...urgencyColor);
            doc.text(title, margin, yPos);
            doc.setTextColor(0);
            yPos += lineHeight * 1.5;
            
            actions.slice(0, 4).forEach((action: any) => {
              checkPageBreak(30);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.text(`[${action.priority?.toUpperCase() || 'NORMAL'}] ${action.title}`, margin + 5, yPos);
              yPos += lineHeight;
              
              if (action.description) {
                doc.setFont('helvetica', 'normal');
                const lines = doc.splitTextToSize(action.description, contentWidth - 15);
                doc.text(lines, margin + 10, yPos);
                yPos += lines.length * lineHeight;
              }
              
              if (action.script) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8);
                doc.setTextColor(60, 60, 60);
                const scriptLines = doc.splitTextToSize(`Suggested script: "${action.script}"`, contentWidth - 20);
                doc.text(scriptLines, margin + 15, yPos);
                doc.setTextColor(0);
                yPos += scriptLines.length * 5 + 3;
              }
              
              yPos += 5;
            });
            
            yPos += 5;
          };
          
          renderActionCategory('IMMEDIATE ACTIONS (Critical)', actionPlans.immediate, [180, 0, 0]);
          renderActionCategory('SHORT-TERM ACTIONS', actionPlans.short_term, [180, 100, 0]);
          renderActionCategory('LONG-TERM ACTIONS', actionPlans.long_term, [0, 100, 0]);
          
          // Do Not Do list
          if (actionPlans.do_not_do?.length > 0) {
            checkPageBreak(40);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(180, 0, 0);
            doc.text('CRITICAL: DO NOT DO', margin, yPos);
            doc.setTextColor(0);
            yPos += lineHeight * 1.5;
            
            actionPlans.do_not_do.slice(0, 5).forEach((item: any) => {
              checkPageBreak(15);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.text(`✗ ${item.action || item}`, margin + 5, yPos);
              yPos += lineHeight;
              if (item.reason) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                const lines = doc.splitTextToSize(`Reason: ${item.reason}`, contentWidth - 15);
                doc.text(lines, margin + 10, yPos);
                yPos += lines.length * 5;
              }
              yPos += 3;
            });
          }
          
          yPos += 10;
        }
      }

      // ========================================
      // MICE VULNERABILITY MATRIX
      // ========================================
      if (sections.find(s => s.id === 'mice')?.enabled && miceData.data?.length > 0) {
        renderSectionHeader('MICE Vulnerability Matrix', [102, 0, 0]);
        
        const mice = miceData.data[0] as any;
        
        // MICE scores table
        doc.setFillColor(255, 245, 245);
        doc.rect(margin, yPos - 3, contentWidth, 35, 'F');
        yPos += 5;
        
        const miceScores = [
          { label: 'MONEY', score: mice.money_score || 0, desc: 'Financial vulnerability' },
          { label: 'IDEOLOGY', score: mice.ideology_score || 0, desc: 'Ideological alignment' },
          { label: 'COMPROMISE', score: mice.compromise_score || 0, desc: 'Compromising material' },
          { label: 'EGO', score: mice.ego_score || 0, desc: 'Ego/Recognition needs' },
        ];
        
        let xOffset = margin + 5;
        miceScores.forEach((m) => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(m.label, xOffset, yPos);
          doc.setFontSize(16);
          doc.text(`${m.score}%`, xOffset, yPos + 12);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(m.desc, xOffset, yPos + 20);
          xOffset += 45;
        });
        yPos += 35;
        
        if (mice.primary_vulnerability) {
          renderKeyValue('Primary Vulnerability', mice.primary_vulnerability);
        }
        if (mice.recruitment_likelihood) {
          renderKeyValue('Recruitment Likelihood', `${(mice.recruitment_likelihood * 100).toFixed(0)}%`);
        }
        
        if (mice.approach_recommendations?.length > 0) {
          renderSubsection('Recommended Approaches');
          mice.approach_recommendations.slice(0, 4).forEach((r: string) => renderBullet(r, 5));
        }
        
        yPos += 10;
      }

      // ========================================
      // INFLUENCE VECTORS
      // ========================================
      if (sections.find(s => s.id === 'influence')?.enabled && influenceData.data) {
        renderSectionHeader('Influence Vectors', [51, 102, 0]);
        
        const influence = influenceData.data as any;
        
        if (influence.influence_index) {
          renderKeyValue('Influence Index', `${influence.influence_index}/100`);
        }
        if (influence.susceptibility_profile) {
          renderKeyValue('Susceptibility Profile', influence.susceptibility_profile);
        }
        if (influence.network_centrality) {
          renderKeyValue('Network Centrality', `${influence.network_centrality}%`);
        }
        
        if (influence.primary_motivators?.length > 0) {
          renderSubsection('Primary Motivators');
          influence.primary_motivators.slice(0, 5).forEach((m: string) => renderBullet(m, 5));
          yPos += 5;
        }
        
        if (influence.persuasion_vectors?.length > 0) {
          renderSubsection('Optimal Persuasion Vectors');
          influence.persuasion_vectors.slice(0, 5).forEach((v: any) => {
            if (typeof v === 'string') {
              renderBullet(v, 5);
            } else {
              renderBullet(`${v.vector || v.type}: ${v.effectiveness || v.description}`, 5);
            }
          });
        }
        
        yPos += 10;
      }

      // ========================================
      // THREAT ASSESSMENT
      // ========================================
      if (sections.find(s => s.id === 'threatActor')?.enabled && threatData.data) {
        renderSectionHeader('Threat Assessment', [180, 0, 0]);
        
        const threat = threatData.data as any;
        
        doc.setFillColor(255, 240, 240);
        doc.rect(margin, yPos - 3, contentWidth, 12, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`THREAT LEVEL: ${threat.threat_level?.toUpperCase() || 'UNKNOWN'}`, margin + 5, yPos + 4);
        yPos += 18;
        
        if (threat.actor_type) renderKeyValue('Actor Type', threat.actor_type);
        if (threat.capability_assessment) renderKeyValue('Capability', threat.capability_assessment);
        if (threat.intent_assessment) renderKeyValue('Intent', threat.intent_assessment);
        
        if (threat.known_tactics?.length > 0) {
          renderSubsection('Known Tactics');
          threat.known_tactics.slice(0, 5).forEach((t: string) => renderBullet(t, 5));
        }
        
        if (threat.countermeasures?.length > 0) {
          renderSubsection('Recommended Countermeasures');
          doc.setTextColor(0, 100, 0);
          threat.countermeasures.slice(0, 5).forEach((c: string) => renderBullet(c, 5));
          doc.setTextColor(0);
        }
        
        yPos += 10;
      }

      // ========================================
      // INTERACTION TIMELINE
      // ========================================
      if (sections.find(s => s.id === 'timeline')?.enabled && commData.data?.length > 0) {
        renderSectionHeader('Interaction Timeline');
        
        commData.data.slice(0, 15).forEach((comm: any) => {
          checkPageBreak(18);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const date = format(new Date(comm.occurred_at), 'MMM d, yyyy HH:mm');
          doc.text(`${date} | ${comm.channel?.toUpperCase() || 'UNKNOWN'}`, margin, yPos);
          yPos += lineHeight;
          
          if (comm.subject || comm.content) {
            doc.setFont('helvetica', 'normal');
            const text = comm.subject || comm.content?.substring(0, 100);
            const lines = doc.splitTextToSize(text, contentWidth - 10);
            doc.text(lines, margin + 5, yPos);
            yPos += lines.length * lineHeight;
          }
          
          if (comm.sentiment_score) {
            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.text(`Sentiment: ${comm.sentiment_score > 0 ? '+' : ''}${comm.sentiment_score}`, margin + 5, yPos);
            doc.setTextColor(0);
            yPos += 4;
          }
          
          yPos += 3;
        });
        
        yPos += 10;
      }

      // ========================================
      // BEHAVIORAL ANALYSIS
      // ========================================
      if (sections.find(s => s.id === 'analysis')?.enabled && behavioralData.data?.length > 0) {
        renderSectionHeader('Behavioral Analysis');
        
        behavioralData.data.slice(0, 3).forEach((analysis: any) => {
          checkPageBreak(40);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(analysis.analysis_type || 'Behavioral Pattern', margin, yPos);
          yPos += lineHeight;
          
          if (analysis.behavioral_patterns) {
            const patterns = typeof analysis.behavioral_patterns === 'string' 
              ? analysis.behavioral_patterns 
              : JSON.stringify(analysis.behavioral_patterns).substring(0, 300);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const lines = doc.splitTextToSize(patterns, contentWidth - 10);
            doc.text(lines.slice(0, 5), margin + 5, yPos);
            yPos += Math.min(lines.length, 5) * 5;
          }
          
          yPos += 8;
        });
      }

      // ========================================
      // TRUST ASSESSMENT
      // ========================================
      if (sections.find(s => s.id === 'trust')?.enabled && trustData.data?.length > 0) {
        renderSectionHeader('Trust Assessment');
        
        const trust = trustData.data[0] as any;
        
        if (trust.overall_trust_score !== undefined) {
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text(`${trust.overall_trust_score}%`, margin, yPos + 5);
          doc.setFontSize(10);
          doc.text('TRUST SCORE', margin + 35, yPos + 5);
          yPos += 15;
        }
        
        if (trust.trust_factors) {
          const factors = trust.trust_factors as any;
          Object.entries(factors).slice(0, 5).forEach(([key, value]) => {
            renderKeyValue(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), `${value}%`);
          });
        }
        
        if (trust.trust_trajectory) {
          renderKeyValue('Trajectory', trust.trust_trajectory);
        }
        
        yPos += 10;
      }

      // ========================================
      // NETWORK POSITION
      // ========================================
      if (sections.find(s => s.id === 'network')?.enabled && relationshipsData.data?.length > 0) {
        renderSectionHeader('Network Position');
        
        renderSubsection(`${relationshipsData.data.length} Known Connections`);
        
        relationshipsData.data.slice(0, 10).forEach((rel: any) => {
          checkPageBreak(12);
          const name = rel.to_profile 
            ? `${rel.to_profile.first_name} ${rel.to_profile.last_name || ''}`.trim()
            : 'Unknown';
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(name, margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(`| ${rel.relationship_type || 'Connected'} | Strength: ${rel.strength || 'Unknown'}`, margin + 60, yPos);
          yPos += lineHeight;
        });
      }

      // ========================================
      // FOOTER ON ALL PAGES
      // ========================================
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(128);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
        doc.text('CONFIDENTIAL - PICS Intelligence System', pageWidth / 2, 294, { align: 'center' });
        doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')} | Subject: ${contactName}`, pageWidth / 2, 286, { align: 'center' });
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
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Intelligence Dossier Generator
        </CardTitle>
        <CardDescription>
          Generate comprehensive intelligence dossiers with deep psychological profiles, media synthesis, and warfare assessments
        </CardDescription>
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

        <div className="space-y-4">
          <Label>Include Sections</Label>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">CORE</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
            
            <div>
              <p className="text-xs font-medium text-red-600 mb-2">WARFARE</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
              Generate Intelligence Dossier
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
