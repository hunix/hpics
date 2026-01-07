import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Target, BookOpen, Calendar } from 'lucide-react';
import { InfluenceProfilePanel } from './InfluenceProfilePanel';
import { StrategyBuilderWidget } from './StrategyBuilderWidget';
import { MethodologyLibrary } from './MethodologyLibrary';
import { ActionScheduler } from './ActionScheduler';

interface InfluenceDashboardProps {
  profileId: string;
  contactName: string;
}

export function InfluenceDashboard({ profileId, contactName }: InfluenceDashboardProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="strategies" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Strategies</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Library</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <InfluenceProfilePanel profileId={profileId} contactName={contactName} />
        </TabsContent>

        <TabsContent value="strategies" className="mt-6">
          <StrategyBuilderWidget profileId={profileId} contactName={contactName} />
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <ActionScheduler profileId={profileId} contactName={contactName} />
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <MethodologyLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
