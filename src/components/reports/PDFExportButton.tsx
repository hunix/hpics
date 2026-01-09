import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, Image, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface PDFExportButtonProps {
  title: string;
  data: Record<string, any>[];
  columns?: { key: string; label: string }[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PDFExportButton({
  title,
  data,
  columns,
  variant = 'outline',
  size = 'sm',
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text(title, pageWidth / 2, 20, { align: 'center' });
      
      // Date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
      
      // Content
      let yPosition = 40;
      doc.setFontSize(11);
      doc.setTextColor(40);

      const cols = columns || Object.keys(data[0] || {}).map(k => ({ key: k, label: k }));
      
      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPosition - 5, pageWidth - 28, 8, 'F');
      doc.setFont('helvetica', 'bold');
      
      const colWidth = (pageWidth - 28) / cols.length;
      cols.forEach((col, i) => {
        doc.text(col.label, 16 + i * colWidth, yPosition, { maxWidth: colWidth - 4 });
      });
      
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      
      // Table rows
      data.forEach((row, rowIndex) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(14, yPosition - 5, pageWidth - 28, 8, 'F');
        }
        
        cols.forEach((col, i) => {
          const value = String(row[col.key] ?? '');
          doc.text(value.substring(0, 30), 16 + i * colWidth, yPosition, { maxWidth: colWidth - 4 });
        });
        
        yPosition += 8;
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      }
      
      doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    try {
      const cols = columns || Object.keys(data[0] || {}).map(k => ({ key: k, label: k }));
      const headers = cols.map(c => c.label).join(',');
      const rows = data.map(row => 
        cols.map(col => {
          const val = String(row[col.key] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        }).join(',')
      );
      
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const exportToJSON = () => {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('JSON exported successfully');
    } catch (error) {
      toast.error('Failed to export JSON');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting || data.length === 0}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {size !== 'icon' && <span className="ml-2">Export</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToJSON}>
          <Image className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
