import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, RotateCcw, Clock, Shield, AlertTriangle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, isPast } from "date-fns";
import { invokeFunction } from '@/lib/api';

interface KeySchedule {
  id: string;
  key_name: string;
  rotation_interval_days: number;
  last_rotated_at: string | null;
  next_rotation_at: string | null;
  auto_rotate: boolean;
}

export function KeyRotationPanel() {
  const queryClient = useQueryClient();
  const [isRotating, setIsRotating] = useState<string | null>(null);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['key-rotation-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_rotation_schedule')
        .select('*')
        .order('key_name');
      
      if (error) throw error;
      return data as KeySchedule[];
    }
  });

  const { data: encryptionKeys } = useQuery({
    queryKey: ['encryption-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encryption_keys')
        .select('key_name, created_at, is_active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<KeySchedule> }) => {
      const { error } = await supabase
        .from('key_rotation_schedule')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['key-rotation-schedules'] });
      toast.success('Schedule updated');
    }
  });

  const handleRotateNow = async (keyName: string) => {
    setIsRotating(keyName);
    try {
      const { data, error } = await invokeFunction('rotate-encryption-keys', { keyName });

      if (error) throw error;

      toast.success(`Key "${keyName}" rotated successfully`);
      queryClient.invalidateQueries({ queryKey: ['key-rotation-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['encryption-keys'] });
    } catch (err) {
      console.error('Rotation error:', err);
      toast.error('Failed to rotate key');
    } finally {
      setIsRotating(null);
    }
  };

  const createSchedule = async (keyName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('key_rotation_schedule').insert({
      user_id: user.id,
      key_name: keyName,
      rotation_interval_days: 90,
      next_rotation_at: addDays(new Date(), 90).toISOString()
    });

    queryClient.invalidateQueries({ queryKey: ['key-rotation-schedules'] });
    toast.success('Rotation schedule created');
  };

  const keysWithoutSchedule = encryptionKeys?.filter(
    key => !schedules?.some(s => s.key_name === key.key_name)
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Key className="h-5 w-5" />
          Key Rotation Management
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage encryption key rotation schedules for enhanced security
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {encryptionKeys?.filter(k => k.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Scheduled Rotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {schedules?.filter(s => s.next_rotation_at && isPast(new Date(s.next_rotation_at))).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {keysWithoutSchedule.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Keys Without Rotation Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keysWithoutSchedule.map(key => (
                <Button
                  key={key.key_name}
                  variant="outline"
                  size="sm"
                  onClick={() => createSchedule(key.key_name)}
                >
                  Schedule: {key.key_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rotation Schedules</CardTitle>
          <CardDescription>
            Configure automatic key rotation intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : schedules?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No rotation schedules configured</p>
              <p className="text-xs mt-1">Create schedules from the encryption keys list</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules?.map((schedule) => {
                const isOverdue = schedule.next_rotation_at && isPast(new Date(schedule.next_rotation_at));
                
                return (
                  <div
                    key={schedule.id}
                    className={`p-4 rounded-lg border ${isOverdue ? 'border-red-500/20 bg-red-500/5' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          <span className="font-medium">{schedule.key_name}</span>
                          {isOverdue && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                          {schedule.auto_rotate && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">
                              <Check className="h-3 w-3 mr-1" /> Auto
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Every {schedule.rotation_interval_days} days
                          </span>
                          {schedule.last_rotated_at && (
                            <span>Last: {format(new Date(schedule.last_rotated_at), 'PP')}</span>
                          )}
                          {schedule.next_rotation_at && (
                            <span>Next: {format(new Date(schedule.next_rotation_at), 'PP')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Auto</span>
                          <Switch
                            checked={schedule.auto_rotate}
                            onCheckedChange={(checked) => 
                              updateSchedule.mutate({ 
                                id: schedule.id, 
                                updates: { auto_rotate: checked } 
                              })
                            }
                          />
                        </div>
                        <Select
                          value={schedule.rotation_interval_days.toString()}
                          onValueChange={(value) =>
                            updateSchedule.mutate({
                              id: schedule.id,
                              updates: { 
                                rotation_interval_days: parseInt(value),
                                next_rotation_at: addDays(new Date(), parseInt(value)).toISOString()
                              }
                            })
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                            <SelectItem value="365">365 days</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isRotating === schedule.key_name}
                          onClick={() => handleRotateNow(schedule.key_name)}
                        >
                          <RotateCcw className={`h-4 w-4 mr-1 ${isRotating === schedule.key_name ? 'animate-spin' : ''}`} />
                          Rotate Now
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}