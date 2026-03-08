import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateAnalysisReportPDF } from '@/lib/analysisReportPDF';
import { Download, Loader2, FileText } from 'lucide-react';

interface AnalysisExportProps {
  profileId: string;
  contactName: string;
  contactOrganization?: string;
  contactJobTitle?: string;
  analysisMode: string;
  contextType: string;
  totalDuration: number;
  totalCost: number;
}

export function AnalysisExport({
  profileId,
  contactName,
  contactOrganization,
  contactJobTitle,
  analysisMode,
  contextType,
  totalDuration,
  totalCost,
}: AnalysisExportProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Fetch all analyses for this profile
      const [behavioralRes, facialRes, bodyLanguageRes, vocalRes] = await Promise.all([
        supabase
          .from('behavioral_analyses')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('facial_analyses')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('body_language_analyses')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('vocal_analyses')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ]);

      const analyses = {
        behavioral: behavioralRes.data,
        facial: facialRes.data,
        bodyLanguage: bodyLanguageRes.data,
        vocal: vocalRes.data,
      };

      // Check if we have any analyses
      if (!analyses.behavioral && !analyses.facial && !analyses.bodyLanguage && !analyses.vocal) {
        toast({ 
          title: 'No analyses found', 
          description: 'Run some analyses first before exporting a report.',
          variant: 'destructive' 
        });
        return;
      }

      const [firstName, ...lastNameParts] = contactName.split(' ');
      const lastName = lastNameParts.join(' ');

      const pdfBlob = await generateAnalysisReportPDF(analyses, {
        contact: {
          firstName,
          lastName,
          organization: contactOrganization,
          jobTitle: contactJobTitle,
        },
        analysisDate: new Date(),
        contextType,
        analysisMode,
        totalDuration,
        totalCost,
      });

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-report-${firstName}-${lastName || 'contact'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Report exported successfully' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: 'Export failed', 
        description: error instanceof Error ? error.message : String(error), 
        variant: 'destructive' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting}
      variant="outline"
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Export Report
        </>
      )}
    </Button>
  );
}
