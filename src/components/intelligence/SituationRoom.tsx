/**
 * AGIS Phase 10: Situation Room
 * 
 * Real-time tactical command center for active operations and crisis management.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, MapPin, Clock, Users, AlertCircle, 
  MessageSquare, Video, Phone, FileText, Zap,
  Play, Pause, Square, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ActiveOperation {
  id: string;
  name: string;
  type: 'influence' | 'intel_gathering' | 'counter_intel' | 'relationship';
  status: 'active' | 'paused' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  targetId?: string;
  targetName?: string;
  phase: string;
  nextAction?: string;
}

interface LiveFeed {
  id: string;
  type: 'communication' | 'location' | 'behavioral' | 'network';
  source: string;
  content: string;
  timestamp: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  analyzed: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'offline';
  currentTask?: string;
}

export function SituationRoom() {
  const [activeOperations, setActiveOperations] = useState<ActiveOperation[]>([]);
  const [liveFeeds, setLiveFeeds] = useState<LiveFeed[]>([]);
  const [operationalClock, setOperationalClock] = useState(new Date());
  const [alertLevel, setAlertLevel] = useState<'green' | 'yellow' | 'orange' | 'red'>('green');

  useEffect(() => {
    // Update operational clock
    const timer = setInterval(() => {
      setOperationalClock(new Date());
    }, 1000);

    // Initialize mock data
    setActiveOperations([
      {
        id: '1',
        name: 'Operation Insight',
        type: 'intel_gathering',
        status: 'active',
        progress: 67,
        startTime: new Date(Date.now() - 3600000 * 4),
        targetName: 'Alpha Network',
        phase: 'Data Collection',
        nextAction: 'Cross-reference behavioral patterns'
      },
      {
        id: '2',
        name: 'Project Cascade',
        type: 'influence',
        status: 'active',
        progress: 45,
        startTime: new Date(Date.now() - 3600000 * 12),
        targetName: 'Key Decision Maker',
        phase: 'Rapport Building',
        nextAction: 'Deploy reciprocity trigger'
      },
      {
        id: '3',
        name: 'Shield Protocol',
        type: 'counter_intel',
        status: 'paused',
        progress: 82,
        startTime: new Date(Date.now() - 3600000 * 24),
        phase: 'Threat Assessment',
        nextAction: 'Awaiting adversary movement'
      }
    ]);

    setLiveFeeds([
      {
        id: '1',
        type: 'behavioral',
        source: 'Micro-Expression Analyzer',
        content: 'Detected concealment pattern in Target Alpha during video call',
        timestamp: new Date(),
        priority: 'high',
        analyzed: true
      },
      {
        id: '2',
        type: 'network',
        source: 'Network Propagation Engine',
        content: 'Influence cascade detected in secondary network cluster',
        timestamp: new Date(Date.now() - 120000),
        priority: 'medium',
        analyzed: true
      },
      {
        id: '3',
        type: 'communication',
        source: 'Communication Monitor',
        content: 'New high-value conversation intercepted',
        timestamp: new Date(Date.now() - 300000),
        priority: 'critical',
        analyzed: false
      }
    ]);

    return () => clearInterval(timer);
  }, []);

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 border-red-400/30';
      case 'high': return 'text-orange-400 border-orange-400/30';
      case 'medium': return 'text-yellow-400 border-yellow-400/30';
      case 'low': return 'text-green-400 border-green-400/30';
      default: return 'text-muted-foreground';
    }
  };

  const getOperationTypeIcon = (type: string) => {
    switch (type) {
      case 'influence': return <Zap className="h-4 w-4 text-purple-400" />;
      case 'intel_gathering': return <Radio className="h-4 w-4 text-blue-400" />;
      case 'counter_intel': return <AlertCircle className="h-4 w-4 text-orange-400" />;
      case 'relationship': return <Users className="h-4 w-4 text-green-400" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDuration = (start: Date) => {
    const diff = Date.now() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Situation Room Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-6"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <Radio className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Situation Room
              </h1>
              <p className="text-slate-400 text-sm">
                Real-Time Tactical Command • Active Operations: {activeOperations.filter(o => o.status === 'active').length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Operational Clock */}
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-2xl font-mono text-white">
                  {operationalClock.toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {operationalClock.toLocaleDateString()}
              </div>
            </div>
            
            {/* Alert Level */}
            <div className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded-full animate-pulse ${getAlertColor(alertLevel)}`} />
              <span className="text-sm font-medium text-white uppercase">
                {alertLevel} Alert
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Operations */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Active Operations
            </CardTitle>
            <Button variant="outline" size="sm">
              New Operation
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-4">
                {activeOperations.map((op) => (
                  <motion.div
                    key={op.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getOperationTypeIcon(op.type)}
                        <div>
                          <h3 className="font-semibold">{op.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {op.targetName && `Target: ${op.targetName} • `}
                            Duration: {formatDuration(op.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={op.status === 'active' ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}
                        >
                          {op.status}
                        </Badge>
                        <div className="flex gap-1">
                          {op.status === 'active' ? (
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Pause className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Square className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Phase: {op.phase}</span>
                        <span className="font-medium">{op.progress}%</span>
                      </div>
                      <Progress value={op.progress} className="h-2" />
                      {op.nextAction && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <span className="text-primary">Next:</span> {op.nextAction}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Live Intelligence Feed */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-5 w-5 text-blue-400 animate-pulse" />
              Live Feed
            </CardTitle>
            <Button variant="ghost" size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {liveFeeds.map((feed, index) => (
                  <motion.div
                    key={feed.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border ${
                      !feed.analyzed ? 'bg-primary/5 border-primary/30' : 'bg-background/50 border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className={getPriorityColor(feed.priority)}>
                        {feed.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {feed.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mb-1">{feed.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        via {feed.source}
                      </span>
                      {!feed.analyzed && (
                        <Badge className="bg-primary/20 text-primary text-xs">
                          NEW
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comm Center
              </Button>
              <Button variant="outline" className="gap-2">
                <Video className="h-4 w-4" />
                Video Intel
              </Button>
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                Geo Tracking
              </Button>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">System Load:</span>
              <Progress value={72} className="w-24 h-2" />
              <span className="text-sm font-medium">72%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
