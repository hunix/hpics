import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClearance, ClearanceLevel, AppRole } from '@/hooks/useClearance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Shield, ShieldAlert, ShieldCheck, UserCog, Clock, Key } from 'lucide-react';
import { format } from 'date-fns';

interface UserWithRole {
  id: string;
  email: string;
  role: AppRole;
  clearance: ClearanceLevel;
  clearance_expires_at: string | null;
  compartments: string[];
}

export function ClearanceManager() {
  const { user } = useAuth();
  const { isAdmin, grantClearance, updateRole, CLEARANCE_LABELS, CLEARANCE_COLORS } = useClearance();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newClearance, setNewClearance] = useState<ClearanceLevel>('uncleared');
  const [newRole, setNewRole] = useState<AppRole>('viewer');
  const [expiryDays, setExpiryDays] = useState<string>('365');

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      // Get all user roles
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;

      // Get user emails from profiles or use user_id
      const userRoles: UserWithRole[] = roles.map((r: any) => ({
        id: r.user_id,
        email: `User ${r.user_id.slice(0, 8)}...`,
        role: r.role,
        clearance: r.clearance,
        clearance_expires_at: r.clearance_expires_at,
        compartments: r.compartments || [],
      }));

      return userRoles;
    },
    enabled: isAdmin,
  });

  const getClearanceIcon = (clearance: ClearanceLevel) => {
    switch (clearance) {
      case 'uncleared':
        return <Shield className="h-4 w-4" />;
      case 'confidential':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'secret':
        return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      case 'top_secret':
        return <ShieldCheck className="h-4 w-4 text-orange-500" />;
      case 'sci':
        return <Key className="h-4 w-4 text-red-500" />;
    }
  };

  const handleGrantClearance = () => {
    if (!selectedUser) return;
    
    const expiresAt = expiryDays 
      ? new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    grantClearance({
      targetUserId: selectedUser,
      clearance: newClearance,
      expiresAt,
    });
  };

  const handleUpdateRole = () => {
    if (!selectedUser) return;
    updateRole({
      targetUserId: selectedUser,
      role: newRole,
    });
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Clearance Management
          </CardTitle>
          <CardDescription>
            You do not have permission to manage clearances.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Clearance Management
          </CardTitle>
          <CardDescription>
            Manage user roles and security clearances. Changes are logged to the immutable audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Clearance</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Compartments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id} className={selectedUser === u.id ? 'bg-muted' : ''}>
                    <TableCell className="font-mono text-sm">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        <UserCog className="h-3 w-3 mr-1" />
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={CLEARANCE_COLORS[u.clearance]}>
                        {getClearanceIcon(u.clearance)}
                        <span className="ml-1">{CLEARANCE_LABELS[u.clearance]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.clearance_expires_at ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(u.clearance_expires_at), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.compartments.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {u.compartments.map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)}
                      >
                        {selectedUser === u.id ? 'Cancel' : 'Modify'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Modify User Access</CardTitle>
            <CardDescription>
              Update role or clearance for selected user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateRole} className="w-full">
                  Update Role
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Clearance</label>
                <Select value={newClearance} onValueChange={(v) => setNewClearance(v as ClearanceLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncleared">Uncleared</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="secret">Secret</SelectItem>
                    <SelectItem value="top_secret">Top Secret</SelectItem>
                    <SelectItem value="sci">SCI</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Expiry days"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleGrantClearance}>
                    Grant Clearance
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
