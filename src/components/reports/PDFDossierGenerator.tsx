import { useState, useCallback } from 'react';
import { FileText, Download, Loader2, User, Calendar, TrendingUp, Shield, Network } from 'lucide-react';
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

interface SelectedContact {
  id: string;
  first_name: string;
  last_name: string | null;
}

export function PDFDossierGenerator({ profileId, profileName }: PDFDossierGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(profileId || null);
  const [selectedContactName, setSelectedContactName] = useState<string>(profileName || '');
  const [sections, setSections] = useState<DossierSection[]>([
    { id: 'overview', label: 'Contact Overview', icon: User, enabled: true },
    { id: 'timeline', label: 'Interaction Timeline', icon: Calendar, enabled: true },
    { id: 'analysis', label: 'Behavioral Analysis', icon: TrendingUp, enabled: true },
    { id: 'trust', label: 'Trust Assessment', icon: Shield, enabled: true },
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

      // Fetch additional data based on selected sections
      const [commData, analysisData, trustData] = await Promise.all([
        sections.find(s => s.id === 'timeline')?.enabled
          ? supabase.from('communications').select('*').eq('profile_id', targetProfileId).order('occurred_at', { ascending: false }).limit(20)
          : { data: [] },
        sections.find(s => s.id === 'analysis')?.enabled
          ? supabase.from('behavioral_analyses').select('*').eq('profile_id', targetProfileId).order('created_at', { ascending: false }).limit(1)
          : { data: [] },
        sections.find(s => s.id === 'trust')?.enabled
          ? supabase.from('ai_analyses').select('*').eq('profile_id', targetProfileId).eq('analysis_type', 'trust_assessment').order('generated_at', { ascending: false }).limit(1)
          : { data: [] },
      ]);

      // Create PDF
      const doc = new jsPDF();
      let yPos = 20;
      const lineHeight = 7;
      const pageWidth = doc.internal.pageSize.getWidth();

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

      // Timeline Section
      if (sections.find(s => s.id === 'timeline')?.enabled && commData.data && commData.data.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Interactions', 20, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(9);
        commData.data.slice(0, 10).forEach((comm: any) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

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
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

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
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Dossier Generator
        </CardTitle>
        <CardDescription>
          Generate a comprehensive PDF dossier for a contact
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!profileId && (
          <div className="space-y-2">
            <Label>Select Contact</Label>
            <ScalableContactSearch
              selectedId={selectedProfile}
              onSelect={handleContactSelect}
              placeholder="Search and select a contact..."
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Include Sections</Label>
          <div className="grid grid-cols-2 gap-3">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={section.enabled}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <Label htmlFor={section.id} className="flex items-center gap-2 cursor-pointer">
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
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
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
