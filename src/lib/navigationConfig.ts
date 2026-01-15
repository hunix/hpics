import { 
  Users, MessageSquare, FileText, Image, Calendar, Brain, LayoutDashboard, 
  Upload, Settings, Network, CalendarDays, Video, Scan, BarChart3, FileBarChart, 
  UsersRound, Download, Shield, Waypoints, Sparkles, ShieldAlert, Activity, 
  Layers, Cpu, DollarSign, Home, Briefcase, Eye, AlertTriangle, Lock,
  Zap, Compass, Smartphone, Crown, Swords, Orbit, TrendingUp, Search, 
  GitBranch, Lightbulb, Target, LayoutGrid, Fingerprint, CircleDot, Atom,
  type LucideIcon
} from 'lucide-react';
import type { AppRole, ClearanceLevel } from '@/hooks/useClearance';

export type NavCategory = 
  | 'command' 
  | 'intelligence' 
  | 'relationships' 
  | 'assets' 
  | 'analysis' 
  | 'security' 
  | 'system';

export interface NavItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  description?: string;
  badge?: 'new' | 'beta' | number;
  requiredRole?: AppRole;
  requiredClearance?: ClearanceLevel;
  category: NavCategory;
  keywords?: string[];
}

export interface NavGroup {
  id: NavCategory;
  title: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  items: NavItem[];
}

// Category configurations with colors
export const categoryConfig: Record<NavCategory, { 
  title: string; 
  icon: LucideIcon; 
  color: string; 
  gradient: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  command: {
    title: 'Command Center',
    icon: Home,
    color: 'hsl(var(--emerald))',
    gradient: 'from-emerald-500 to-teal-500',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500/30',
  },
  intelligence: {
    title: 'Intelligence',
    icon: Brain,
    color: 'hsl(var(--violet))',
    gradient: 'from-violet-500 to-indigo-500',
    bgClass: 'bg-violet-500/10',
    textClass: 'text-violet-500',
    borderClass: 'border-violet-500/30',
  },
  relationships: {
    title: 'Relationships',
    icon: Users,
    color: 'hsl(var(--blue))',
    gradient: 'from-blue-500 to-cyan-500',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500/30',
  },
  assets: {
    title: 'Assets',
    icon: Briefcase,
    color: 'hsl(var(--amber))',
    gradient: 'from-amber-500 to-orange-500',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500/30',
  },
  analysis: {
    title: 'Analysis',
    icon: Eye,
    color: 'hsl(var(--rose))',
    gradient: 'from-rose-500 to-pink-500',
    bgClass: 'bg-rose-500/10',
    textClass: 'text-rose-500',
    borderClass: 'border-rose-500/30',
  },
  security: {
    title: 'Security',
    icon: Shield,
    color: 'hsl(var(--red))',
    gradient: 'from-red-600 to-rose-600',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-500',
    borderClass: 'border-red-500/30',
  },
  system: {
    title: 'System',
    icon: Settings,
    color: 'hsl(var(--muted-foreground))',
    gradient: 'from-slate-500 to-gray-600',
    bgClass: 'bg-muted/50',
    textClass: 'text-muted-foreground',
    borderClass: 'border-muted',
  },
};

