import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Shield, AlertTriangle, Zap, Play } from 'lucide-react';
import { useSacredValues } from '@/hooks/intelligence/useSacredValues';

interface SacredValuesPanelProps {
  profileId?: string;
}

export function SacredValuesPanel({ profileId }: SacredValuesPanelProps) {
  const {
    values,
    isLoading,
    analyze,
    isAnalyzing,
  } = useSacredValues(profileId);

  const [newValue, setNewValue] = useState('');
  const [valueCategory, setValueCategory] = useState('');

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'moral': 'bg-violet-500/20 text-violet-400',
      'religious': 'bg-blue-500/20 text-blue-400',
      'political': 'bg-red-500/20 text-red-400',
      'family': 'bg-rose-500/20 text-rose-400',
      'identity': 'bg-amber-500/20 text-amber-400',
      'professional': 'bg-emerald-500/20 text-emerald-400',
    };
    return colors[category?.toLowerCase()] || 'bg-muted text-muted-foreground';
  };

  const getInviolabilityLevel = (score: number) => {
    if (score >= 0.9) return { label: 'Absolute', color: 'text-red-400' };
    if (score >= 0.7) return { label: 'Strong', color: 'text-amber-400' };
    if (score >= 0.5) return { label: 'Moderate', color: 'text-blue-400' };
    return { label: 'Flexible', color: 'text-emerald-400' };
  };

  return (
    <Card className="border-rose-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-400" />
            <CardTitle>Sacred Values Mapper</CardTitle>
          </div>
          {profileId && (
            <Button 
              size="sm" 
              onClick={() => analyze(profileId)}
              disabled={isAnalyzing}
            >
              <Play className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Mapping...' : 'Auto-Map'}
            </Button>
          )}
        </div>
        <CardDescription>
          Identify non-negotiable beliefs and potential violation triggers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="values" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="values">Mapped Values</TabsTrigger>
            <TabsTrigger value="add">Add Value</TabsTrigger>
          </TabsList>

          <TabsContent value="values" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading values...</div>
            ) : values.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {profileId ? 'No values mapped yet. Run auto-mapping or add manually.' : 'Select a profile to view values.'}
              </div>
            ) : (
              <div className="space-y-3">
                {values.map((value) => (
                  <Card key={value.id} className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{value.value_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${getInviolabilityLevel(value.protection_level || 0).color}`}>
                              {getInviolabilityLevel(value.protection_level || 0).label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {Math.round((value.protection_level || 0) * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Protection</p>
                        </div>
                      </div>

                      <Progress value={(value.protection_level || 0) * 100} className="h-2 mb-3" />

                      {value.violation_triggers && value.violation_triggers.length > 0 && (
                        <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <span className="text-sm font-medium text-red-400">Violation Triggers</span>
                          </div>
                          <ul className="space-y-1">
                            {value.violation_triggers.slice(0, 3).map((trigger, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                                <Zap className="h-3 w-3 text-red-400" />
                                {trigger}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              Use Auto-Map to analyze and extract sacred values automatically.
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
          <div className="text-center">
            <Shield className="h-5 w-5 mx-auto mb-1 text-rose-400" />
            <p className="text-2xl font-bold">{values.length}</p>
            <p className="text-xs text-muted-foreground">Mapped</p>
          </div>
          <div className="text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-400" />
            <p className="text-2xl font-bold">
              {values.filter(v => (v.protection_level || 0) >= 0.9).length}
            </p>
            <p className="text-xs text-muted-foreground">Absolute</p>
          </div>
          <div className="text-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-red-400" />
            <p className="text-2xl font-bold">
              {values.reduce((acc, v) => acc + (v.violation_triggers?.length || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Triggers</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
