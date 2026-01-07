import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClearance } from "@/hooks/useClearance";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export function AdminBootstrap() {
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const { userRole } = useClearance();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    try {
      const { data, error } = await supabase.rpc('bootstrap_first_admin');
      
      if (error) {
        console.error('Bootstrap error:', error);
        toast.error('Failed to bootstrap admin: ' + error.message);
        return;
      }

      if (data === true) {
        setBootstrapped(true);
        toast.success('You are now the system administrator with SCI clearance');
        queryClient.invalidateQueries({ queryKey: ['user-role', user?.id] });
      } else {
        toast.error('Admin bootstrap not available - an admin already exists');
      }
    } catch (err) {
      console.error('Bootstrap error:', err);
      toast.error('Failed to bootstrap admin');
    } finally {
      setIsBootstrapping(false);
    }
  };

  // If already admin, show success state
  if (userRole?.role === 'admin') {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            Admin Access Active
          </CardTitle>
          <CardDescription>
            You have full administrative access with {userRole?.clearance?.toUpperCase()} clearance
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          First-Time Setup Required
        </CardTitle>
        <CardDescription>
          No administrator has been configured yet. As the first user, you can claim admin privileges.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Claiming admin privileges will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Grant you full system administrator role</li>
              <li>Set your clearance level to SCI (highest)</li>
              <li>Enable access to all security features</li>
              <li>Allow you to manage other users' roles and clearances</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleBootstrap} 
            disabled={isBootstrapping || bootstrapped}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            {isBootstrapping ? 'Claiming Admin Access...' : 'Claim Admin Privileges'}
          </Button>

          {bootstrapped && (
            <p className="text-sm text-green-600 text-center">
              ✓ Admin privileges claimed successfully
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}