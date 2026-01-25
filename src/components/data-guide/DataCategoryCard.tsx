/**
 * DataCategoryCard Component (v4.0)
 * Displays individual data category with status and collection instructions
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  ExternalLink,
  User,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Camera,
  Mic,
  FileText,
  Eye,
  Users,
  Calendar,
  Shield,
  Heart,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataCategory } from '@/hooks/useDataCollectionStatus';
import { useNavigate } from 'react-router-dom';

const ICON_MAP: Record<string, React.ElementType> = {
  User, Mail, Phone, Globe, MessageSquare, Camera, Mic, FileText, Eye, Users, Calendar, Shield, Heart, Brain
};

interface DataCategoryCardProps {
  category: DataCategory;
  profileId?: string;
  className?: string;
}

export function DataCategoryCard({ category, profileId, className }: DataCategoryCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const Icon = ICON_MAP[category.icon] || Circle;
  const progress = Math.min((category.itemCount / category.requiredCount) * 100, 100);
  
  const getStatusColor = () => {
    if (category.itemCount >= category.requiredCount) return 'text-emerald-500';
    if (category.isComplete) return 'text-amber-500';
    return 'text-muted-foreground';
  };
  
  const getStatusBg = () => {
    if (category.itemCount >= category.requiredCount) return 'bg-emerald-500/10';
    if (category.isComplete) return 'bg-amber-500/10';
    return 'bg-muted/50';
  };

  const getPriorityBadge = () => {
    const variants: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    };
    return variants[category.priority] || 'secondary';
  };

  const handleNavigate = () => {
    let path = category.collectionPath;
    if (profileId) {
      path = path.replace(':id', profileId);
    }
    navigate(path);
  };

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', getStatusBg(), className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  category.isComplete ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {category.name}
                    <Badge variant={getPriorityBadge()} className="text-xs">
                      {category.priority}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {category.weight}% coverage weight
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn('flex items-center gap-1', getStatusColor())}>
                  {category.itemCount >= category.requiredCount ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : category.isComplete ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {category.itemCount}/{category.requiredCount}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CardContent className="pt-0">
          <Progress value={progress} className="h-1.5 mb-2" />
          <p className="text-sm text-muted-foreground">{category.description}</p>

          <CollapsibleContent className="mt-4 space-y-4">
            {/* Unlocks */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Analyses Unlocked
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {category.unlocks.map((unlock) => (
                  <Badge key={unlock} variant="outline" className="text-xs">
                    {unlock}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                How to Collect
              </h4>
              <ol className="space-y-2">
                {category.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-muted-foreground">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Action Button */}
            {profileId && (
              <Button 
                variant="default" 
                size="sm" 
                className="w-full mt-2"
                onClick={handleNavigate}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Go to Collection Interface
              </Button>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
