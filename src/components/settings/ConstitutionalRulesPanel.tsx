/**
 * Constitutional Rules Panel
 * Admin interface for managing AI ethical/legal guardrails
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, Search, RefreshCw, Shield, AlertTriangle, 
  Scale, Info, AlertCircle, Ban, Megaphone, Trash2, Edit
} from 'lucide-react';
import { useConstitutionalRules, ConstitutionalRule, RuleCategory, RuleSeverity, ViolationAction } from '@/hooks/useConstitutionalRules';
import { toast } from 'sonner';

const SEVERITY_CONFIG: Record<RuleSeverity, { icon: React.ReactNode; color: string }> = {
  info: { icon: <Info className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-500' },
  warning: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-500' },
  block: { icon: <Ban className="h-4 w-4" />, color: 'bg-red-500/10 text-red-500' },
  escalate: { icon: <Megaphone className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-500' },
};

const CATEGORY_LABELS: Record<RuleCategory, string> = {
  legal: 'Legal',
  ethical: 'Ethical',
  operational: 'Operational',
  brand: 'Brand',
  safety: 'Safety',
  privacy: 'Privacy',
};

interface RuleFormData {
  rule_name: string;
  rule_category: RuleCategory;
  severity: RuleSeverity;
  priority: number;
}

const DEFAULT_FORM: RuleFormData = {
  rule_name: '',
  rule_category: 'ethical',
  severity: 'warning',
  priority: 100,
};

export function ConstitutionalRulesPanel() {
  const {
    rules,
    activeRules,
    categories,
    isLoading,
    error,
    refetch,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
  } = useConstitutionalRules();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>(DEFAULT_FORM);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Filter rules
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (rule.rule_content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'all' || rule.rule_category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || rule.severity === selectedSeverity;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const handleCreateRule = async () => {
    try {
      await createRule.mutateAsync({
        rule_name: formData.rule_name,
        rule_content: formData.rule_content,
        rule_category: formData.rule_category,
        severity: formData.severity,
        enforcement_action: formData.enforcement_action,
        priority: formData.priority,
      });
      toast.success('Rule created successfully');
      setCreateDialogOpen(false);
      setFormData(DEFAULT_FORM);
    } catch (err) {
      toast.error('Failed to create rule');
    }
  };

  const handleEditRule = (rule: ConstitutionalRule) => {
    setEditingRuleId(rule.id);
    setFormData({
      rule_name: rule.rule_name,
      rule_content: rule.rule_content || '',
      rule_category: rule.rule_category,
      severity: rule.severity,
      enforcement_action: rule.enforcement_action,
      priority: rule.priority,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRule = async () => {
    if (!editingRuleId) return;

    try {
      await updateRule.mutateAsync({
        id: editingRuleId,
        updates: {
          rule_name: formData.rule_name,
          rule_content: formData.rule_content,
          rule_category: formData.rule_category,
          severity: formData.severity,
          enforcement_action: formData.enforcement_action,
          priority: formData.priority,
        },
      });
      toast.success('Rule updated successfully');
      setEditDialogOpen(false);
      setEditingRuleId(null);
      setFormData(DEFAULT_FORM);
    } catch (err) {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (rule: ConstitutionalRule) => {
    if (rule.is_system) {
      toast.error('Cannot delete system rules');
      return;
    }

    try {
      await deleteRule.mutateAsync(rule.id);
      toast.success('Rule deleted');
    } catch (err) {
      toast.error('Failed to delete rule');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Failed to Load Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const RuleFormFields = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Rule Name</label>
        <Input
          value={formData.rule_name}
          onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
          placeholder="e.g., no_pii_exposure"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Rule Content</label>
        <Textarea
          value={formData.rule_content}
          onChange={(e) => setFormData({ ...formData, rule_content: e.target.value })}
          placeholder="What does this rule enforce?"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={formData.rule_category}
            onValueChange={(v) => setFormData({ ...formData, rule_category: v as RuleCategory })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Severity</label>
          <Select
            value={formData.severity}
            onValueChange={(v) => setFormData({ ...formData, severity: v as RuleSeverity })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="block">Block</SelectItem>
              <SelectItem value="escalate">Escalate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Enforcement Action</label>
          <Select
            value={formData.enforcement_action}
            onValueChange={(v) => setFormData({ ...formData, enforcement_action: v as ViolationAction })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="log">Log Only</SelectItem>
              <SelectItem value="warn">Warn User</SelectItem>
              <SelectItem value="block">Block Action</SelectItem>
              <SelectItem value="rewrite">Rewrite Content</SelectItem>
              <SelectItem value="escalate">Escalate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority (lower = higher)</label>
          <Input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Rules</span>
            </div>
            <p className="text-2xl font-bold">{rules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{activeRules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Blocking</span>
            </div>
            <p className="text-2xl font-bold">
              {rules.filter(r => r.severity === 'block').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">System</span>
            </div>
            <p className="text-2xl font-bold">
              {rules.filter(r => r.is_system).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Constitutional AI Rules</CardTitle>
              <CardDescription>
                Ethical and legal guardrails for AI agent behavior
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Rule</DialogTitle>
                  <DialogDescription>
                    Add a new constitutional rule to govern AI behavior.
                  </DialogDescription>
                </DialogHeader>
                <RuleFormFields />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRule}
                    disabled={!formData.rule_name || createRule.isPending}
                  >
                    Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="escalate">Escalate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rules Table */}
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No rules match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map(rule => {
                    const severityConfig = SEVERITY_CONFIG[rule.severity] || SEVERITY_CONFIG.info;
                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rule.rule_name}</span>
                              {rule.is_system && (
                                <Badge variant="secondary" className="text-xs">System</Badge>
                              )}
                            </div>
                            {rule.rule_content && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {rule.rule_content}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CATEGORY_LABELS[rule.rule_category] || rule.rule_category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={severityConfig.color}>
                            <span className="flex items-center gap-1">
                              {severityConfig.icon}
                              {rule.severity}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {rule.enforcement_action}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleRuleStatus.mutate({
                              id: rule.id,
                              isActive: !rule.is_active
                            })}
                            disabled={toggleRuleStatus.isPending}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRule(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRule(rule)}
                              disabled={rule.is_system || deleteRule.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>
              Modify the constitutional rule settings.
            </DialogDescription>
          </DialogHeader>
          <RuleFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingRuleId(null);
              setFormData(DEFAULT_FORM);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRule}
              disabled={!formData.rule_name || updateRule.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
