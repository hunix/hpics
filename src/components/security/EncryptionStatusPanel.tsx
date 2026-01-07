import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClearance } from '@/hooks/useClearance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Key, Shield, CheckCircle, AlertTriangle, Database } from 'lucide-react';

// Tables that should be encrypted
const SENSITIVE_TABLES = [
  { table: 'oauth_tokens', columns: ['access_token', 'refresh_token'], classification: 'top_secret' },
  { table: 'contact_bank_accounts', columns: ['account_number', 'iban', 'swift_code'], classification: 'secret' },
  { table: 'contact_payment_accounts', columns: ['account_identifier'], classification: 'secret' },
  { table: 'contact_identity_documents', columns: ['document_number'], classification: 'secret' },
  { table: 'contact_biometrics', columns: ['facial_embedding', 'voice_embedding'], classification: 'top_secret' },
  { table: 'contact_personal_info', columns: ['date_of_birth', 'blood_group', 'allergies'], classification: 'confidential' },
  { table: 'psychological_profiles', columns: ['personality_traits', 'vulnerabilities'], classification: 'top_secret' },
  { table: 'trust_assessments', columns: ['deception_indicators', 'ai_assessment'], classification: 'secret' },
  { table: 'messages', columns: ['content'], classification: 'confidential' },
  { table: 'email_messages', columns: ['body_html', 'subject'], classification: 'confidential' },
];

export function EncryptionStatusPanel() {
  const { user } = useAuth();
  const { CLEARANCE_LABELS, CLEARANCE_COLORS, isAdmin } = useClearance();

  // Fetch encryption status
  const { data: encryptedFields, isLoading } = useQuery({
    queryKey: ['encrypted-fields', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encrypted_fields')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch encryption keys
  const { data: encryptionKeys } = useQuery({
    queryKey: ['encryption-keys', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encryption_keys')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  // Calculate encryption coverage
  const totalFields = SENSITIVE_TABLES.reduce((sum, t) => sum + t.columns.length, 0);
  const encryptedCount = encryptedFields?.filter((f) => f.encryption_enabled).length || 0;
  const coveragePercent = Math.round((encryptedCount / totalFields) * 100);

  // Group by classification
  const byClassification = SENSITIVE_TABLES.reduce(
    (acc, table) => {
      if (!acc[table.classification]) {
        acc[table.classification] = { total: 0, encrypted: 0 };
      }
      acc[table.classification].total += table.columns.length;
      const encrypted = encryptedFields?.filter(
        (f) => f.table_name === table.table && f.encryption_enabled
      ).length || 0;
      acc[table.classification].encrypted += encrypted;
      return acc;
    },
    {} as Record<string, { total: number; encrypted: number }>
  );

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{encryptedCount}</div>
            </div>
            <div className="text-sm text-muted-foreground">Encrypted Fields</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{totalFields}</div>
            </div>
            <div className="text-sm text-muted-foreground">Sensitive Fields</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-yellow-500" />
              <div className="text-2xl font-bold">{encryptionKeys?.length || 0}</div>
            </div>
            <div className="text-sm text-muted-foreground">Active Keys</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{coveragePercent}%</div>
            <Progress value={coveragePercent} className="mt-2" />
            <div className="text-sm text-muted-foreground mt-1">Coverage</div>
          </CardContent>
        </Card>
      </div>

      {/* Classification Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Encryption by Classification
          </CardTitle>
          <CardDescription>
            Field-level encryption status grouped by data classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(byClassification).map(([classification, stats]) => {
              const percent = Math.round((stats.encrypted / stats.total) * 100);
              return (
                <Card key={classification}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={CLEARANCE_COLORS[classification as keyof typeof CLEARANCE_COLORS]}>
                        {CLEARANCE_LABELS[classification as keyof typeof CLEARANCE_LABELS]}
                      </Badge>
                      {percent === 100 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.encrypted} / {stats.total}
                    </div>
                    <Progress value={percent} className="mt-2" />
                    <div className="text-xs text-muted-foreground mt-1">{percent}% encrypted</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table Status */}
      <Card>
        <CardHeader>
          <CardTitle>Sensitive Data Inventory</CardTitle>
          <CardDescription>
            All fields requiring encryption based on data classification policy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Columns</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SENSITIVE_TABLES.map((table) => {
                const encryptedCols = encryptedFields?.filter(
                  (f) => f.table_name === table.table && f.encryption_enabled
                ) || [];
                const allEncrypted = encryptedCols.length >= table.columns.length;
                
                return (
                  <TableRow key={table.table}>
                    <TableCell className="font-mono text-sm">{table.table}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {table.columns.map((col) => {
                          const isEncrypted = encryptedCols.some((f) => f.column_name === col);
                          return (
                            <Badge
                              key={col}
                              variant={isEncrypted ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {isEncrypted && <Lock className="h-2 w-2 mr-1" />}
                              {col}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={CLEARANCE_COLORS[table.classification as keyof typeof CLEARANCE_COLORS]}>
                        {CLEARANCE_LABELS[table.classification as keyof typeof CLEARANCE_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {allEncrypted ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Encrypted
                        </Badge>
                      ) : encryptedCols.length > 0 ? (
                        <Badge variant="secondary">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Partial ({encryptedCols.length}/{table.columns.length})
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Not Encrypted
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
