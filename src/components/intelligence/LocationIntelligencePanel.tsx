import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, Navigation, Clock, Calendar, Globe, 
  Home, Building, Plane, TrendingUp, Eye,
  Plus, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { LocationManager } from './LocationManager';

interface LocationIntelligencePanelProps {
  profileId: string;
  profileName?: string;
}

interface ContactLocation {
  id: string;
  location_type: string;
  location_name: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  confidence_score: number | null;
  source: string | null;
  is_current: boolean | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  visit_count: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const locationTypeIcons: Record<string, React.ElementType> = {
  home: Home,
  work: Building,
  travel: Plane,
  current: Navigation,
  frequent: TrendingUp,
  default: MapPin,
};

const locationTypeColors: Record<string, string> = {
  home: 'bg-green-500/10 text-green-500 border-green-500/20',
  work: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  travel: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  current: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  frequent: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

export function LocationIntelligencePanel({ profileId, profileName }: LocationIntelligencePanelProps) {
  const { user } = useAuth();
  const [showManager, setShowManager] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ContactLocation | null>(null);

  const { data: locations, isLoading, refetch } = useQuery({
    queryKey: ['contact-locations', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_locations')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user?.id ?? '')
        .order('is_current', { ascending: false })
        .order('last_seen_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as ContactLocation[];
    },
    enabled: !!user && !!profileId,
  });

  const currentLocation = locations?.find(l => l.is_current);
  const homeLocation = locations?.find(l => l.location_type === 'home');
  const workLocation = locations?.find(l => l.location_type === 'work');
  const travelHistory = locations?.filter(l => l.location_type === 'travel') || [];
  const frequentLocations = locations?.filter(l => (l.visit_count || 0) > 1) || [];

  const getLocationIcon = (type: string) => {
    const Icon = locationTypeIcons[type] || locationTypeIcons.default;
    return Icon;
  };

  const formatLocation = (loc: ContactLocation) => {
    const parts = [loc.city, loc.region, loc.country].filter(Boolean);
    return parts.join(', ') || loc.address || loc.location_name || 'Unknown location';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (showManager) {
    return (
      <LocationManager
        profileId={profileId}
        profileName={profileName}
        location={selectedLocation}
        onBack={() => {
          setShowManager(false);
          setSelectedLocation(null);
          refetch();
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Geographic Intelligence
          </CardTitle>
          <CardDescription>
            Location history and movement patterns for {profileName || 'this contact'}
          </CardDescription>
        </div>
        <Button onClick={() => setShowManager(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Location
        </Button>
      </CardHeader>
      <CardContent>
        {!locations || locations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No location data available</p>
            <p className="text-sm mt-1">Add locations to track geographic intelligence</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowManager(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add First Location
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Current Location */}
              {currentLocation && (
                <div className="p-4 rounded-lg border bg-orange-500/5 border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-orange-500">Current Location</span>
                  </div>
                  <p className="text-lg font-semibold">{formatLocation(currentLocation)}</p>
                  {currentLocation.last_seen_at && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Last confirmed {formatDistanceToNow(new Date(currentLocation.last_seen_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              )}

              {/* Key Locations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homeLocation && (
                  <div 
                    className="p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedLocation(homeLocation);
                      setShowManager(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Home</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{formatLocation(homeLocation)}</p>
                  </div>
                )}

                {workLocation && (
                  <div 
                    className="p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedLocation(workLocation);
                      setShowManager(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Work</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{formatLocation(workLocation)}</p>
                  </div>
                )}
              </div>

              {/* Location Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{locations.length}</p>
                  <p className="text-sm text-muted-foreground">Total Locations</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {new Set(locations.map(l => l.country).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Countries</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{travelHistory.length}</p>
                  <p className="text-sm text-muted-foreground">Travel Records</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {locations.map((location) => {
                    const Icon = getLocationIcon(location.location_type);
                    const colorClass = locationTypeColors[location.location_type] || 'bg-muted text-muted-foreground';
                    
                    return (
                      <div
                        key={location.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedLocation(location);
                          setShowManager(true);
                        }}
                      >
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{formatLocation(location)}</p>
                            {location.is_current && (
                              <Badge variant="outline" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="capitalize">{location.location_type}</span>
                            {location.visit_count && location.visit_count > 1 && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {location.visit_count} visits
                              </span>
                            )}
                            {location.last_seen_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(location.last_seen_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          {location.source && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Source: {location.source}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="patterns" className="mt-4">
              <div className="space-y-6">
                {/* Frequent Locations */}
                {frequentLocations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Frequent Locations
                    </h4>
                    <div className="space-y-2">
                      {frequentLocations.slice(0, 5).map((loc) => (
                        <div key={loc.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <span>{formatLocation(loc)}</span>
                          <Badge variant="outline">{loc.visit_count} visits</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Travel Timeline */}
                {travelHistory.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Travel History
                    </h4>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-4">
                        {travelHistory.slice(0, 10).map((travel) => (
                          <div key={travel.id} className="flex items-start gap-4 pl-8 relative">
                            <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-purple-500 border-2 border-background" />
                            <div className="flex-1">
                              <p className="font-medium">{formatLocation(travel)}</p>
                              {travel.first_seen_at && (
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(travel.first_seen_at), 'MMM d, yyyy')}
                                  {travel.last_seen_at && travel.first_seen_at !== travel.last_seen_at && (
                                    <> - {format(new Date(travel.last_seen_at), 'MMM d, yyyy')}</>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timezone Distribution */}
                {locations.some(l => l.timezone) && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timezone Coverage
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(locations.map(l => l.timezone).filter(Boolean))].map((tz) => (
                        <Badge key={tz} variant="secondary">{tz}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {frequentLocations.length === 0 && travelHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Not enough data for pattern analysis</p>
                    <p className="text-sm mt-1">Add more locations to see movement patterns</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
