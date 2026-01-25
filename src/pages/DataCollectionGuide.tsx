/**
 * DataCollectionGuide Page (v4.0)
 * Comprehensive guide for maximizing intelligence coverage through data collection
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Search, 
  User, 
  ChevronRight,
  Filter,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useDataCollectionStatus } from '@/hooks/useDataCollectionStatus';
import { DataCategoryCard } from '@/components/data-guide/DataCategoryCard';
import { CollectionProgress } from '@/components/data-guide/CollectionProgress';
import { AnalysisEnablementMatrix } from '@/components/data-guide/AnalysisEnablementMatrix';
import { cn } from '@/lib/utils';

export default function DataCollectionGuide() {
  const navigate = useNavigate();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Fetch user's profiles for selection
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles-for-guide'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('first_name');
      
      return data || [];
    },
  });

  // Fetch data collection status for selected profile
  const { data: collectionStatus, isLoading: statusLoading } = useDataCollectionStatus(selectedProfileId);

  // Filter categories based on search and priority
  const filteredCategories = useMemo(() => {
    if (!collectionStatus?.categories) return [];
    
    return collectionStatus.categories.filter((cat) => {
      const matchesSearch = !searchQuery || 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || cat.priority === priorityFilter;
      
      return matchesSearch && matchesPriority;
    });
  }, [collectionStatus?.categories, searchQuery, priorityFilter]);

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Intelligence Collection Guide"
        description="Maximize your target intelligence coverage with comprehensive data collection"
        icon={BookOpen}
        actions={
          <Button variant="outline" onClick={() => navigate('/dossier-intelligence')}>
            <Sparkles className="w-4 h-4 mr-2" />
            Run Analysis
          </Button>
        }
      />

      {/* Profile Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Select Target Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profilesLoading ? (
            <div className="animate-pulse h-10 bg-muted rounded-lg" />
          ) : profiles && profiles.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {profiles.slice(0, 12).map((profile) => (
                <Button
                  key={profile.id}
                  variant={selectedProfileId === profile.id ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start truncate"
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium">
                        {(profile.first_name?.[0] || '?').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="truncate">
                    {profile.first_name} {profile.last_name}
                  </span>
                </Button>
              ))}
              {profiles.length > 12 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/contacts')}
                >
                  +{profiles.length - 12} more
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-3">No profiles found. Create a contact to get started.</p>
              <Button onClick={() => navigate('/contacts')}>
                Create Contact
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProfileId && collectionStatus ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Data Categories</TabsTrigger>
            <TabsTrigger value="matrix">Analysis Matrix</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Section */}
              <div className="lg:col-span-1">
                <CollectionProgress status={collectionStatus} />
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Priority Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {collectionStatus.categories
                      .filter(c => !c.isComplete && (c.priority === 'critical' || c.priority === 'high'))
                      .slice(0, 4)
                      .map((cat) => (
                        <div 
                          key={cat.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{cat.name}</span>
                              <Badge 
                                variant={cat.priority === 'critical' ? 'destructive' : 'default'}
                                className="text-xs"
                              >
                                {cat.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {cat.weight}% coverage • Unlocks: {cat.unlocks.slice(0, 2).join(', ')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const path = cat.collectionPath.replace(':id', selectedProfileId);
                              navigate(path);
                            }}
                          >
                            Collect
                            <ArrowUpRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      ))}
                    {collectionStatus.categories.filter(c => !c.isComplete && (c.priority === 'critical' || c.priority === 'high')).length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>All critical and high priority data collected! 🎉</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-primary">
                      {collectionStatus.categories.reduce((sum, c) => sum + c.itemCount, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Data Points</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-emerald-600">
                      {collectionStatus.categoryBreakdown.complete}
                    </div>
                    <div className="text-xs text-muted-foreground">Complete Categories</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-amber-600">
                      {collectionStatus.analysesUnlocked}
                    </div>
                    <div className="text-xs text-muted-foreground">Analyses Ready</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-rose-600">
                      {collectionStatus.totalAnalyses - collectionStatus.analysesUnlocked}
                    </div>
                    <div className="text-xs text-muted-foreground">Locked Analyses</div>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search data categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex gap-1">
                  {['all', 'critical', 'high', 'medium', 'low'].map((priority) => (
                    <Button
                      key={priority}
                      variant={priorityFilter === priority ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPriorityFilter(priority)}
                      className="capitalize"
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCategories.map((category) => (
                <DataCategoryCard
                  key={category.id}
                  category={category}
                  profileId={selectedProfileId}
                />
              ))}
            </div>

            {filteredCategories.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No categories match your filters</p>
              </div>
            )}
          </TabsContent>

          {/* Matrix Tab */}
          <TabsContent value="matrix">
            <AnalysisEnablementMatrix categories={collectionStatus.categories} />
          </TabsContent>
        </Tabs>
      ) : selectedProfileId && statusLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse h-48 bg-muted rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="animate-pulse h-32 bg-muted rounded-lg" />
            <div className="animate-pulse h-32 bg-muted rounded-lg" />
          </div>
        </div>
      ) : (
        <Card className="py-16">
          <CardContent className="text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Profile to Begin</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose a target profile above to see their current data collection status and get personalized recommendations for maximizing intelligence coverage.
            </p>
          </CardContent>
        </Card>
      )}

      {/* General Guide Section (always visible) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Collection Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 not-prose">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">🎯 Priority Order</h4>
              <p className="text-xs text-muted-foreground">
                Start with Critical data (Profile, Email, Communications) to unlock core analyses.
                Then move to High priority (Voice, Media, Observations) for behavioral insights.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">📊 Quality over Quantity</h4>
              <p className="text-xs text-muted-foreground">
                10 validated observations are more valuable than 100 unverified notes.
                Mark observation validation status and update as you verify information.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">🔄 Regular Updates</h4>
              <p className="text-xs text-muted-foreground">
                Re-run analyses periodically as new data is collected.
                Temporal patterns emerge from consistent data collection over time.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">🔗 Cross-Reference Data</h4>
              <p className="text-xs text-muted-foreground">
                Link communications to specific contacts. Tag media with relevant profiles.
                Connected data enables powerful cross-modal fusion analysis.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">📁 Organize Documents</h4>
              <p className="text-xs text-muted-foreground">
                Categorize documents by type (Financial, Legal, Identity).
                OCR automatically extracts text for search and analysis.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">🎤 Voice Quality</h4>
              <p className="text-xs text-muted-foreground">
                Clear recordings enable better transcription and vocal analysis.
                Minimum 30 seconds required for biometric voice enrollment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
