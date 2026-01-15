import { 
  User, Brain, MessageCircle, FolderOpen, Network,
  UserCircle, MessageSquare, FileText, Image, Mic, Volume2,
  Clock, Sparkles, Mail, Calendar, Eye, Shield, Globe, TrendingUp, Triangle, Search, 
  Activity, GitCompare, Fingerprint, Share2, Package, UserX, ScanText,
  Heart, Gift, Target, Users, GraduationCap, Wallet, Link2, Milestone, 
  Settings2, StickyNote, BookOpen, DollarSign, Swords, AlertTriangle, Dna, Zap, MessageSquarePlus,
  Skull, Syringe, Lock, UserMinus, Layers
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SectionId = 
  | 'overview' | 'personal-info' | 'contact' | 'documents' | 'media' | 'recordings' | 'voice-notes'
  | 'outreach' | 'templates' | 'briefing' | 'whatsapp' | 'emails'
  | 'interests' | 'gifts' | 'goals' | 'experiences' | 'relationships' | 'kids-schools'
  | 'education' | 'messages' | 'timeline' | 'groups' | 'enrich'
  | 'behavioral' | 'facial' | 'body-language' | 'vocal' | 'comparison' | 'biometrics' | 'cross-modal'
  | 'financial' | 'observations'
  | 'milestones' | 'comm-prefs' | 'interaction-notes' | 'playbook' | 'influence'
  | 'activity' | 'trust-assessment' | 'threat-assessment' | 'osint' | 'inferred-connections' | 'predictions'
  | 'dossier' | 'network-intel' | 'locations'
  | 'temporal' | 'trajectory' | 'triangulation' | 'consistency' | 'unified-profile' | 'shared-experiences'
  | 'team-notes'
  | 'detected-items' | 'unknown-persons' | 'doc-intelligence'
  | 'voice-insights' | 'document-insights' | 'content-relationships' | 'keyword-watchlist'
  | 'psychology' | 'deception' | 'keystroke-enrollment'
  | 'agis-attachment' | 'agis-chronotype' | 'agis-negotiation' | 'agis-trajectory' | 'agis-economics' | 'agis-family'
  // AGIS Phase 3 Sections
  | 'agis-semantic-warfare' | 'agis-mice-recruitment' | 'agis-betrayal-risk' | 'agis-sacred-values' | 'agis-memetic' | 'agis-consensus' | 'agis-elicitation'
  // AGIS Phase 4 Sections - Dominion
  | 'agis-trauma' | 'agis-addiction' | 'agis-coercive' | 'agis-breaking-point' | 'agis-helplessness' | 'agis-identity' | 'agis-stockholm' | 'agis-cult' | 'agis-dependency' | 'agis-fusion';

export type CategoryId = 'profile' | 'intelligence' | 'communication' | 'media' | 'connections';

export interface Section {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  sections: Section[];
}

export const categories: Category[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    sections: [
      { id: 'overview', label: 'Overview', icon: User, keywords: ['summary', 'basic', 'info'] },
      { id: 'personal-info', label: 'Extended Info', icon: UserCircle, keywords: ['details', 'bio'] },
      { id: 'contact', label: 'Contact Methods', icon: MessageSquare, keywords: ['phone', 'email', 'address'] },
      { id: 'milestones', label: 'Life Milestones', icon: Milestone, keywords: ['events', 'birthday', 'anniversary'] },
      { id: 'education', label: 'Education & Skills', icon: GraduationCap, keywords: ['school', 'degree', 'certificate'] },
      { id: 'financial', label: 'Financial', icon: Wallet, keywords: ['bank', 'payment', 'money'] },
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: Brain,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    sections: [
      { id: 'unified-profile', label: 'Unified Profile', icon: Brain, keywords: ['ai', 'combined', 'summary'] },
      { id: 'playbook', label: 'Playbook', icon: BookOpen, keywords: ['strategy', 'approach'] },
      { id: 'influence', label: 'Influence & Strategy', icon: Target, keywords: ['power', 'leverage'] },
      { id: 'trust-assessment', label: 'Trust Assessment', icon: Shield, keywords: ['reliability', 'trustworthy'] },
      { id: 'threat-assessment', label: 'Threat Analysis', icon: Shield, keywords: ['risk', 'danger', 'security'] },
      { id: 'osint', label: 'OSINT Intel', icon: Globe, keywords: ['open source', 'public', 'research'] },
      { id: 'inferred-connections', label: 'Inferred Links', icon: Network, keywords: ['connections', 'relationships'] },
      { id: 'predictions', label: 'Predictions', icon: TrendingUp, keywords: ['forecast', 'future'] },
      { id: 'dossier', label: 'Intel Dossier', icon: FileText, keywords: ['report', 'document'] },
      { id: 'network-intel', label: 'Network Intel', icon: Network, keywords: ['graph', 'connections'] },
      { id: 'locations', label: 'Geographic Intel', icon: Globe, keywords: ['map', 'places', 'travel'] },
      { id: 'temporal', label: 'Temporal Patterns', icon: Clock, keywords: ['time', 'schedule', 'habits'] },
      { id: 'trajectory', label: 'Trajectory', icon: TrendingUp, keywords: ['path', 'trend', 'direction'] },
      { id: 'triangulation', label: 'Triangulation', icon: Triangle, keywords: ['verify', 'cross-reference'] },
      { id: 'consistency', label: 'Consistency', icon: Search, keywords: ['deception', 'truth'] },
      { id: 'behavioral', label: 'Behavioral', icon: Brain, keywords: ['patterns', 'behavior'] },
      { id: 'facial', label: 'Facial Analysis', icon: Eye, keywords: ['expressions', 'micro'] },
      { id: 'body-language', label: 'Body Language', icon: Activity, keywords: ['gestures', 'posture'] },
      { id: 'vocal', label: 'Vocal Analysis', icon: Volume2, keywords: ['voice', 'speech', 'tone'] },
      { id: 'comparison', label: 'Compare Over Time', icon: GitCompare, keywords: ['changes', 'diff'] },
      { id: 'biometrics', label: 'Biometric Identity', icon: Fingerprint, keywords: ['face', 'voice', 'id'] },
      { id: 'cross-modal', label: 'Cross-Modal', icon: Brain, keywords: ['synthesis', 'combined'] },
      { id: 'detected-items', label: 'Detected Items', icon: Package, keywords: ['objects', 'assets'] },
      { id: 'unknown-persons', label: 'Unknown Persons', icon: UserX, keywords: ['unidentified', 'faces'] },
      { id: 'doc-intelligence', label: 'Document OCR', icon: ScanText, keywords: ['text', 'extract'] },
      { id: 'voice-insights', label: 'Voice Insights', icon: Volume2, keywords: ['audio', 'transcription'] },
      { id: 'document-insights', label: 'Document Intel', icon: FileText, keywords: ['analysis', 'content'] },
      { id: 'content-relationships', label: 'Content Links', icon: Share2, keywords: ['connections', 'graph'] },
      { id: 'keyword-watchlist', label: 'Keyword Alerts', icon: Search, keywords: ['monitor', 'track'] },
      { id: 'psychology', label: 'Dark Psychology', icon: Brain, keywords: ['dark triad', 'manipulation', 'influence'] },
      { id: 'deception', label: 'Deception Detection', icon: Eye, keywords: ['lie', 'stress', 'micro-expression'] },
      { id: 'keystroke-enrollment', label: 'Keystroke Biometric', icon: Fingerprint, keywords: ['typing', 'dynamics'] },
      // AGIS Phase 2 Sections
      { id: 'agis-attachment', label: 'Attachment Style', icon: Heart, keywords: ['attachment', 'vulnerability', 'bonding'] },
      { id: 'agis-chronotype', label: 'Chronotype', icon: Clock, keywords: ['timing', 'circadian', 'optimal'] },
      { id: 'agis-negotiation', label: 'Negotiation Intel', icon: Target, keywords: ['tactics', 'strategy', 'fbi'] },
      { id: 'agis-trajectory', label: 'Life Trajectory', icon: TrendingUp, keywords: ['forecast', 'prediction', 'future'] },
      { id: 'agis-economics', label: 'Economic Psychology', icon: DollarSign, keywords: ['biases', 'anchoring', 'scarcity'] },
      { id: 'agis-family', label: 'Family Systems', icon: Users, keywords: ['dynamics', 'roles', 'triangulation'] },
      // AGIS Phase 3 Sections - Cognitive Warfare
      { id: 'agis-semantic-warfare', label: 'Semantic Warfare', icon: Swords, keywords: ['terms', 'framing', 'overton'] },
      { id: 'agis-mice-recruitment', label: 'MICE Vulnerability', icon: DollarSign, keywords: ['money', 'ideology', 'compromise', 'ego'] },
      { id: 'agis-betrayal-risk', label: 'Betrayal Risk', icon: AlertTriangle, keywords: ['defection', 'trust', 'gottman'] },
      { id: 'agis-sacred-values', label: 'Sacred Values', icon: Shield, keywords: ['beliefs', 'morals', 'taboos'] },
      { id: 'agis-memetic', label: 'Memetic Profile', icon: Dna, keywords: ['memes', 'virality', 'propagation'] },
      { id: 'agis-consensus', label: 'Consensus Ops', icon: Users, keywords: ['astroturf', 'social proof'] },
      { id: 'agis-elicitation', label: 'Elicitation Intel', icon: MessageSquarePlus, keywords: ['fbi', 'extraction', 'conversation'] },
      // AGIS Phase 4 Sections - Dominion (Dark Psychology)
      { id: 'agis-fusion', label: 'Data Fusion Hub', icon: Layers, keywords: ['universal', 'integration', 'cross-domain'] },
      { id: 'agis-trauma', label: 'Trauma Exploitation', icon: Skull, keywords: ['anniversary', 'loss', 'vulnerability'] },
      { id: 'agis-addiction', label: 'Addiction Formation', icon: Syringe, keywords: ['reinforcement', 'dopamine', 'dependency'] },
      { id: 'agis-coercive', label: 'Coercive Control', icon: Lock, keywords: ['isolation', 'monitoring', 'rules'] },
      { id: 'agis-breaking-point', label: 'Breaking Point', icon: Target, keywords: ['pressure', 'limit', 'collapse'] },
      { id: 'agis-helplessness', label: 'Learned Helplessness', icon: UserMinus, keywords: ['agency', 'defeat', 'passive'] },
      { id: 'agis-identity', label: 'Identity Destabilization', icon: Brain, keywords: ['gaslighting', 'reality', 'confusion'] },
      { id: 'agis-stockholm', label: 'Stockholm Syndrome', icon: Heart, keywords: ['bond', 'captor', 'attachment'] },
      { id: 'agis-cult', label: 'Cult Tactics', icon: Users, keywords: ['BITE', 'thought control', 'milieu'] },
      { id: 'agis-dependency', label: 'Dependency Orchestration', icon: Zap, keywords: ['multi-vector', 'exit prevention'] },
    ]
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    sections: [
      { id: 'outreach', label: 'Outreach Timing', icon: Clock, keywords: ['schedule', 'when'] },
      { id: 'templates', label: 'Message Templates', icon: Sparkles, keywords: ['quick', 'draft'] },
      { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, keywords: ['chat', 'message'] },
      { id: 'emails', label: 'Emails', icon: Mail, keywords: ['mail', 'inbox'] },
      { id: 'messages', label: 'Conversations', icon: MessageSquare, keywords: ['chat', 'history'] },
      { id: 'briefing', label: 'Meeting Briefing', icon: Calendar, keywords: ['prep', 'meeting'] },
      { id: 'observations', label: 'My Observations', icon: Eye, keywords: ['notes', 'personal'] },
      { id: 'comm-prefs', label: 'How to Interact', icon: Settings2, keywords: ['preferences', 'style'] },
      { id: 'interaction-notes', label: 'Interaction Notes', icon: StickyNote, keywords: ['log', 'record'] },
      { id: 'team-notes', label: 'Team Notes', icon: Users, keywords: ['collaborate', 'shared'] },
    ]
  },
  {
    id: 'media',
    label: 'Media & Files',
    icon: FolderOpen,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    sections: [
      { id: 'documents', label: 'Documents', icon: FileText, keywords: ['files', 'pdf', 'doc'] },
      { id: 'media', label: 'Photos & Videos', icon: Image, keywords: ['images', 'gallery'] },
      { id: 'recordings', label: 'Recordings', icon: Mic, keywords: ['audio', 'video', 'meeting'] },
      { id: 'voice-notes', label: 'Voice Notes', icon: Volume2, keywords: ['audio', 'memo'] },
    ]
  },
  {
    id: 'connections',
    label: 'Connections',
    icon: Network,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    sections: [
      { id: 'relationships', label: 'Family & Connections', icon: Link2, keywords: ['family', 'relatives'] },
      { id: 'kids-schools', label: 'Kids Schools', icon: GraduationCap, keywords: ['children', 'education'] },
      { id: 'interests', label: 'Interests', icon: Heart, keywords: ['hobbies', 'likes'] },
      { id: 'gifts', label: 'Gifts', icon: Gift, keywords: ['presents', 'ideas'] },
      { id: 'goals', label: 'Goals', icon: Target, keywords: ['objectives', 'plans'] },
      { id: 'experiences', label: 'Experiences', icon: Heart, keywords: ['memories', 'events'] },
      { id: 'shared-experiences', label: 'Shared Experiences', icon: Users, keywords: ['together', 'mutual'] },
      { id: 'groups', label: 'Groups', icon: Users, keywords: ['lists', 'tags'] },
      { id: 'enrich', label: 'Enrichment', icon: Sparkles, keywords: ['linkedin', 'social'] },
      { id: 'timeline', label: 'Timeline', icon: Clock, keywords: ['history', 'events'] },
      { id: 'activity', label: 'Activity & Usage', icon: Activity, keywords: ['log', 'tracking'] },
    ]
  }
];

// Flat list of all sections for search
export const allSections: Section[] = categories.flatMap(cat => cat.sections);

// Find category by section ID
export function getCategoryForSection(sectionId: SectionId): Category | undefined {
  return categories.find(cat => cat.sections.some(s => s.id === sectionId));
}

// Search sections by query
export function searchSections(query: string): Array<Section & { category: Category }> {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];
  
  const results: Array<Section & { category: Category }> = [];
  
  for (const category of categories) {
    for (const section of category.sections) {
      const matchesLabel = section.label.toLowerCase().includes(lowerQuery);
      const matchesKeywords = section.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
      
      if (matchesLabel || matchesKeywords) {
        results.push({ ...section, category });
      }
    }
  }
  
  return results;
}

// Get section count per category
export function getCategorySectionCounts(): Record<CategoryId, number> {
  return categories.reduce((acc, cat) => {
    acc[cat.id] = cat.sections.length;
    return acc;
  }, {} as Record<CategoryId, number>);
}
