import { useState, useCallback } from 'react';
import { FileText, Download, Loader2, User, Calendar, TrendingUp, Shield, Network, Brain, Image, Target, Clipboard, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
}

export function PDFDossierGenerator({ profileId, profileName }: PDFDossierGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(profileId || null);
  const [selectedContactName, setSelectedContactName] = useState<string>(profileName || '');
  const [sections, setSections] = useState<DossierSection[]>([
    { id: 'overview', label: 'Contact Overview', icon: User, enabled: true },
    { id: 'psychological', label: 'Psychological Profile', icon: Brain, enabled: true },
    { id: 'relationship', label: 'Relationship Intelligence', icon: Heart, enabled: true },
    { id: 'playbook', label: 'Engagement Playbook', icon: Target, enabled: true },
    { id: 'mediaIntel', label: 'Media Intelligence', icon: Image, enabled: true },
    { id: 'actionPlans', label: 'Action Plans', icon: Clipboard, enabled: true },
    { id: 'timeline', label: 'Interaction Timeline', icon: Calendar, enabled: true },
    { id: 'analysis', label: 'Behavioral Analysis', icon: TrendingUp, enabled: false },
    { id: 'trust', label: 'Trust Assessment', icon: Shield, enabled: false },
    { id: 'network', label: 'Network Position', icon: Network, enabled: false },
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

      // Fetch comprehensive data based on selected sections
      const [commData, analysisData, trustData, psychData, allAnalyses, mediaAnalyses, mediaData] = await Promise.all([
        // Communications
        sections.find(s => s.id === 'timeline')?.enabled
          ? supabase.from('communications').select('*').eq('profile_id', targetProfileId).order('occurred_at', { ascending: false }).limit(20)
          : { data: [] },
        
        // Behavioral analyses
        sections.find(s => s.id === 'analysis')?.enabled
          ? supabase.from('behavioral_analyses').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1)
          : { data: [] },
        
        // Trust assessment
        sections.find(s => s.id === 'trust')?.enabled
          ? supabase.from('ai_analyses').select('*').eq('profile_id', targetProfileId).eq('analysis_type', 'trust_assessment').order('generated_at', { ascending: false }).limit(1)
          : { data: [] },
        
        // Psychological profiles
        supabase.from('psychological_profiles').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1),
        
        // ALL AI analyses (personality, playbook, relationship_score, sentiment)
        supabase.from('ai_analyses').select('*').eq('profile_id', targetProfileId).order('generated_at', { ascending: false }),
        
        // Media analyses with rich intelligence
        sections.find(s => s.id === 'mediaIntel')?.enabled
          ? supabase.from('media_analyses').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(10)
          : { data: [] },
        
        // Media items with AI metadata
        sections.find(s => s.id === 'mediaIntel')?.enabled
          ? supabase.from('media').select('id, caption, ai_metadata, completed_analysis_modes, created_at').eq('profile_id', targetProfileId).not('ai_metadata', 'is', null).limit(20)
          : { data: [] },
      ]);

      // Create PDF
      const doc = new jsPDF();
      let yPos = 20;
      const lineHeight = 7;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Helper function for page breaks
      const checkPageBreak = (neededSpace: number) => {
        if (yPos > 280 - neededSpace) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Intelligence Dossier', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(16);
      doc.text(contactName, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128);
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0);
      yPos += 20;

      // Overview Section
      if (sections.find(s => s.id === 'overview')?.enabled) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Contact Overview', 20, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const overviewData = [
          ['Organization', profile.organization || 'N/A'],
          ['Job Title', profile.job_title || 'N/A'],
          ['Relationship', profile.relationship_type || 'N/A'],
        ];

        overviewData.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`${label}:`, 20, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(String(value), 60, yPos);
          yPos += lineHeight;
        });

        if (profile.notes) {
          yPos += lineHeight;
          doc.setFont('helvetica', 'bold');
          doc.text('Notes:', 20, yPos);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          const noteLines = doc.splitTextToSize(profile.notes, pageWidth - 40);
          doc.text(noteLines, 20, yPos);
          yPos += noteLines.length * lineHeight;
        }

        yPos += 10;
      }

      // Psychological Profile Section
      if (sections.find(s => s.id === 'psychological')?.enabled && psychData.data && psychData.data.length > 0) {
        checkPageBreak(80);
        
        const psych = psychData.data[0] as any;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Psychological Profile', 20, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Attachment Style
        if (psych.attachment_style) {
          const style = psych.attachment_style as any;
          doc.setFont('helvetica', 'bold');
          doc.text(`Primary Style: ${style.primary_style || 'Unknown'}`, 20, yPos);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          doc.text(`Anxiety Score: ${style.anxiety_score || 0}%`, 25, yPos);
          yPos += lineHeight;
          doc.text(`Avoidance Score: ${style.avoidance_score || 0}%`, 25, yPos);
          yPos += lineHeight * 2;
        }

        // Vulnerabilities
        const vulnerabilities = psych.vulnerabilities || psych.vulnerability_map;
        if (vulnerabilities && Array.isArray(vulnerabilities) && vulnerabilities.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Identified Vulnerabilities:', 20, yPos);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          vulnerabilities.slice(0, 5).forEach((vuln: string) => {
            const lines = doc.splitTextToSize(`• ${vuln}`, pageWidth - 50);
            doc.text(lines, 25, yPos);
            yPos += lines.length * lineHeight;
          });
          yPos += lineHeight;
        }

        // Leverage Points
        const leveragePoints = psych.leverage_points || psych.influence_vectors;
        if (leveragePoints && Array.isArray(leveragePoints) && leveragePoints.length > 0) {
          checkPageBreak(40);
          doc.setFont('helvetica', 'bold');
          doc.text('Leverage Points:', 20, yPos);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          leveragePoints.slice(0, 5).forEach((lp: string) => {
            const lines = doc.splitTextToSize(`• ${lp}`, pageWidth - 50);
            doc.text(lines, 25, yPos);
            yPos += lines.length * lineHeight;
          });
        }

        yPos += 10;
      }

      // Relationship Intelligence Section
      const relationshipAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'relationship_score');
      if (sections.find(s => s.id === 'relationship')?.enabled && relationshipAnalysis) {
        checkPageBreak(100);
        
        const result = relationshipAnalysis.result as any;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Relationship Intelligence', 20, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(12);
        doc.text(`Score: ${result.score || 0}/100 (Grade: ${result.grade || 'N/A'})`, 20, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Factors
        if (result.factors && Array.isArray(result.factors)) {
          doc.setFont('helvetica', 'bold');
          doc.text('Relationship Factors:', 20, yPos);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          result.factors.forEach((factor: any) => {
            doc.text(`• ${factor.name}: ${factor.score}%`, 25, yPos);
            yPos += lineHeight;
          });
          yPos += lineHeight;
        }

        // Strengths
        if (result.strengths && Array.isArray(result.strengths) && result.strengths.length > 0) {
          checkPageBreak(40);
          doc.setFont('helvetica', 'bold');
          doc.text('Strengths:', 20, yPos);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          result.strengths.slice(0, 5).forEach((s: string) => {
            const lines = doc.splitTextToSize(`• ${s}`, pageWidth - 50);
            doc.text(lines, 25, yPos);
            yPos += lines.length * lineHeight;
          });
        }

        // Areas for Improvement
        if (result.areasForImprovement && Array.isArray(result.areasForImprovement) && result.areasForImprovement.length > 0) {
          checkPageBreak(40);
          doc.setFont('helvetica', 'bold');
          doc.text('Areas for Improvement:', 20, yPos);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          result.areasForImprovement.slice(0, 5).forEach((area: string) => {
            const lines = doc.splitTextToSize(`• ${area}`, pageWidth - 50);
            doc.text(lines, 25, yPos);
            yPos += lines.length * lineHeight;
          });
        }

        yPos += 10;
      }

      // Engagement Playbook Section
      const playbookAnalysis = allAnalyses.data?.find((a: any) => a.analysis_type === 'playbook');
      if (sections.find(s => s.id === 'playbook')?.enabled && playbookAnalysis) {
        checkPageBreak(120);
        
        const result = playbookAnalysis.result as any;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Engagement Playbook', 20, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(10);

        // Things to Remember
        if (result.thingsToRemember && Array.isArray(result.thingsToRemember)) {
          doc.setFont('helvetica', 'bold');
          doc.text('Key Things to Remember:', 20, yPos);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          result.thingsToRemember.slice(0, 8).forEach((item: string) => {
            checkPageBreak(15);
            const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 50);
            doc.text(lines, 25, yPos);
            yPos += lines.length * lineHeight;
          });
          yPos += lineHeight;
        }

        // Conversation Starters
        if (result.conversationStarters && Array.isArray(result.conversationStarters)) {
          checkPageBreak(60);
          doc.setFont('helvetica', 'bold');
          doc.text('Conversation Starters:', 20, yPos);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          result.conversationStarters.slice(0, 5).forEach((starter: string) => {
            checkPageBreak(20);
            const lines = doc.splitTextToSize(`"${starter}"`, pageWidth - 50);
            doc.text(lines, 25, yPos);
            yPos += lines.length * lineHeight + 2;
          });
          yPos += lineHeight;
        }

        // Topics to Avoid
        if (result.topicsToAvoid && Array.isArray(result.topicsToAvoid) && result.topicsToAvoid.length > 0) {
          checkPageBreak(40);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 0, 0);
          doc.text('Topics to Avoid:', 20, yPos);
          doc.setTextColor(0);
          yPos += lineHeight;
          doc.setFont('helvetica', 'normal');
          result.topicsToAvoid.slice(0, 5).forEach((topic: string) => {
            doc.text(`⚠ ${topic}`, 25, yPos);
            yPos += lineHeight;
          });
        }

        yPos += 10;
      }

      // Media Intelligence Section
      if (sections.find(s => s.id === 'mediaIntel')?.enabled) {
        const hasMediaAnalyses = mediaAnalyses.data && mediaAnalyses.data.length > 0;
        const hasMediaMetadata = mediaData.data && mediaData.data.length > 0;
        
        if (hasMediaAnalyses || hasMediaMetadata) {
          checkPageBreak(100);
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Media Intelligence', 20, yPos);
          yPos += lineHeight * 2;

          doc.setFontSize(10);

          // Key Insights from Media Analyses
          if (hasMediaAnalyses) {
            const allInsights: string[] = [];
            const allRedFlags: string[] = [];
            
            mediaAnalyses.data.forEach((ma: any) => {
              if (ma.key_insights) allInsights.push(...ma.key_insights);
              if (ma.red_flags) allRedFlags.push(...ma.red_flags);
            });

            if (allInsights.length > 0) {
              doc.setFont('helvetica', 'bold');
              doc.text('Key Insights from Media:', 20, yPos);
              yPos += lineHeight;
              doc.setFont('helvetica', 'normal');
              
              // Deduplicate and limit
              const uniqueInsights = [...new Set(allInsights)].filter(i => 
                !i.includes('extraction failed')
              ).slice(0, 8);
              
              uniqueInsights.forEach((insight: string) => {
                checkPageBreak(20);
                const lines = doc.splitTextToSize(`• ${insight}`, pageWidth - 50);
                doc.text(lines, 25, yPos);
                yPos += lines.length * lineHeight;
              });
              yPos += lineHeight;
            }

            if (allRedFlags.length > 0) {
              checkPageBreak(40);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(180, 0, 0);
              doc.text('Red Flags from Media Analysis:', 20, yPos);
              doc.setTextColor(0);
              yPos += lineHeight;
              doc.setFont('helvetica', 'normal');
              
              [...new Set(allRedFlags)].slice(0, 5).forEach((flag: string) => {
                const lines = doc.splitTextToSize(`⚠ ${flag}`, pageWidth - 50);
                doc.text(lines, 25, yPos);
                yPos += lines.length * lineHeight;
              });
              yPos += lineHeight;
            }
          }

          // AI Metadata Summary from Media Items
          if (hasMediaMetadata) {
            checkPageBreak(60);
            doc.setFont('helvetica', 'bold');
            doc.text(`Analyzed Media Items: ${mediaData.data.length}`, 20, yPos);
            yPos += lineHeight * 2;

            doc.setFont('helvetica', 'normal');
            
            // Collect intelligence from ai_metadata
            const professionCues: string[] = [];
            const sceneDescriptions: string[] = [];
            
            mediaData.data.forEach((m: any) => {
              const meta = m.ai_metadata;
              if (meta?.intelligence?.profession_cues) {
                professionCues.push(...meta.intelligence.profession_cues);
              }
              if (meta?.ai_description) {
                sceneDescriptions.push(meta.ai_description);
              }
            });

            if (professionCues.length > 0) {
              doc.setFont('helvetica', 'bold');
              doc.text('Profession/Context Indicators:', 20, yPos);
              yPos += lineHeight;
              doc.setFont('helvetica', 'normal');
              [...new Set(professionCues)].slice(0, 6).forEach((cue: string) => {
                const lines = doc.splitTextToSize(`• ${cue}`, pageWidth - 50);
                doc.text(lines, 25, yPos);
                yPos += lines.length * lineHeight;
              });
              yPos += lineHeight;
            }

            // Scene summaries
            if (sceneDescriptions.length > 0) {
              checkPageBreak(60);
              doc.setFont('helvetica', 'bold');
              doc.text('Scene Analysis Highlights:', 20, yPos);
              yPos += lineHeight;
              doc.setFont('helvetica', 'normal');
              
              sceneDescriptions.slice(0, 3).forEach((desc: string) => {
                checkPageBreak(25);
                const lines = doc.splitTextToSize(`• ${desc}`, pageWidth - 50);
                doc.text(lines, 25, yPos);
                yPos += lines.length * lineHeight + 2;
              });
            }
          }

          yPos += 10;
        }
      }

      // Action Plans Section
      if (sections.find(s => s.id === 'actionPlans')?.enabled && psychData.data && psychData.data.length > 0) {
        const actionPlans = psychData.data[0].action_plans as any;
        
        if (actionPlans) {
          checkPageBreak(100);
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Strategic Action Plans', 20, yPos);
          yPos += lineHeight * 2;

          doc.setFontSize(10);

          const renderActionList = (title: string, actions: any[], color: [number, number, number]) => {
            if (!actions || actions.length === 0) return;
            
            checkPageBreak(40);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...color);
            doc.text(title, 20, yPos);
            doc.setTextColor(0);
            yPos += lineHeight;
            
            actions.slice(0, 5).forEach((action: any) => {
              checkPageBreak(25);
              doc.setFont('helvetica', 'bold');
              doc.text(`[${action.priority?.toUpperCase() || 'NORMAL'}] ${action.title}`, 25, yPos);
              yPos += lineHeight;
              
              if (action.description) {
                doc.setFont('helvetica', 'normal');
                const lines = doc.splitTextToSize(action.description, pageWidth - 55);
                doc.text(lines, 30, yPos);
                yPos += lines.length * lineHeight + 3;
              }
            });
            
            yPos += lineHeight;
          };

          renderActionList('Immediate Actions (Critical)', actionPlans.immediate, [180, 0, 0]);
          renderActionList('Short-Term Actions', actionPlans.short_term, [180, 100, 0]);
          renderActionList('Long-Term Actions', actionPlans.long_term, [0, 100, 0]);

          yPos += 10;
        }
      }

      // Timeline Section
      if (sections.find(s => s.id === 'timeline')?.enabled && commData.data && commData.data.length > 0) {
        checkPageBreak(60);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Interactions', 20, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(9);
        commData.data.slice(0, 10).forEach((comm: any) => {
          checkPageBreak(20);

          const date = format(new Date(comm.occurred_at), 'MMM d, yyyy');
          doc.setFont('helvetica', 'bold');
          doc.text(`${date} - ${comm.channel}`, 20, yPos);
          yPos += lineHeight;

          if (comm.subject) {
            doc.setFont('helvetica', 'normal');
            doc.text(comm.subject.substring(0, 80), 25, yPos);
            yPos += lineHeight;
          }
          yPos += 3;
        });

        yPos += 10;
      }

      // Analysis Section
      if (sections.find(s => s.id === 'analysis')?.enabled && analysisData.data && analysisData.data.length > 0) {
        checkPageBreak(60);

        const analysis = analysisData.data[0];
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Behavioral Analysis', 20, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        if (analysis.behavioral_patterns) {
          const patterns = typeof analysis.behavioral_patterns === 'string' 
            ? analysis.behavioral_patterns 
            : JSON.stringify(analysis.behavioral_patterns, null, 2);
          const patternLines = doc.splitTextToSize(patterns.substring(0, 500), pageWidth - 40);
          doc.text(patternLines, 20, yPos);
          yPos += patternLines.length * lineHeight;
        }

        yPos += 10;
      }

      // Trust Assessment Section
      if (sections.find(s => s.id === 'trust')?.enabled && trustData.data && trustData.data.length > 0) {
        checkPageBreak(40);

        const trust = trustData.data[0];
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Trust Assessment', 20, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        if (trust.result) {
          const result = typeof trust.result === 'object' ? trust.result : {};
          const trustScore = (result as any).overallTrustScore || (result as any).trust_score;
          if (trustScore) {
            doc.text(`Overall Trust Score: ${trustScore}%`, 20, yPos);
            yPos += lineHeight * 2;
          }
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
        doc.text('CONFIDENTIAL - PICS Intelligence System', pageWidth / 2, 295, { align: 'center' });
      }

      // Save
      const fileName = `dossier-${contactName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      toast.success('Dossier generated successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate dossier');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Dossier Generator
        </CardTitle>
        <CardDescription>
          Generate a comprehensive PDF dossier with psychological profile, media intelligence, and action plans
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
          <Label>Include Sections</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={section.enabled}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <Label htmlFor={section.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {section.label}
                  </Label>
                </div>
              );
            })}
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
              Generating Comprehensive Dossier...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate PDF Dossier
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
