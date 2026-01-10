import { 
  Users, MessageSquare, FileText, Image, Calendar, Brain, LayoutDashboard, 
  Upload, Settings, Network, CalendarDays, Video, Scan, BarChart3, FileBarChart, 
  UsersRound, Download, Shield, Waypoints, Sparkles, ShieldAlert, Activity, 
  Layers, Cpu, DollarSign, Home, Briefcase, Eye, AlertTriangle, Lock,
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
  // Command Center
  {
    id: 'dashboard',
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    description: 'Your mission control center',
    category: 'command',
    keywords: ['home', 'overview', 'main'],
  },
  
  // Intelligence
  {
    id: 'intelligence-hub',
    title: 'Intelligence Hub',
    url: '/intelligence',
    icon: Brain,
    description: 'RAG-powered cross-contact AI agent',
    badge: 'new',
    category: 'intelligence',
    keywords: ['rag', 'agent', 'hub', 'intelligence', 'ai'],
  },
  {
    id: 'ai-insights',
    title: 'AI Insights',
    url: '/insights',
    icon: Brain,
    description: 'Deep AI-powered analysis',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['ai', 'analysis', 'insights', 'intelligence'],
  },
  {
    id: 'ai-search',
    title: 'AI Search',
    url: '/semantic-search',
    icon: Sparkles,
    description: 'Semantic search across all data',
    category: 'intelligence',
    keywords: ['search', 'semantic', 'find', 'query'],
  },
  {
    id: 'cross-modal',
    title: 'Cross-Modal AI',
    url: '/cross-modal-intelligence',
    icon: Layers,
    description: 'Multi-modal intelligence synthesis',
    badge: 'new',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['cross-modal', 'synthesis', 'multimodal'],
  },
  {
    id: 'network-intelligence',
    title: 'Network Intelligence',
    url: '/network-intelligence',
    icon: Waypoints,
    description: 'Relationship network analysis',
    category: 'intelligence',
    requiredRole: 'analyst',
    keywords: ['network', 'connections', 'graph'],
  },
  {
    id: 'network-ml',
    title: 'Network ML',
    url: '/network-advanced',
    icon: Cpu,
    description: 'ML-powered network analytics',
    badge: 'beta',
    category: 'intelligence',
    requiredRole: 'analyst',
    requiredClearance: 'secret',
    keywords: ['ml', 'machine learning', 'advanced'],
  },
  {
    id: 'counter-intelligence',
    title: 'Counter-Intelligence',
    url: '/counter-intelligence',
    icon: ShieldAlert,
    description: 'Threat detection & analysis',
    category: 'intelligence',
    requiredRole: 'supervisor',
    requiredClearance: 'top_secret',
    keywords: ['counter', 'threat', 'detection'],
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
  
  // System
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
