/**
 * Unified Dossier Generator
 * Generates comprehensive intelligence dossiers with all AGIS data
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBiometricPsychFusion } from '@/hooks/intelligence/useBiometricPsychFusion';
import { useMICEAnalysis } from '@/hooks/intelligence/useMICEAnalysis';
import { useBetrayalPrediction } from '@/hooks/intelligence/useBetrayalPrediction';
import { useSacredValues } from '@/hooks/intelligence/useSacredValues';
import { 
  FileText, 
  Download, 
  Shield, 
  Brain, 
  AlertTriangle, 
  Target,
  TrendingUp,
  Users,
  Eye,
  Lock,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';

interface UnifiedDossierGeneratorProps {
  profileId: string;
  profileName?: string;
}

const DOSSIER_SECTIONS = [
  { id: 'executive_summary', label: 'Executive Summary', icon: FileText, description: 'High-level overview and risk assessment' },
  { id: 'biometric_analysis', label: 'Biometric Intelligence', icon: Eye, description: 'Voice, gait, keystroke, and facial analysis' },
  { id: 'psychological_profile', label: 'Psychological Profile', icon: Brain, description: 'Dark Triad, attachment style, and vulnerabilities' },
  { id: 'mice_assessment', label: 'MICE Assessment', icon: Target, description: 'Money, Ideology, Compromise, Ego vulnerabilities' },
  { id: 'betrayal_prediction', label: 'Betrayal Risk Analysis', icon: AlertTriangle, description: 'Trust scores and defection probability' },
  { id: 'sacred_values', label: 'Sacred Values Map', icon: Shield, description: 'Inviolable beliefs and manipulation vectors' },
  { id: 'influence_network', label: 'Influence Network', icon: Users, description: 'Connections and influence paths' },
  { id: 'predictive_intel', label: 'Predictive Intelligence', icon: TrendingUp, description: 'Behavioral predictions and forecasts' },
  { id: 'operational_guidance', label: 'Operational Guidance', icon: Lock, description: 'Recommended approaches and tactics' },
];

export function UnifiedDossierGenerator({ profileId, profileName = 'Target' }: UnifiedDossierGeneratorProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(DOSSIER_SECTIONS.map(s => s.id));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const { fusionProfile, isLoading: fusionLoading } = useBiometricPsychFusion(profileId);
  const { assessment: miceAssessment, isLoading: miceLoading } = useMICEAnalysis(profileId);
  const { prediction: betrayalPrediction, isLoading: betrayalLoading } = useBetrayalPrediction(profileId);
  const { values: sacredValues, isLoading: sacredLoading } = useSacredValues(profileId);

  const isLoading = fusionLoading || miceLoading || betrayalLoading || sacredLoading;

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const generateDossier = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const pdf = new jsPDF();
      let yPos = 20;
      const lineHeight = 7;
      const pageHeight = 280;

      const addPage = () => {
        pdf.addPage();
        yPos = 20;
      };

      const addText = (text: string, options?: { bold?: boolean; size?: number }) => {
        if (yPos > pageHeight) addPage();
        pdf.setFontSize(options?.size || 10);
        if (options?.bold) pdf.setFont('helvetica', 'bold');
        else pdf.setFont('helvetica', 'normal');
        
        const lines = pdf.splitTextToSize(text, 170);
        pdf.text(lines, 20, yPos);
        yPos += lines.length * lineHeight;
      };

      const addSection = (title: string) => {
        if (yPos > pageHeight - 30) addPage();
        yPos += 5;
        addText(title.toUpperCase(), { bold: true, size: 14 });
        yPos += 3;
      };

      // Title Page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INTELLIGENCE DOSSIER', 20, 40);
      pdf.setFontSize(16);
      pdf.text(`Subject: ${profileName}`, 20, 55);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toISOString()}`, 20, 70);
      pdf.text(`Classification: TOP SECRET//AGIS`, 20, 77);
      pdf.text(`Profile ID: ${profileId}`, 20, 84);
      
      setGenerationProgress(10);
      addPage();

      // Executive Summary
      if (selectedSections.includes('executive_summary')) {
        addSection('Executive Summary');
        addText(`This dossier provides comprehensive intelligence analysis on subject "${profileName}".`);
        const overallRisk = fusionProfile?.fusionScore ? (fusionProfile.fusionScore > 0.7 ? 'HIGH' : fusionProfile.fusionScore > 0.4 ? 'MODERATE' : 'LOW') : 'UNKNOWN';
        addText(`Overall Risk Assessment: ${overallRisk}`);
        const miceRecruitment = miceAssessment?.recruitment_likelihood ? `${(miceAssessment.recruitment_likelihood * 100).toFixed(0)}%` : 'Not assessed';
        addText(`MICE Recruitment Likelihood: ${miceRecruitment}`);
        addText(`Betrayal Probability: ${betrayalPrediction?.defection_probability ? `${(betrayalPrediction.defection_probability * 100).toFixed(0)}%` : 'Not assessed'}`);
        yPos += 5;
      }
      setGenerationProgress(25);

      // Biometric Analysis
      if (selectedSections.includes('biometric_analysis') && fusionProfile) {
        addSection('Biometric Intelligence');
        addText(`Voice Stress Index: ${(fusionProfile.biometricSignals.voiceStress * 100).toFixed(0)}%`);
        addText(`Microexpression Score: ${(fusionProfile.biometricSignals.facialMicroexpressions * 100).toFixed(0)}%`);
        addText(`Keystroke Consistency: ${(fusionProfile.biometricSignals.keystrokeDynamics * 100).toFixed(0)}%`);
        addText(`Gait Regularity: ${(fusionProfile.biometricSignals.gaitAnalysis * 100).toFixed(0)}%`);
        yPos += 5;
      }
      setGenerationProgress(40);

      // Psychological Profile
      if (selectedSections.includes('psychological_profile') && fusionProfile) {
        addSection('Psychological Profile');
        addText(`Attachment Style: ${fusionProfile.psychologicalIndicators.attachmentStyle}`);
        addText(`Dark Triad Composite: ${(fusionProfile.psychologicalIndicators.darkTriadScore * 100).toFixed(0)}%`);
        yPos += 5;
      }
      setGenerationProgress(50);

      // MICE Assessment
      if (selectedSections.includes('mice_assessment') && miceAssessment) {
        addSection('MICE Vulnerability Assessment');
        addText(`Money (Financial Pressure): ${(Number(miceAssessment.money_vulnerability || 0) * 100).toFixed(0)}%`);
        addText(`Ideology (Belief Alignment): ${(Number(miceAssessment.ideology_alignment || 0) * 100).toFixed(0)}%`);
        addText(`Compromise (Blackmail Potential): ${(Number(miceAssessment.compromise_leverage_score || 0) * 100).toFixed(0)}%`);
        addText(`Recruitment Likelihood: ${(Number(miceAssessment.recruitment_likelihood || 0) * 100).toFixed(0)}%`);
        if (miceAssessment.optimal_approach) {
          addText(`Optimal Approach: ${String(miceAssessment.optimal_approach).toUpperCase()}`);
        }
        yPos += 5;
      }
      setGenerationProgress(65);

      // Betrayal Prediction
      if (selectedSections.includes('betrayal_prediction') && betrayalPrediction) {
        addSection('Betrayal Risk Analysis');
        addText(`Defection Probability: ${((betrayalPrediction.defection_probability ?? 0) * 100).toFixed(0)}%`);
        addText(`Trust Score: ${((betrayalPrediction.trust_score ?? 0) * 100).toFixed(0)}%`);
        addText(`Relationship Stress: ${((betrayalPrediction.relationship_stress_score ?? 0) * 100).toFixed(0)}%`);
        if (betrayalPrediction.defection_timeline) {
          addText(`Estimated Timeline: ${betrayalPrediction.defection_timeline}`);
        }
        if (betrayalPrediction.warning_signs?.length) {
          addText('Warning Signs:', { bold: true });
          betrayalPrediction.warning_signs.forEach((sign: string) => {
            addText(`  • ${sign}`);
          });
        }
        yPos += 5;
      }
      setGenerationProgress(80);

      // Sacred Values
      if (selectedSections.includes('sacred_values') && sacredValues?.length) {
        addSection('Sacred Values Map');
        sacredValues.forEach((value: any) => {
          addText(`${value.domain || value.value_domain}: Protection Level ${((value.protection_level || 0) * 100).toFixed(0)}%`);
        });
        yPos += 5;
      }
      setGenerationProgress(90);

      // Operational Guidance
      if (selectedSections.includes('operational_guidance')) {
        addSection('Operational Guidance');
        
        if (miceAssessment?.optimal_approach) {
          addText(`Recommended Approach: ${String(miceAssessment.optimal_approach).toUpperCase()}`);
        }
        
        if (fusionProfile?.predictedBehaviors?.length) {
          addText('Predicted Behaviors:', { bold: true });
          fusionProfile.predictedBehaviors.forEach(pb => {
            addText(`  • ${pb.behavior} (${(pb.probability * 100).toFixed(0)}% probability, ${pb.timeframe})`);
          });
        }
      }
      setGenerationProgress(100);

      // Save PDF
      pdf.save(`dossier_${profileName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Dossier generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Unified Dossier Generator</CardTitle>
          </div>
          <Badge variant="outline">AGIS v3</Badge>
        </div>
        <CardDescription>Generate comprehensive intelligence dossiers with biometric-psychological fusion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Include Sections</label>
          <ScrollArea className="h-48 border rounded-lg p-3">
            <div className="space-y-3">
              {DOSSIER_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <div 
                    key={section.id} 
                    className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleSection(section.id)}
                  >
                    <Checkbox 
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{section.label}</span>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Data Status */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-2 rounded-lg border ${fusionProfile ? 'bg-green-500/10 border-green-500/30' : 'bg-muted'}`}>
            <span className="text-xs font-medium">Biometric Data</span>
            <Badge variant={fusionProfile ? 'default' : 'secondary'} className="ml-2 text-xs">
              {fusionProfile ? 'Available' : 'Missing'}
            </Badge>
          </div>
          <div className={`p-2 rounded-lg border ${miceAssessment ? 'bg-green-500/10 border-green-500/30' : 'bg-muted'}`}>
            <span className="text-xs font-medium">MICE Assessment</span>
            <Badge variant={miceAssessment ? 'default' : 'secondary'} className="ml-2 text-xs">
              {miceAssessment ? 'Available' : 'Missing'}
            </Badge>
          </div>
          <div className={`p-2 rounded-lg border ${betrayalPrediction ? 'bg-green-500/10 border-green-500/30' : 'bg-muted'}`}>
            <span className="text-xs font-medium">Betrayal Analysis</span>
            <Badge variant={betrayalPrediction ? 'default' : 'secondary'} className="ml-2 text-xs">
              {betrayalPrediction ? 'Available' : 'Missing'}
            </Badge>
          </div>
          <div className={`p-2 rounded-lg border ${sacredValues?.length ? 'bg-green-500/10 border-green-500/30' : 'bg-muted'}`}>
            <span className="text-xs font-medium">Sacred Values</span>
            <Badge variant={sacredValues?.length ? 'default' : 'secondary'} className="ml-2 text-xs">
              {sacredValues?.length ? `${sacredValues.length} mapped` : 'Missing'}
            </Badge>
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating dossier...</span>
              <span>{generationProgress}%</span>
            </div>
            <Progress value={generationProgress} />
          </div>
        )}

        {/* Generate Button */}
        <Button 
          className="w-full" 
          onClick={generateDossier}
          disabled={isLoading || isGenerating || selectedSections.length === 0}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Dossier PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