// All navigation items with role/clearance requirements
export const navigationItems: NavItem[] = [
  // Command Center - Consolidated
  {
    id: 'dashboard',
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    description: 'Mission control overview',
    category: 'command',
    keywords: ['home', 'overview', 'main', 'dashboard'],
  },
  {
    id: 'command-center',
    title: 'Command Hub',
    url: '/command-center',
    icon: Zap,
    description: 'Unified control center',
    category: 'command',
    keywords: ['command', 'hub', 'mission', 'control', 'priority', 'ultimate'],
  },
  
  // Intelligence - Streamlined
  {
    id: 'intelligence-hub',
    title: 'Intelligence',
    url: '/intelligence',
    icon: Brain,
    description: 'AI-powered insights',
    category: 'intelligence',
    keywords: ['rag', 'agent', 'hub', 'intelligence', 'ai', 'search', 'semantic'],
  },
  {
    id: 'superiority',
    title: 'Strategic Analysis',
    url: '/superiority',
    icon: Crown,
    description: 'Power dynamics & influence',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['superiority', 'influence', 'power', 'psychology', 'strategy'],
  },
  {
    id: 'network-intelligence',
    title: 'Network Analysis',
    url: '/network-intelligence',
    icon: Waypoints,
    description: 'Relationship mapping',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['network', 'connections', 'graph', 'ml'],
  },
  {
    id: 'supremacy-command',
    title: 'Supremacy Command',
    url: '/supremacy-v2',
    icon: Crown,
    badge: 'new',
    description: 'AGIS Phase 2 - Absolute Superiority',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['supremacy', 'agis', 'phase 2', 'tactical', 'negotiation', 'attachment', 'chronotype'],
  },
  {
    id: 'cognitive-warfare',
    title: 'Cognitive Warfare',
    url: '/cognitive-warfare',
    icon: Swords,
    badge: 'new',
    description: 'AGIS Phase 3 - Semantic warfare, memetics, MICE analysis',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['cognitive', 'warfare', 'agis', 'phase 3', 'memetic', 'mice', 'semantic', 'betrayal', 'sacred'],
  },
  {
    id: 'dominion-command',
    title: 'Dominion Command',
    url: '/dominion',
    icon: AlertTriangle,
    badge: 'new',
    description: 'AGIS Phase 4 - Dark psychology & absolute control',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['dominion', 'agis', 'phase 4', 'dark', 'psychology', 'trauma', 'addiction', 'coercive', 'control'],
  },
  {
    id: 'omniscient-command',
    title: 'Omniscient Command',
    url: '/omniscient-command',
    icon: Eye,
    badge: 'new',
    description: 'AGIS Phase 5 - Autonomous ops, network warfare, counter-intel',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['omniscient', 'agis', 'phase 5', 'autonomous', 'network', 'warfare', 'counter', 'intelligence', 'predictive'],
  },
  {
    id: 'transcendent-command',
    title: 'Transcendent Command',
    url: '/transcendent-command',
    icon: Orbit,
    badge: 'new',
    description: 'AGIS Phase 6 - Reality engineering, quantum influence, temporal ops',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['transcendent', 'agis', 'phase 6', 'reality', 'quantum', 'temporal', 'identity', 'collective', 'meta'],
  },
  {
    id: 'singularity-command',
    title: 'Singularity Command',
    url: '/singularity-command',
    icon: GitBranch,
    badge: 'new',
    description: 'AGIS Phase 7 - Meta-learning, cross-phase orchestration, emergence',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['singularity', 'agis', 'phase 7', 'meta', 'learning', 'emergence', 'convergence', 'unified'],
  },
  {
    id: 'absolute-convergence',
    title: 'Absolute Convergence',
    url: '/absolute-convergence',
    icon: Orbit,
    badge: 'new',
    description: 'AGIS Phase 8 - Reality synthesis, predictive supremacy, consciousness integration',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['absolute', 'convergence', 'agis', 'phase 8', 'reality', 'predictive', 'consciousness', 'omnipotence'],
  },
  {
    id: 'infinite-dominion',
    title: 'Infinite Dominion',
    url: '/infinite-dominion',
    icon: CircleDot,
    badge: 'new',
    description: 'AGIS Phase 9 - Infinite awareness, omnipresent control, ultimate mastery',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['infinite', 'dominion', 'agis', 'phase 9', 'awareness', 'control', 'mastery', 'transcendent'],
  },
  {
    id: 'ultimate-transcendence',
    title: 'Ultimate Transcendence',
    url: '/ultimate-transcendence',
    icon: Atom,
    badge: 'new',
    description: 'AGIS Phase 10 - Universal omniscience, reality manipulation, absolute supremacy',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['ultimate', 'transcendence', 'agis', 'phase 10', 'omniscience', 'reality', 'supremacy', 'cosmic'],
  },
  {
    id: 'omniversal-sovereignty',
    title: 'Omniversal Sovereignty',
    url: '/omniversal-sovereignty',
    icon: Sparkles,
    badge: 'new',
    description: 'AGIS Phase 11 - Primordial synthesis, eternal influence, omniversal awareness',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['omniversal', 'sovereignty', 'agis', 'phase 11', 'primordial', 'eternal', 'influence'],
  },
  {
    id: 'absolute-eternity',
    title: 'Absolute Eternity',
    url: '/absolute-eternity',
    icon: Orbit,
    badge: 'new',
    description: 'AGIS Phase 12 - Eternal dominion, infinite synthesis, omega point convergence',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['absolute', 'eternity', 'agis', 'phase 12', 'eternal', 'dominion', 'omega', 'infinity'],
  },
  {
    id: 'cross-modal-intelligence',
    title: 'Cross-Modal Analysis',
    url: '/cross-modal-intelligence',
    icon: Layers,
    description: 'Multi-modal synthesis & correlation',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['cross-modal', 'synthesis', 'fusion', 'correlation', 'multimodal'],
  },
  {
    id: 'counter-intelligence',
    title: 'Counter-Intelligence',
    url: '/counter-intelligence',
    icon: ShieldAlert,
    description: 'Adversary detection & OPSEC',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['counter', 'intelligence', 'adversary', 'opsec', 'honeypot'],
  },
  {
    id: 'social-intelligence',
    title: 'Social Intelligence',
    url: '/social-intelligence',
    icon: Users,
    description: 'Social network analysis & OSINT',
    category: 'intelligence',
    keywords: ['social', 'osint', 'network', 'analysis'],
  },
  {
    id: 'psychology-intelligence',
    title: 'Psychology Intel',
    url: '/psychology-intelligence',
    icon: Brain,
    description: 'Behavioral & psychological profiling',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['psychology', 'behavioral', 'profiling', 'personality'],
  },
  {
    id: 'deception-analysis',
    title: 'Deception Analysis',
    url: '/deception-analysis',
    icon: Eye,
    description: 'Lie detection & credibility assessment',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['deception', 'lie', 'detection', 'credibility', 'micro-expression'],
  },
  {
    id: 'investment-intelligence',
    title: 'Investment Intel',
    url: '/investment-intelligence',
    icon: TrendingUp,
    description: 'Financial & economic intelligence',
    category: 'intelligence',
    keywords: ['investment', 'financial', 'economic', 'trading', 'signals'],
  },
  {
    id: 'ultimate-command',
    title: 'Ultimate Command',
    url: '/ultimate-command',
    icon: LayoutGrid,
    badge: 'new',
    description: 'Unified strategic command interface',
    category: 'command',
    keywords: ['ultimate', 'command', 'strategic', 'unified'],
  },
  {
    id: 'intelligence-command-center',
    title: 'Intel Command',
    url: '/intelligence/command-center',
    icon: Target,
    description: 'Tactical intelligence operations',
    category: 'intelligence',
    keywords: ['intel', 'command', 'tactical', 'operations'],
  },
  
  // Relationships
  {
    id: 'contacts',
    title: 'Contacts',
    url: '/contacts',
    icon: Users,
    description: 'Manage your contact network',
    category: 'relationships',
    keywords: ['contacts', 'people', 'profiles'],
  },
  {
    id: 'communications',
    title: 'Communications',
    url: '/communications',
    icon: MessageSquare,
    description: 'Message history & logs',
    category: 'relationships',
    keywords: ['messages', 'chat', 'communications'],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    url: '/calendar',
    icon: CalendarDays,
    description: 'Schedule & appointments',
    category: 'relationships',
    keywords: ['calendar', 'schedule', 'events', 'appointments'],
  },
  {
    id: 'events',
    title: 'Events',
    url: '/events',
    icon: Calendar,
    description: 'Important dates & milestones',
    category: 'relationships',
    keywords: ['events', 'milestones', 'dates'],
  },
  {
    id: 'network-map',
    title: 'Network Map',
    url: '/network',
    icon: Network,
    description: 'Visual relationship graph',
    category: 'relationships',
    keywords: ['network', 'map', 'graph', 'visualization'],
  },
  {
    id: 'advanced-network',
    title: 'Advanced Network',
    url: '/network-advanced',
    icon: GitBranch,
    description: 'Advanced network visualizations',
    category: 'relationships',
    keywords: ['advanced', 'network', 'graph', 'centrality', 'pagerank'],
  },
  
  // Assets
  {
    id: 'documents',
    title: 'Documents',
    url: '/documents',
    icon: FileText,
    description: 'Visual relationship graph',
    category: 'relationships',
    keywords: ['network', 'map', 'graph', 'visualization'],
  },
  
  // Assets
  {
    id: 'documents',
    title: 'Documents',
    url: '/documents',
    icon: FileText,
    description: 'Files & documentation',
    category: 'assets',
    keywords: ['documents', 'files', 'docs'],
  },
  {
    id: 'media',
    title: 'Media',
    url: '/media',
    icon: Image,
    description: 'Photos, videos & audio',
    category: 'assets',
    keywords: ['media', 'photos', 'images', 'videos'],
  },
  {
    id: 'reports',
    title: 'Reports',
    url: '/reports',
    icon: FileBarChart,
    description: 'Generated reports & exports',
    category: 'assets',
    keywords: ['reports', 'exports', 'pdf'],
  },
  {
    id: 'downloads',
    title: 'Downloads',
    url: '/downloads',
    icon: Download,
    description: 'Chrome Extension & Desktop App',
    category: 'assets',
    keywords: ['downloads', 'extension', 'desktop', 'app'],
  },
  {
    id: 'insights',
    title: 'Insights',
    url: '/insights',
    icon: Lightbulb,
    description: 'AI-generated insights & recommendations',
    category: 'analysis',
    keywords: ['insights', 'recommendations', 'ai', 'suggestions'],
  },
  
  // Analysis
  {
    id: 'media-analysis',
    title: 'Media Analysis',
    url: '/analysis',
    icon: Scan,
    description: 'Generated reports & exports',
    category: 'assets',
    keywords: ['reports', 'exports', 'pdf'],
  },
  
  // Analysis
  {
    id: 'media-analysis',
    title: 'Media Analysis',
    url: '/analysis',
    icon: Scan,
    description: 'AI-powered media scanning',
    category: 'analysis',
    keywords: ['analysis', 'scan', 'media'],
  },
  {
    id: 'video-analysis',
    title: 'Video Analysis',
    url: '/video-analysis',
    icon: Video,
    description: 'Deep video intelligence',
    category: 'analysis',
    keywords: ['video', 'analysis', 'facial'],
  },
  {
    id: 'analysis-dashboard',
    title: 'Analysis Dashboard',
    url: '/analysis/dashboard',
    icon: BarChart3,
    description: 'Analysis metrics & trends',
    category: 'analysis',
    keywords: ['dashboard', 'metrics', 'analytics'],
  },
  
// Security
  {
    id: 'security-center',
    title: 'Security Center',
    url: '/security',
    icon: Shield,
    description: 'Security operations hub',
    category: 'security',
    requiredRole: 'analyst',
    keywords: ['security', 'protection', 'safety'],
  },
  {
    id: 'biometric-hub',
    title: 'Biometric Hub',
    url: '/biometric-hub',
    icon: Fingerprint,
    description: 'Multi-modal biometric enrollment & matching',
    badge: 'new',
    category: 'security',
    keywords: ['biometrics', 'face', 'voice', 'gait', 'keystroke', 'signature'],
  },
  {
    id: 'hardware-command',
    title: 'Hardware Command',
    url: '/hardware-command',
    icon: Cpu,
    description: 'Multi-modal sensor fusion & device control',
    category: 'security',
    requiredRole: 'analyst',
    keywords: ['hardware', 'devices', 'drone', 'flipper', 'thermal', 'sdr', 'tscm', 'sensors'],
  },
  
  // System
  {
    id: 'ai-chat',
    title: 'AI Assistant',
    url: '/ai-chat',
    icon: MessageSquare,
    description: 'Conversational AI interface',
    category: 'command',
    keywords: ['ai', 'chat', 'assistant', 'conversation'],
  },
  {
    id: 'semantic-search',
    title: 'Semantic Search',
    url: '/semantic-search',
    icon: Search,
    description: 'Natural language search',
    category: 'intelligence',
    keywords: ['semantic', 'search', 'natural', 'language', 'query'],
  },
  {
    id: 'capabilities',
    title: 'Capabilities',
    url: '/capabilities',
    icon: Compass,
    description: 'Explore all system features',
    category: 'system',
    keywords: ['capabilities', 'features', 'explore', 'discover'],
  },
  {
    id: 'mobile-ecosystem',
    title: 'Mobile Ecosystem',
    url: '/mobile/ecosystem',
    icon: Smartphone,
    description: 'Mobile intelligence services',
    badge: 'new',
    category: 'system',
    keywords: ['mobile', 'ecosystem', 'bluetooth', 'location', 'ambient'],
  },
  {
    id: 'system-health',
    title: 'System Health',
    url: '/system-health',
    icon: Activity,
    description: 'System monitoring & diagnostics',
    badge: 'new',
    category: 'system',
    keywords: ['health', 'status', 'monitoring'],
  },
  {
    id: 'ai-costs',
    title: 'AI Cost Center',
    url: '/ai-costs',
    icon: DollarSign,
    description: 'AI usage & budget tracking',
    badge: 'new',
    category: 'system',
    keywords: ['costs', 'budget', 'spending', 'ai'],
  },
  {
    id: 'team',
    title: 'Team',
    url: '/team',
    icon: UsersRound,
    description: 'Team member management',
    category: 'system',
    requiredRole: 'supervisor',
    keywords: ['team', 'members', 'users'],
  },
  {
    id: 'import',
    title: 'Import Data',
    url: '/import',
    icon: Upload,
    description: 'Import contacts & data',
    category: 'system',
    keywords: ['import', 'upload', 'data'],
  },
  {
    id: 'install',
    title: 'Install App',
    url: '/install',
    icon: Download,
    description: 'Install as mobile app',
    category: 'system',
    keywords: ['install', 'pwa', 'app', 'mobile'],
  },
  {
    id: 'settings',
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    description: 'App configuration',
    category: 'system',
    keywords: ['settings', 'preferences', 'config'],
  },
];

