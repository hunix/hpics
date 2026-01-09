import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Lightbulb, Users, Bell, BarChart3 } from 'lucide-react';
import { AICostDashboard } from '@/components/ai/AICostDashboard';
import { CostProjectionWidget } from '@/components/ai/CostProjectionWidget';
import { CostOptimizationAdvisor } from '@/components/ai/CostOptimizationAdvisor';
import { ContactCostAnalysis } from '@/components/ai/ContactCostAnalysis';
import { AIBudgetAlerts } from '@/components/ai/AIBudgetAlerts';
import { AIBudgetSettings } from '@/components/settings/AIBudgetSettings';
import { BudgetAlertPanel } from '@/components/ai/BudgetAlertPanel';
import { PerContactSpendAnalysis } from '@/components/ai/PerContactSpendAnalysis';
import { ModelEfficiencyComparison } from '@/components/ai/ModelEfficiencyComparison';

export default function AICostCenterPage() {
  return (
    <AppLayout title="AI Cost Center">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="projections" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Projections
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="per-contact" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Per-Contact
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Model Efficiency
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts & Budget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AICostDashboard />
        </TabsContent>

        <TabsContent value="projections">
          <CostProjectionWidget />
        </TabsContent>

        <TabsContent value="optimization">
          <CostOptimizationAdvisor />
        </TabsContent>

        <TabsContent value="per-contact" className="space-y-6">
          <PerContactSpendAnalysis />
          <ContactCostAnalysis />
        </TabsContent>

        <TabsContent value="efficiency">
          <ModelEfficiencyComparison />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <BudgetAlertPanel />
          <AIBudgetAlerts />
          <AIBudgetSettings />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
