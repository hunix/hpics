import React from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { SuperiorityDashboard } from '@/components/intelligence/SuperiorityDashboard';
import { PowerDynamicsAnalyzer } from '@/components/intelligence/PowerDynamicsAnalyzer';
import { NetworkInfluenceMap } from '@/components/intelligence/NetworkInfluenceMap';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, Zap } from 'lucide-react';

export default function Superiority() {
  return (
    <AppLayout title="Strategic Superiority">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-violet-500/20 to-amber-500/20">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-violet-400 to-amber-400 bg-clip-text text-transparent">
                Strategic Superiority Center
              </h1>
              <p className="text-muted-foreground">
                Advanced intelligence for influence and advantage
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Defense Active
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Intelligence Mode
            </Badge>
          </div>
        </motion.div>

        {/* Main Dashboard */}
        <SuperiorityDashboard />

        {/* Analysis Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PowerDynamicsAnalyzer profileName="Selected Contact" />
          <NetworkInfluenceMap />
        </div>
      </div>
    </AppLayout>
  );
}
