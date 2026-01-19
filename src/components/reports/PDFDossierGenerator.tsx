import { useState, useCallback } from 'react';
import { FileText, Download, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ScalableContactSearch } from '@/components/contacts/ScalableContactSearch';

// Import modular types, sections, and hooks
import { 
  DossierSection, 
  DossierTemplate, 
  DataStats,
} from './sections/types';
import { DEFAULT_SECTIONS, applySectionTemplate } from './sections/sectionDefinitions';
import { useDossierData, type DossierDataResult } from './hooks/useDossierData';
import { useIntelligenceGeneration } from './hooks/useIntelligenceGeneration';
import { 
  createPDFDocument, 
  renderCoverPage, 
  addPageFooters,
  type PDFContext 
} from './hooks/usePDFGeneration';
import { allSectionRenderers } from './sections/renderers';

interface PDFDossierGeneratorProps {
  profileId?: string;
  profileName?: string;
}

export function PDFDossierGenerator({ profileId, profileName }: PDFDossierGeneratorProps) {
  // Version logging for cache debugging
  console.log('[PDFDossierGenerator] v5.1.0 - Fully Modularized - 64 Sections via Renderers');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(profileId || null);
  const [selectedContactName, setSelectedContactName] = useState<string>(profileName || '');
  const [template, setTemplate] = useState<DossierTemplate>('full');
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  
  // Use modular section definitions
  const [sections, setSections] = useState<DossierSection[]>(DEFAULT_SECTIONS);

  // Use modular hooks
  const { fetchAllDossierData } = useDossierData();
  const { 
    isGeneratingIntel, 
    intelProgress, 
    taskResults, 
    generateFullIntelligence, 
    retryTask 
  } = useIntelligenceGeneration();

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
    setSections(applySectionTemplate(sections, templateType));
  };

  const handleGenerateIntelligence = useCallback(() => {
    const targetProfileId = profileId || selectedProfile;
    if (targetProfileId) {
      generateFullIntelligence(targetProfileId);
    } else {
      toast.error('Please select a contact first');
    }
  }, [profileId, selectedProfile, generateFullIntelligence]);

  const handleRetryTask = useCallback((taskName: string) => {
    const targetProfileId = profileId || selectedProfile;
    if (targetProfileId) {
      retryTask(taskName, targetProfileId);
    }
  }, [profileId, selectedProfile, retryTask]);

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

      // Use modular data fetching hook
      const allData = await fetchAllDossierData(targetProfileId!);

      // Create PDF with modular helper
      const { doc, context } = createPDFDocument();

      // Calculate intelligence completeness
      const totalMediaAnalyzed = allData.mediaData?.length || 0;
      const totalVoiceSessions = allData.voiceData?.length || 0;
      const totalAnomalies = allData.anomaliesData?.length || 0;
      const hasBehavioralDna = allData.allAnalyses?.some((a: Record<string, unknown>) => a.analysis_type === 'behavioral_dna');
      const intelligenceCompleteness = Math.min(100, (
        (totalMediaAnalyzed > 0 ? 15 : 0) + 
        (totalVoiceSessions > 0 ? 15 : 0) + 
        (allData.psychData?.length ? 20 : 0) + 
        (allData.miceData?.length ? 15 : 0) + 
        (allData.influenceData ? 15 : 0) + 
        (hasBehavioralDna ? 20 : 0)
      ));

      // Render cover page
      renderCoverPage(
        doc, 
        contactName, 
        profile.organization, 
        template, 
        sections.filter(s => s.enabled).length,
        intelligenceCompleteness,
        totalAnomalies
      );

      // Render Table of Contents
      doc.addPage();
      context.yPos = context.margin;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TABLE OF CONTENTS', context.margin, context.yPos);
      context.yPos += 12;
      
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
        doc.text(`${idx + 1}. ${section.label}`, context.margin, context.yPos);
        doc.text(`${section.category.toUpperCase()}`, context.margin + 120, context.yPos);
        doc.setTextColor(0);
        context.yPos += 6;
        if (context.yPos > context.maxContentY - 20) {
          doc.addPage();
          context.yPos = context.margin;
        }
      });
      
      doc.addPage();
      context.yPos = context.margin;

      // Render each enabled section using modular renderers
      for (const section of enabledSections) {
        const renderer = allSectionRenderers[section.id];
        if (renderer) {
          try {
            renderer(context, allData);
          } catch (err) {
            console.warn(`[PDFDossierGenerator] Section ${section.id} render error:`, err);
            // Continue with next section
          }
        }
      }

      // Add footers to all pages
      addPageFooters(doc, contactName);

      // Save
      const fileName = `intelligence-dossier-${contactName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
      doc.save(fileName);

      const pageCount = doc.getNumberOfPages();
      toast.success(`Intelligence dossier generated: ${pageCount} pages, ${enabledSections.length} sections`);
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
              <Badge variant="secondary" className="text-[10px] font-mono bg-primary/10">
                v5.1 | 64 Sections | Modular
              </Badge>
            </CardTitle>
            <CardDescription>
              Generate comprehensive 64-section dossiers with Data Fusion Engines, Digital Twins, Temporal Transformers, and Shadow Network Analysis
            </CardDescription>
          </div>
          {dataStats && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">📷 {dataStats.media} Media</Badge>
              <Badge variant="outline" className="text-xs">🎙️ {dataStats.voice} Voice</Badge>
              <Badge variant="outline" className="text-xs">🧠 {dataStats.analyses} Analyses</Badge>
              <Badge variant="secondary" className="text-xs">📊 {dataStats.sources} Total Sources</Badge>
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
                <SelectItem value="full">Full Intelligence Package (Complete - All 64 Sections)</SelectItem>
                <SelectItem value="surveillance">Surveillance Report (Media Focus)</SelectItem>
                <SelectItem value="warfare">Warfare Assessment (MICE, Cialdini, Sacred Values)</SelectItem>
                <SelectItem value="psychological">Psychological Deep Dive (DNA, Quantum, Behavioral)</SelectItem>
                <SelectItem value="fusion">Data Fusion Analysis (Temporal, Digital Twin, Graph RAG)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Pre-Generation</Label>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleGenerateIntelligence}
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
            {isGeneratingIntel && <Progress value={intelProgress} className="h-1" />}
            
            {taskResults.length > 0 && (
              <div className="mt-3 space-y-1.5 p-3 bg-muted/30 rounded-lg border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Intelligence Tasks</p>
                {taskResults.map((task) => (
                  <div key={task.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {task.status === 'pending' && <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
                      {task.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                      {task.status === 'success' && <div className="h-2 w-2 rounded-full bg-green-500" />}
                      {task.status === 'failed' && <div className="h-2 w-2 rounded-full bg-destructive" />}
                      <span className={task.status === 'failed' ? 'text-destructive' : ''}>{task.name}</span>
                    </div>
                    {task.status === 'failed' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 px-2 text-xs"
                        onClick={() => handleRetryTask(task.name)}
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
            {(['core', 'intelligence', 'warfare', 'analysis'] as const).map((category) => {
              const categorySections = sectionsByCategory[category];
              const colorClasses: Record<string, string> = {
                core: 'text-muted-foreground',
                intelligence: 'text-blue-600',
                warfare: 'text-red-600',
                analysis: 'text-muted-foreground',
              };
              const iconColors: Record<string, string> = {
                core: 'text-muted-foreground',
                intelligence: 'text-blue-500',
                warfare: 'text-red-500',
                analysis: 'text-muted-foreground',
              };
              return (
                <div key={category} className="space-y-3">
                  <p className={`text-xs font-medium mb-2 ${colorClasses[category]}`}>
                    {category.toUpperCase()} ({categorySections.filter(s => s.enabled).length})
                  </p>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {categorySections.map(section => {
                      const Icon = section.icon;
                      return (
                        <div key={section.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={section.id}
                            checked={section.enabled}
                            onCheckedChange={() => toggleSection(section.id)}
                          />
                          <Label htmlFor={section.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <Icon className={`h-3.5 w-3.5 ${iconColors[category]}`} />
                            {section.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
