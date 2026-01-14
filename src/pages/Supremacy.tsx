/**
 * AGIS Supremacy Center
 * 
 * The ultimate command page for the Absolute General Intelligence System.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Radio } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { SupremacyDashboard } from '@/components/intelligence/SupremacyDashboard';
import { SituationRoom } from '@/components/intelligence/SituationRoom';

export default function Supremacy() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <AppLayout title="AGIS Supremacy">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="dashboard" className="gap-2">
              <Crown className="h-4 w-4" />
              Supremacy Dashboard
            </TabsTrigger>
            <TabsTrigger value="situation" className="gap-2">
              <Radio className="h-4 w-4" />
              Situation Room
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <SupremacyDashboard />
          </TabsContent>
          
          <TabsContent value="situation" className="mt-6">
            <SituationRoom />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