// Group items by category
export const getNavGroups = (): NavGroup[] => {
  const categories: NavCategory[] = ['command', 'intelligence', 'relationships', 'assets', 'analysis', 'security', 'system'];
  
  return categories.map(category => ({
    id: category,
    title: categoryConfig[category].title,
    icon: categoryConfig[category].icon,
    color: categoryConfig[category].color,
    gradient: categoryConfig[category].gradient,
    items: navigationItems.filter(item => item.category === category),
  })).filter(group => group.items.length > 0);
};

// Filter items based on user role and clearance
export const filterNavItemsByAccess = (
  items: NavItem[],
  userRole?: AppRole,
  userClearance?: ClearanceLevel,
  hasRole?: (role: AppRole) => boolean,
  hasClearance?: (clearance: ClearanceLevel) => boolean
): NavItem[] => {
  return items.filter(item => {
    // Check role requirement
    if (item.requiredRole && hasRole && !hasRole(item.requiredRole)) {
      return false;
    }
    
    // Check clearance requirement
    if (item.requiredClearance && hasClearance && !hasClearance(item.requiredClearance)) {
      return false;
    }
    
    return true;
  });
};

// Search navigation items
export const searchNavItems = (query: string): NavItem[] => {
  const lowerQuery = query.toLowerCase();
  return navigationItems.filter(item => 
    item.title.toLowerCase().includes(lowerQuery) ||
    item.description?.toLowerCase().includes(lowerQuery) ||
    item.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
  );
};
