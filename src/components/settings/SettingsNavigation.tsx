/**
 * @fileoverview Settings Vertical Sidebar Navigation
 * Premium sidebar navigation for settings page with grouped sections
 */

import { cn } from '@/lib/utils';
import { 
  Sun, Bell, Fingerprint, HardDrive, Trash2, Link2, 
  Users, Cpu, DollarSign, Bot, Smartphone, Shield, Activity,
  ChevronRight, Settings2, Sliders, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface SettingsGroup {
  id: string;
  label: string;
  sections: SettingsSection[];
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'general',
    label: 'General',
    sections: [
      { id: 'appearance', label: 'Appearance', icon: Sun },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'mobile', label: 'Mobile & PWA', icon: Smartphone },
      { id: 'cache', label: 'Cache & Updates', icon: RefreshCw, badge: 'Fix' },
    ],
  },
  {
    id: 'data',
    label: 'Data & Storage',
    sections: [
      { id: 'storage', label: 'Storage Analytics', icon: HardDrive },
      { id: 'cleanup', label: 'Cleanup & Duplicates', icon: Trash2 },
      { id: 'biometrics', label: 'Biometrics', icon: Fingerprint },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    sections: [
      { id: 'integrations', label: 'All Integrations', icon: Link2, badge: 'New' },
    ],
  },
  {
    id: 'ai',
    label: 'AI & Intelligence',
    sections: [
      { id: 'ai-models', label: 'AI Models', icon: Cpu },
      { id: 'ai-costs', label: 'AI Costs & Budget', icon: DollarSign },
      { id: 'local-ai', label: 'Local AI Endpoints', icon: Bot },
    ],
  },
  {
    id: 'team',
    label: 'Team & Access',
    sections: [
      { id: 'teams', label: 'Workspace', icon: Users },
      { id: 'security', label: 'Security', icon: Shield },
    ],
  },
  {
    id: 'platform',
    label: 'Platform Admin',
    sections: [
      { id: 'platform-config', label: 'Platform Configuration', icon: Sliders, badge: 'Admin' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    sections: [
      { id: 'system', label: 'System Health', icon: Activity },
    ],
  },
];

interface SettingsNavigationProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  className?: string;
}

export function SettingsNavigation({ 
  activeSection, 
  onSectionChange,
  className 
}: SettingsNavigationProps) {
  return (
    <ScrollArea className={cn("h-full", className)}>
      <nav className="space-y-6 p-4 pr-2">
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.id}>
            <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? [
                        "bg-primary/10 text-primary",
                        "shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]",
                      ] : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="flex-1 text-left truncate">{section.label}</span>
                    {section.badge && (
                      <Badge 
                        variant={section.badgeVariant || "secondary"} 
                        className="text-[10px] px-1.5 py-0"
                      >
                        {section.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-primary/60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
}
