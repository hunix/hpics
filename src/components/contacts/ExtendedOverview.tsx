import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, Calendar, Heart, MapPin, Languages, Smartphone, 
  Car, Building2, Plane, CreditCard, Droplet, Cigarette
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';

interface ExtendedOverviewProps {
  profileId: string;
  profile: {
    first_name: string;
    last_name?: string | null;
    organization?: string | null;
    job_title?: string | null;
    tags?: string[] | null;
    notes?: string | null;
  };
}

export function ExtendedOverview({ profileId, profile }: ExtendedOverviewProps) {
  const { data: personalInfo, isLoading: loadingPersonal } = useQuery({
    queryKey: ['contact-personal-info', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_personal_info')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();
      return data;
    },
  });

  const { data: languages } = useQuery({
    queryKey: ['contact-languages', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_languages')
        .select('*')
        .eq('profile_id', profileId);
      return data ?? [];
    },
  });

  const { data: devices } = useQuery({
    queryKey: ['contact-devices', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_devices')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_current', true);
      return data ?? [];
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ['contact-vehicles', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_vehicles')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_current', true);
      return data ?? [];
    },
  });

  const { data: properties } = useQuery({
    queryKey: ['contact-properties', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_properties')
        .select('*')
        .eq('profile_id', profileId);
      return data ?? [];
    },
  });

  const { data: recentTravels } = useQuery({
    queryKey: ['contact-travel-recent', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_travel_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('travel_date', { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const age = personalInfo?.date_of_birth
    ? differenceInYears(new Date(), new Date(personalInfo.date_of_birth))
    : null;

  return (
    <div className="space-y-6">
      {/* Bio & Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.notes && <p className="text-muted-foreground">{profile.notes}</p>}
          
          {/* Quick Stats Row */}
          {personalInfo && (
            <div className="flex flex-wrap gap-3">
              {age && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {age} years old
                </Badge>
              )}
              {personalInfo.gender && (
                <Badge variant="secondary">{personalInfo.gender}</Badge>
              )}
              {personalInfo.blood_group && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Droplet className="h-3 w-3" />
                  {personalInfo.blood_group}{personalInfo.rh_type}
                </Badge>
              )}
              {personalInfo.nationality && (
                <Badge variant="secondary">{personalInfo.nationality}</Badge>
              )}
              {personalInfo.smoking_preference && personalInfo.smoking_preference !== 'None' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Cigarette className="h-3 w-3" />
                  {personalInfo.smoking_preference}
                </Badge>
              )}
              {personalInfo.favorite_color && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {personalInfo.favorite_color}
                </Badge>
              )}
            </div>
          )}

          {/* Location */}
          {personalInfo && (personalInfo.main_residence_city || personalInfo.main_residence_country) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                Lives in {[personalInfo.main_residence_city, personalInfo.main_residence_country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">Speaks:</span>
              {languages.map((lang) => (
                <Badge key={lang.id} variant={lang.is_native ? 'default' : 'outline'} className="text-xs">
                  {lang.language_name}
                  {lang.is_native && ' ★'}
                </Badge>
              ))}
            </div>
          )}

          {/* Tags */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assets Overview */}
      {((devices && devices.length > 0) || (vehicles && vehicles.length > 0) || (properties && properties.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assets & Belongings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Devices */}
            {devices && devices.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Smartphone className="h-4 w-4" />
                  Devices
                </div>
                <div className="flex flex-wrap gap-2">
                  {devices.slice(0, 4).map((device) => (
                    <Badge key={device.id} variant="secondary">
                      {device.brand} {device.model}
                    </Badge>
                  ))}
                  {devices.length > 4 && <Badge variant="outline">+{devices.length - 4} more</Badge>}
                </div>
              </div>
            )}

            {/* Vehicles */}
            {vehicles && vehicles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Car className="h-4 w-4" />
                  Vehicles
                </div>
                <div className="flex flex-wrap gap-2">
                  {vehicles.map((vehicle) => (
                    <Badge key={vehicle.id} variant="secondary">
                      {vehicle.year && `${vehicle.year} `}{vehicle.make} {vehicle.model}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Properties */}
            {properties && properties.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Properties
                </div>
                <div className="flex flex-wrap gap-2">
                  {properties.map((prop) => (
                    <Badge key={prop.id} variant={prop.is_primary_residence ? 'default' : 'secondary'}>
                      {prop.property_type} in {prop.city || prop.country}
                      {prop.is_primary_residence && ' (Primary)'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Travels */}
      {recentTravels && recentTravels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Recent Travels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTravels.map((travel) => (
                <div key={travel.id} className="flex items-center justify-between text-sm">
                  <span>
                    {travel.destination_city ? `${travel.destination_city}, ` : ''}{travel.destination_country}
                  </span>
                  <span className="text-muted-foreground">
                    {travel.travel_date && format(new Date(travel.travel_date), 'MMM yyyy')}
                    {travel.purpose && ` • ${travel.purpose}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {profile.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
