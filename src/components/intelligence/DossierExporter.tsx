import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface DossierData {
  contact: {
    first_name: string;
    last_name: string | null;
    organization: string | null;
    title: string | null;
  };
  generated_at: string;
  content: any;
  classification?: string;
}

interface DossierExporterProps {
  dossier: DossierData;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DossierExporter({ dossier, variant = 'outline', size = 'sm' }: DossierExporterProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [format_, setFormat] = useState<'pdf' | 'markdown'>('pdf');
  const [includeClassification, setIncludeClassification] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [redactSensitive, setRedactSensitive] = useState(false);

  const contactName = `${dossier.contact.first_name} ${dossier.contact.last_name || ''}`.trim();

  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header with classification
    if (includeClassification && dossier.classification) {
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text(dossier.classification.toUpperCase(), pageWidth / 2, 10, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INTELLIGENCE DOSSIER', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Subject name
    doc.setFontSize(18);
    doc.text(contactName, pageWidth / 2, y, { align: 'center' });
    y += 10;

    if (dossier.contact.organization) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(dossier.contact.organization, pageWidth / 2, y, { align: 'center' });
      y += 8;
    }

    // Timestamp
    if (includeTimestamp) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${format(new Date(dossier.generated_at), 'PPpp')}`, pageWidth / 2, y, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y += 15;
    }

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Content sections
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const content = dossier.content;

    const addSection = (title: string, text: string | string[]) => {
      if (!text || (Array.isArray(text) && text.length === 0)) return;

      // Check if we need a new page
      if (y > 260) {
        doc.addPage();
        y = 20;
        if (includeClassification && dossier.classification) {
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text(dossier.classification.toUpperCase(), pageWidth / 2, 10, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(title, margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const textContent = Array.isArray(text) ? text.join('\n• ') : text;
      const processedText = redactSensitive ? redactText(textContent) : textContent;
      
      const lines = doc.splitTextToSize(
        Array.isArray(text) ? '• ' + processedText : processedText,
        pageWidth - 2 * margin
      );
      
      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 5;
      });

      y += 5;
    };

    // Add dossier sections
    if (content.executive_summary) {
      addSection('EXECUTIVE SUMMARY', content.executive_summary);
    }

    if (content.background) {
      addSection('BACKGROUND', content.background);
    }

    if (content.psychological_profile) {
      addSection('PSYCHOLOGICAL PROFILE', content.psychological_profile);
    }

    if (content.communication_patterns) {
      addSection('COMMUNICATION PATTERNS', content.communication_patterns);
    }

    if (content.network_analysis) {
      addSection('NETWORK ANALYSIS', content.network_analysis);
    }

    if (content.risk_assessment) {
      addSection('RISK ASSESSMENT', content.risk_assessment);
    }

    if (content.opportunities) {
      addSection('OPPORTUNITIES', content.opportunities);
    }

    if (content.recommendations) {
      addSection('RECOMMENDATIONS', 
        Array.isArray(content.recommendations) 
          ? content.recommendations 
          : [content.recommendations]
      );
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      if (includeClassification && dossier.classification) {
        doc.setTextColor(255, 0, 0);
        doc.text(dossier.classification.toUpperCase(), pageWidth / 2, 295, { align: 'center' });
      }
    }

    return doc;
  };

  const generateMarkdown = () => {
    const content = dossier.content;
    let md = '';

    if (includeClassification && dossier.classification) {
      md += `**${dossier.classification.toUpperCase()}**\n\n`;
    }

    md += `# Intelligence Dossier: ${contactName}\n\n`;

    if (dossier.contact.organization) {
      md += `**Organization:** ${dossier.contact.organization}\n\n`;
    }

    if (includeTimestamp) {
      md += `*Generated: ${format(new Date(dossier.generated_at), 'PPpp')}*\n\n`;
    }

    md += '---\n\n';

    const addSection = (title: string, text: string | string[]) => {
      if (!text || (Array.isArray(text) && text.length === 0)) return;
      
      md += `## ${title}\n\n`;
      
      const textContent = Array.isArray(text) 
        ? text.map(t => `- ${redactSensitive ? redactText(t) : t}`).join('\n')
        : (redactSensitive ? redactText(text) : text);
      
      md += textContent + '\n\n';
    };

    if (content.executive_summary) addSection('Executive Summary', content.executive_summary);
    if (content.background) addSection('Background', content.background);
    if (content.psychological_profile) addSection('Psychological Profile', content.psychological_profile);
    if (content.communication_patterns) addSection('Communication Patterns', content.communication_patterns);
    if (content.network_analysis) addSection('Network Analysis', content.network_analysis);
    if (content.risk_assessment) addSection('Risk Assessment', content.risk_assessment);
    if (content.opportunities) addSection('Opportunities', content.opportunities);
    if (content.recommendations) addSection('Recommendations', content.recommendations);

    return md;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const filename = `dossier_${contactName.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}`;

      if (format_ === 'pdf') {
        const doc = await generatePDF();
        doc.save(`${filename}.pdf`);
      } else {
        const md = generateMarkdown();
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`Dossier exported as ${format_.toUpperCase()}`);
      setOpen(false);
    } catch (error) {
      toast.error('Export failed: ' + (error as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Dossier
          </DialogTitle>
          <DialogDescription>
            Export the dossier for {contactName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format_} onValueChange={(v) => setFormat(v as 'pdf' | 'markdown')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="classification" 
                checked={includeClassification}
                onCheckedChange={(c) => setIncludeClassification(c === true)}
              />
              <label htmlFor="classification" className="text-sm">
                Include classification markings
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="timestamp" 
                checked={includeTimestamp}
                onCheckedChange={(c) => setIncludeTimestamp(c === true)}
              />
              <label htmlFor="timestamp" className="text-sm">
                Include generation timestamp
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="redact" 
                checked={redactSensitive}
                onCheckedChange={(c) => setRedactSensitive(c === true)}
              />
              <label htmlFor="redact" className="text-sm">
                Redact sensitive information
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Export {format_.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function redactText(text: string): string {
  // Redact emails
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]');
  
  // Redact phone numbers
  text = text.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE REDACTED]');
  
  // Redact addresses (basic pattern)
  text = text.replace(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)[,.]?\s*[A-Za-z\s]*,?\s*[A-Z]{2}\s*\d{5}/gi, '[ADDRESS REDACTED]');
  
  return text;
}
