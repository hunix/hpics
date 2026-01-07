import { Users, MessageSquare, FileText, Image, Calendar, Brain, LayoutDashboard, LogOut, Upload, Settings, Network, CalendarDays, Video, Scan, BarChart3, FileBarChart, UsersRound, Download, Shield, Waypoints } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ClearanceBadge } from '@/components/security/ClearanceBadge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Contacts', url: '/contacts', icon: Users },
  { title: 'Communications', url: '/communications', icon: MessageSquare },
  { title: 'Calendar', url: '/calendar', icon: CalendarDays },
  { title: 'Documents', url: '/documents', icon: FileText },
  { title: 'Media', url: '/media', icon: Image },
  { title: 'Events', url: '/events', icon: Calendar },
];

const toolsNavItems = [
  { title: 'AI Insights', url: '/insights', icon: Brain },
  { title: 'Network Intelligence', url: '/network-intelligence', icon: Waypoints },
  { title: 'Media Analysis', url: '/analysis', icon: Scan },
  { title: 'Analysis Dashboard', url: '/analysis/dashboard', icon: BarChart3 },
  { title: 'Video Analysis', url: '/video-analysis', icon: Video },
  { title: 'Network Map', url: '/network', icon: Network },
  { title: 'Reports', url: '/reports', icon: FileBarChart },
  { title: 'Team', url: '/team', icon: UsersRound },
  { title: 'Security Center', url: '/security', icon: Shield },
  { title: 'Import Data', url: '/import', icon: Upload },
  { title: 'Install App', url: '/install', icon: Download },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Users className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">PICS</span>
            <span className="text-xs text-muted-foreground">Personal CRM</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-2 hover:bg-sidebar-accent" 
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-2 hover:bg-sidebar-accent" 
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-2">
          <ClearanceBadge />
          <Separator />
          <ThemeToggle />
          <Separator />
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
