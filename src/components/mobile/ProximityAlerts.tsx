/**
 * ProximityAlerts - List of nearby Bluetooth/location-detected contacts
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, MapPin, Phone, MessageSquare, Navigation, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useBackgroundLocation } from '@/hooks/useBackgroundLocation';
import { formatDistanceToNow } from 'date-fns';

interface ProximityAlertsProps {
  className?: string;
  maxItems?: number;
}

export function ProximityAlerts({ className, maxItems = 10 }: ProximityAlertsProps) {
  const navigate = useNavigate();
  const { nearbyContacts, isTracking } = useBackgroundLocation();

  const handleViewProfile = (profileId: string) => {
    navigate(`/contacts/${profileId}`);
  };

  const handleCall = (profileId: string) => {
    // Trigger call action
    console.log('Calling:', profileId);
  };

  const handleMessage = (profileId: string) => {
    // Navigate to communications
    navigate('/communications');
  };

  const displayContacts = nearbyContacts.slice(0, maxItems);

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            Nearby Contacts
          </CardTitle>
          <Badge variant={isTracking ? 'default' : 'secondary'}>
            {isTracking ? `${nearbyContacts.length} nearby` : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!isTracking ? (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Location tracking is disabled</p>
            <p className="text-xs">Enable to detect nearby contacts</p>
          </div>
        ) : displayContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No contacts nearby</p>
            <p className="text-xs">Contacts will appear when detected</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              <AnimatePresence>
                {displayContacts.map((contact, index) => (
                  <motion.div
                    key={contact.profileId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{contact.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {contact.name || 'Unknown Contact'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{contact.distance ? `${Math.round(contact.distance)}m away` : 'Nearby'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCall(contact.profileId)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMessage(contact.profileId)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewProfile(contact.profileId)}
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
