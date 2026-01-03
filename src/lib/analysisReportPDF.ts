import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface AnalysisData {
  behavioral?: any;
  facial?: any;
  bodyLanguage?: any;
  vocal?: any;
}

interface ContactInfo {
  firstName: string;
  lastName?: string;
  organization?: string;
  jobTitle?: string;
}

interface ReportMetadata {
  contact: ContactInfo;
  analysisDate: Date;
  contextType: string;
  analysisMode: string;
  totalDuration: number;
  totalCost: number;
}

export async function generateAnalysisReportPDF(
  analyses: AnalysisData,
  metadata: ReportMetadata
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper functions
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    
    // Check if we need a new page
    const lineHeight = fontSize * 0.5;
    if (yPos + (lines.length * lineHeight) > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.text(lines, margin, yPos);
    yPos += lines.length * lineHeight + 4;
  };

  const addSection = (title: string) => {
    yPos += 8;
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(margin, yPos - 5, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 4, yPos + 2);
    doc.setTextColor(0, 0, 0);
    yPos += 15;
  };

  const addKeyValue = (key: string, value: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${key}:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 50, yPos);
    yPos += 6;
  };

  const addBulletList = (items: string[]) => {
    items.forEach(item => {
      if (yPos > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPos = margin;
      }
      doc.setFontSize(10);
      doc.text(`• ${item}`, margin + 4, yPos);
      yPos += 5;
    });
  };

  // Title
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Behavioral Analysis Report', margin, 28);
  doc.setTextColor(0, 0, 0);
  yPos = 55;

  // Contact Info
  addSection('Contact Information');
  addKeyValue('Name', `${metadata.contact.firstName} ${metadata.contact.lastName || ''}`);
  if (metadata.contact.organization) {
    addKeyValue('Organization', metadata.contact.organization);
  }
  if (metadata.contact.jobTitle) {
    addKeyValue('Position', metadata.contact.jobTitle);
  }
  addKeyValue('Analysis Date', format(metadata.analysisDate, 'PPP'));
  addKeyValue('Context', metadata.contextType === 'screening' ? 'Screening Video' : 'Interview Video');
  addKeyValue('Mode', metadata.analysisMode === 'mosaic' ? 'Temporal Mosaic' : 'Video Analysis');
  addKeyValue('Duration', `${Math.round(metadata.totalDuration / 1000)}s`);
  addKeyValue('Cost', `$${(metadata.totalCost / 100).toFixed(4)}`);

  // Behavioral Analysis
  if (analyses.behavioral) {
    addSection('Behavioral Analysis');
    const behavioral = analyses.behavioral;
    
    if (behavioral.personality_indicators) {
      addText('Personality Indicators:', 11, true);
      const indicators = typeof behavioral.personality_indicators === 'object' 
        ? Object.entries(behavioral.personality_indicators).map(([k, v]) => `${k}: ${v}`)
        : [String(behavioral.personality_indicators)];
      addBulletList(indicators);
    }
    
    if (behavioral.behavioral_patterns) {
      addText('Behavioral Patterns:', 11, true);
      const patterns = Array.isArray(behavioral.behavioral_patterns)
        ? behavioral.behavioral_patterns.map(String)
        : [String(behavioral.behavioral_patterns)];
      addBulletList(patterns);
    }
    
    if (behavioral.confidence_score) {
      addKeyValue('Confidence Score', `${(behavioral.confidence_score * 100).toFixed(1)}%`);
    }
  }

  // Facial Analysis
  if (analyses.facial) {
    addSection('Facial Analysis');
    const facial = analyses.facial;
    
    if (facial.emotional_timeline) {
      addText('Emotional Timeline:', 11, true);
      const timeline = Array.isArray(facial.emotional_timeline)
        ? facial.emotional_timeline.map((e: any) => `${e.time || 'N/A'}: ${e.emotion || e}`)
        : [String(facial.emotional_timeline)];
      addBulletList(timeline);
    }
    
    if (facial.micro_expressions) {
      addText('Micro-Expressions Detected:', 11, true);
      const expressions = Array.isArray(facial.micro_expressions)
        ? facial.micro_expressions.map(String)
        : [String(facial.micro_expressions)];
      addBulletList(expressions);
    }
    
    if (facial.stress_indicators) {
      addText('Stress Indicators:', 11, true);
      const stress = Array.isArray(facial.stress_indicators)
        ? facial.stress_indicators.map(String)
        : [String(facial.stress_indicators)];
      addBulletList(stress);
    }
    
    if (facial.confidence_score) {
      addKeyValue('Confidence Score', `${(facial.confidence_score * 100).toFixed(1)}%`);
    }
  }

  // Body Language Analysis
  if (analyses.bodyLanguage) {
    addSection('Body Language Analysis');
    const body = analyses.bodyLanguage;
    
    if (body.posture_analysis) {
      addText('Posture Analysis:', 11, true);
      const posture = typeof body.posture_analysis === 'object'
        ? Object.entries(body.posture_analysis).map(([k, v]) => `${k}: ${v}`)
        : [String(body.posture_analysis)];
      addBulletList(posture);
    }
    
    if (body.gesture_patterns) {
      addText('Gesture Patterns:', 11, true);
      const gestures = Array.isArray(body.gesture_patterns)
        ? body.gesture_patterns.map(String)
        : [String(body.gesture_patterns)];
      addBulletList(gestures);
    }
    
    if (body.comfort_indicators) {
      addText('Comfort Indicators:', 11, true);
      const comfort = Array.isArray(body.comfort_indicators)
        ? body.comfort_indicators.map(String)
        : [String(body.comfort_indicators)];
      addBulletList(comfort);
    }
    
    if (body.confidence_score) {
      addKeyValue('Confidence Score', `${(body.confidence_score * 100).toFixed(1)}%`);
    }
  }

  // Vocal Analysis
  if (analyses.vocal) {
    addSection('Vocal Analysis');
    const vocal = analyses.vocal;
    
    if (vocal.speech_patterns) {
      addText('Speech Patterns:', 11, true);
      const patterns = typeof vocal.speech_patterns === 'object'
        ? Object.entries(vocal.speech_patterns).map(([k, v]) => `${k}: ${v}`)
        : [String(vocal.speech_patterns)];
      addBulletList(patterns);
    }
    
    if (vocal.stress_points) {
      addText('Stress Points:', 11, true);
      const stress = Array.isArray(vocal.stress_points)
        ? vocal.stress_points.map(String)
        : [String(vocal.stress_points)];
      addBulletList(stress);
    }
    
    if (vocal.mood_changes) {
      addText('Mood Changes:', 11, true);
      const moods = Array.isArray(vocal.mood_changes)
        ? vocal.mood_changes.map(String)
        : [String(vocal.mood_changes)];
      addBulletList(moods);
    }
    
    if (vocal.hesitation_markers) {
      addText('Hesitation Markers:', 11, true);
      const hesitations = Array.isArray(vocal.hesitation_markers)
        ? vocal.hesitation_markers.map(String)
        : [String(vocal.hesitation_markers)];
      addBulletList(hesitations);
    }
    
    if (vocal.confidence_score) {
      addKeyValue('Confidence Score', `${(vocal.confidence_score * 100).toFixed(1)}%`);
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by RelationshipCRM • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}
