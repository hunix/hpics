import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback } from 'react';
import { toast } from 'sonner';

export type ClearanceLevel = 'uncleared' | 'confidential' | 'secret' | 'top_secret' | 'sci';
export type AppRole = 'admin' | 'supervisor' | 'analyst' | 'viewer';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  clearance: ClearanceLevel;
  clearance_granted_at: string | null;
  clearance_expires_at: string | null;
  compartments: string[];
  created_at: string;
}

const CLEARANCE_HIERARCHY: Record<ClearanceLevel, number> = {
  uncleared: 0,
  confidential: 1,
  secret: 2,
  top_secret: 3,
  sci: 4,
};

const CLEARANCE_LABELS: Record<ClearanceLevel, string> = {
  uncleared: 'Uncleared',
  confidential: 'Confidential',
  secret: 'Secret',
  top_secret: 'Top Secret',
  sci: 'SCI',
};

const CLEARANCE_COLORS: Record<ClearanceLevel, string> = {
  uncleared: 'text-muted-foreground',
  confidential: 'text-blue-600',
  secret: 'text-yellow-600',
  top_secret: 'text-orange-600',
  sci: 'text-red-600',
};

export function useClearance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's role and clearance
  const { data: userRole, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        // If no role exists, return default
        if (error.code === 'PGRST116') {
          return {
            role: 'viewer' as AppRole,
            clearance: 'uncleared' as ClearanceLevel,
            compartments: [],
          };
        }
        throw error;
      }
      return data as UserRole;
    },
    enabled: !!user,
  });

  // Check if user has required clearance
  const hasClearance = useCallback(
    (required: ClearanceLevel): boolean => {
      if (!userRole) return false;
      const userLevel = CLEARANCE_HIERARCHY[userRole.clearance];
      const requiredLevel = CLEARANCE_HIERARCHY[required];
      
      // Check expiration
      const expiresAt = 'clearance_expires_at' in userRole ? userRole.clearance_expires_at : null;
      if (expiresAt) {
        const expires = new Date(expiresAt);
        if (expires < new Date()) return false;
      }
      
      return userLevel >= requiredLevel;
    },
    [userRole]
  );

  // Check if user has required role
  const hasRole = useCallback(
    (required: AppRole): boolean => {
      if (!userRole) return false;
      const roleHierarchy: Record<AppRole, number> = {
        viewer: 0,
        analyst: 1,
        supervisor: 2,
        admin: 3,
      };
      return roleHierarchy[userRole.role] >= roleHierarchy[required];
    },
    [userRole]
  );

  // Check compartment access
  const hasCompartment = useCallback(
    (compartment: string): boolean => {
      if (!userRole) return false;
      return userRole.compartments?.includes(compartment) || false;
    },
    [userRole]
  );

  // Grant clearance (admin only)
  const grantClearanceMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      clearance,
      expiresAt,
    }: {
      targetUserId: string;
      clearance: ClearanceLevel;
      expiresAt?: string;
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: targetUserId,
          clearance,
          clearance_granted_at: new Date().toISOString(),
          clearance_expires_at: expiresAt || null,
          granted_by: user!.id,
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast.success('Clearance granted successfully');
    },
    onError: (error) => {
      toast.error('Failed to grant clearance');
      console.error(error);
    },
  });

  // Update user role (admin only)
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      role,
    }: {
      targetUserId: string;
      role: AppRole;
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: targetUserId,
          role,
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast.success('Role updated successfully');
    },
  });

  // Add compartment access
  const addCompartmentMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      compartment,
    }: {
      targetUserId: string;
      compartment: string;
    }) => {
      // Get current compartments
      const { data: current } = await supabase
        .from('user_roles')
        .select('compartments')
        .eq('user_id', targetUserId)
        .single();

      const currentCompartments = current?.compartments || [];
      if (!currentCompartments.includes(compartment)) {
        const { error } = await supabase
          .from('user_roles')
          .update({
            compartments: [...currentCompartments, compartment],
          })
          .eq('user_id', targetUserId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast.success('Compartment access granted');
    },
  });

  return {
    userRole,
    isLoading,
    hasClearance,
    hasRole,
    hasCompartment,
    grantClearance: grantClearanceMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    addCompartment: addCompartmentMutation.mutate,
    isAdmin: userRole?.role === 'admin',
    currentClearance: userRole?.clearance || 'uncleared',
    currentRole: userRole?.role || 'viewer',
    CLEARANCE_HIERARCHY,
    CLEARANCE_LABELS,
    CLEARANCE_COLORS,
  };
}
