import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Mic2, 
  Brain, 
  Users, 
  Search, 
  MessageSquare, 
  HeartPulse,
  FileAudio,
  Fingerprint
} from 'lucide-react';

export interface VoiceAnalysisConfig {
  transcription: boolean;
  speakerDiarization: boolean;
  vocalPsychology: boolean;
  contentIntelligence: boolean;
  keywordDetection: boolean;
  contactIdentification: boolean;
  voiceBiometrics: boolean;
  moodPatterns: boolean;
}

interface VoiceAnalysisOptionsProps {
  config: VoiceAnalysisConfig;
  onChange: (config: VoiceAnalysisConfig) => void;
  disabled?: boolean;
  audioCount: number;
}

const OPTIONS = [
  {
    key: 'transcription' as const,
    label: 'Full Transcription',
    description: 'Speech-to-text with timestamps',
    icon: FileAudio,
    badge: 'Essential',
    badgeVariant: 'default' as const,
  },
  {
    key: 'speakerDiarization' as const,
    label: 'Speaker Diarization',
    description: 'Identify and separate multiple speakers',
    icon: Users,
  },
  {
    key: 'vocalPsychology' as const,
    label: 'Vocal Psychology',
    description: 'Stress, confidence, deception indicators',
    icon: Brain,
    badge: 'Advanced',
    badgeVariant: 'secondary' as const,
  },
  {
    key: 'contentIntelligence' as const,
    label: 'Content Intelligence',
    description: 'Topics, entities, action items, commitments',
    icon: MessageSquare,
  },
  {
    key: 'keywordDetection' as const,
    label: 'Keyword Detection',
    description: 'Match against your watchlists',
    icon: Search,
  },
  {
    key: 'contactIdentification' as const,
    label: 'Contact Identification',
    description: 'Identify mentioned people and link to contacts',
    icon: Users,
  },
  {
    key: 'voiceBiometrics' as const,
    label: 'Voice Biometrics',
    description: 'Extract voice signatures for matching',
    icon: Fingerprint,
    badge: 'Premium',
    badgeVariant: 'outline' as const,
  },
  {
    key: 'moodPatterns' as const,
    label: 'Mood Patterns',
    description: 'Track emotional changes throughout audio',
    icon: HeartPulse,
  },
];

export function VoiceAnalysisOptions({ 
  config, 
  onChange, 
  disabled,
  audioCount 
}: VoiceAnalysisOptionsProps) {
  const handleToggle = (key: keyof VoiceAnalysisConfig) => {
    const newConfig = { ...config, [key]: !config[key] };
    
    // If transcription is disabled, disable dependent options
    if (key === 'transcription' && !newConfig.transcription) {
      newConfig.speakerDiarization = false;
      newConfig.contentIntelligence = false;
      newConfig.keywordDetection = false;
      newConfig.contactIdentification = false;
    }
    
    // If enabling dependent options, ensure transcription is on
    if (key !== 'transcription' && newConfig[key] && !newConfig.transcription) {
      if (['speakerDiarization', 'contentIntelligence', 'keywordDetection', 'contactIdentification'].includes(key)) {
        newConfig.transcription = true;
      }
    }
    
    onChange(newConfig);
  };

  const enabledCount = Object.values(config).filter(Boolean).length;

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-r from-purple-500/5 to-blue-500/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic2 className="h-5 w-5 text-purple-600" />
          <span className="font-medium">Voice Analysis Options</span>
        </div>
        <Badge variant="secondary">
          {audioCount} audio files • {enabledCount} features enabled
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isChecked = config[option.key];
          const isDependent = ['speakerDiarization', 'contentIntelligence', 'keywordDetection', 'contactIdentification'].includes(option.key);
          const isDisabledByDependency = isDependent && !config.transcription;
          
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
      
      {!config.transcription && (
        <p className="text-xs text-muted-foreground italic">
          Enable transcription to unlock speaker diarization, content intelligence, keyword detection, and contact identification.
        </p>
      )}
    </div>
  );
}

export const defaultVoiceAnalysisConfig: VoiceAnalysisConfig = {
  transcription: true,
  speakerDiarization: true,
  vocalPsychology: true,
  contentIntelligence: true,
  keywordDetection: true,
  contactIdentification: true,
  voiceBiometrics: false,
  moodPatterns: true,
};
