/**
 * Family Systems Panel
 * Family dynamics analysis and relationship pattern visualization
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Heart,
  AlertTriangle,
  Target,
  Loader2,
  Link2,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface FamilySystemsPanelProps {
  profileId: string;
}

const FAMILY_ROLES = [
  { id: 'scapegoat', label: 'Scapegoat', color: 'text-red-500', description: 'Bears family blame/problems' },
  { id: 'golden_child', label: 'Golden Child', color: 'text-amber-500', description: 'Can do no wrong, favored' },
  { id: 'lost_child', label: 'Lost Child', color: 'text-blue-500', description: 'Overlooked, withdrawn' },
  { id: 'mascot', label: 'Mascot', color: 'text-green-500', description: 'Provides comic relief' },
  { id: 'caretaker', label: 'Caretaker', color: 'text-purple-500', description: 'Manages family emotions' },
  { id: 'hero', label: 'Hero', color: 'text-cyan-500', description: 'Overachiever, family pride' },
];

export function FamilySystemsPanel({ profileId }: FamilySystemsPanelProps) {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!user) return;
    setIsAnalyzing(true);

    try {
      const { data, error } = await invokeFunction('family-systems-analyzer', {
          userId: user.id,
          profileId,
          action: 'analyze'
        });

      if (error) throw error;
      setAnalysis(data?.analysis);
      toast.success('Family system analyzed');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to analyze');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/20 border border-pink-500/30">
            <Users className="h-5 w-5 text-pink-500" />
          </div>
          <div>
            <h3 className="font-semibold">Family Systems Analysis</h3>
            <p className="text-sm text-muted-foreground">Relationship patterns & dynamics</p>
          </div>
        </div>
        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
          Analyze System
        </Button>
      </div>

      {analysis ? (
        <div className="space-y-6">
          {/* Family Role */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Identified Family Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {FAMILY_ROLES.filter(r => r.id === analysis.primaryRole).map(role => (
                  <div key={role.id} className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={role.color}>{role.label}</Badge>
                      <span className="text-sm text-muted-foreground">Primary</span>
                    </div>
                    <p className="text-sm">{role.description}</p>
                  </div>
                ))}
                <div className="text-right">
                  <p className="text-3xl font-bold">{Math.round((analysis.roleConfidence || 0.75) * 100)}%</p>
                  <p className="text-xs text-muted-foreground">confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Patterns */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Enmeshment Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(analysis.enmeshmentScore || 0.5) * 100} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {analysis.enmeshmentScore > 0.7 ? 'High enmeshment - blurred boundaries' :
                   analysis.enmeshmentScore > 0.4 ? 'Moderate connection levels' :
                   'Low enmeshment - may indicate disengagement'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Triangulation Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(analysis.triangulationRisk || 0.4) * 100} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {analysis.triangulationRisk > 0.7 ? 'High risk - often pulled into conflicts' :
                   analysis.triangulationRisk > 0.4 ? 'Moderate exposure to family triangles' :
                   'Low triangulation - healthy boundaries'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Exploitation Strategies */}
          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-500" />
                Influence Strategies Based on Family Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(analysis.strategies || [
                { strategy: 'Validate their overlooked contributions', role: 'scapegoat' },
                { strategy: 'Appeal to their sense of responsibility', role: 'caretaker' },
                { strategy: 'Acknowledge their achievements publicly', role: 'hero' },
              ]).map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">{s.strategy}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Loyalty Conflicts */}
          {analysis.loyaltyConflicts && analysis.loyaltyConflicts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Identified Loyalty Conflicts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.loyaltyConflicts.map((conflict: string, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-amber-500/10 text-sm">
                      {conflict}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No family systems analysis available</p>
            <Button onClick={handleAnalyze} className="mt-4" disabled={isAnalyzing}>
              Generate Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FamilySystemsPanel;
