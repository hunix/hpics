import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ScanText, 
  FolderKanban, 
  Users, 
  Search, 
  Calendar,
  Shield,
  TableIcon,
  DollarSign
} from 'lucide-react';

export interface DocumentAnalysisConfig {
  ocr: boolean;
  classification: boolean;
  structuredExtraction: boolean;
  contactLinking: boolean;
  patternDetection: boolean;
  dateExtraction: boolean;
  financialAnalysis: boolean;
  securityAnalysis: boolean;
}

interface DocumentAnalysisOptionsProps {
  config: DocumentAnalysisConfig;
  onChange: (config: DocumentAnalysisConfig) => void;
  disabled?: boolean;
  documentCount: number;
}

const OPTIONS = [
  {
    key: 'ocr' as const,
    label: 'OCR Extraction',
    description: 'Extract text from images and scanned documents',
    icon: ScanText,
    badge: 'Essential',
    badgeVariant: 'default' as const,
  },
  {
    key: 'classification' as const,
    label: 'Document Classification',
    description: 'Auto-detect document type (invoice, contract, ID, etc.)',
    icon: FolderKanban,
  },
  {
    key: 'structuredExtraction' as const,
    label: 'Structured Extraction',
    description: 'Extract key-value pairs, tables, form fields',
    icon: TableIcon,
  },
  {
    key: 'contactLinking' as const,
    label: 'Contact Linking',
    description: 'Find and link mentioned contacts',
    icon: Users,
  },
  {
    key: 'patternDetection' as const,
    label: 'Pattern Detection',
    description: 'Identify recurring elements and anomalies',
    icon: Search,
  },
  {
    key: 'dateExtraction' as const,
    label: 'Date Extraction',
    description: 'Find dates and suggest reminders',
    icon: Calendar,
  },
  {
    key: 'financialAnalysis' as const,
    label: 'Financial Analysis',
    description: 'Extract amounts, account numbers, transaction data',
    icon: DollarSign,
    badge: 'Advanced',
    badgeVariant: 'secondary' as const,
  },
  {
    key: 'securityAnalysis' as const,
    label: 'Security Analysis',
    description: 'Detect sensitive data, authenticity scoring',
    icon: Shield,
    badge: 'Premium',
    badgeVariant: 'outline' as const,
  },
];

export function DocumentAnalysisOptions({ 
  config, 
  onChange, 
  disabled,
  documentCount 
}: DocumentAnalysisOptionsProps) {
  const handleToggle = (key: keyof DocumentAnalysisConfig) => {
    const newConfig = { ...config, [key]: !config[key] };
    
    // If OCR is disabled, disable dependent options
    if (key === 'ocr' && !newConfig.ocr) {
      newConfig.structuredExtraction = false;
      newConfig.patternDetection = false;
      newConfig.financialAnalysis = false;
    }
    
    // If enabling dependent options, ensure OCR is on
    if (key !== 'ocr' && newConfig[key] && !newConfig.ocr) {
      if (['structuredExtraction', 'patternDetection', 'financialAnalysis'].includes(key)) {
        newConfig.ocr = true;
      }
    }
    
    onChange(newConfig);
  };

  const enabledCount = Object.values(config).filter(Boolean).length;

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-r from-amber-500/5 to-orange-500/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-600" />
          <span className="font-medium">Document Analysis Options</span>
        </div>
        <Badge variant="secondary">
          {documentCount} documents • {enabledCount} features enabled
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isChecked = config[option.key];
          const isDependent = ['structuredExtraction', 'patternDetection', 'financialAnalysis'].includes(option.key);
          const isDisabledByDependency = isDependent && !config.ocr;
          
          return (
            <label
              key={option.key}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isChecked 
                  ? 'bg-primary/5 border-primary/30' 
                  : 'hover:bg-muted/50'
              } ${disabled || isDisabledByDependency ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => handleToggle(option.key)}
                disabled={disabled || isDisabledByDependency}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{option.label}</span>
                  {option.badge && (
                    <Badge variant={option.badgeVariant} className="text-xs">
                      {option.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
      
      {!config.ocr && (
        <p className="text-xs text-muted-foreground italic">
          Enable OCR to unlock structured extraction, pattern detection, and financial analysis.
        </p>
      )}
    </div>
  );
}

export const defaultDocumentAnalysisConfig: DocumentAnalysisConfig = {
  ocr: true,
  classification: true,
  structuredExtraction: true,
  contactLinking: true,
  patternDetection: true,
  dateExtraction: true,
  financialAnalysis: false,
  securityAnalysis: false,
};
