import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ScanFace, 
  Cpu, 
  Cloud, 
  Zap, 
  DollarSign, 
  Clock,
  AlertCircle,
  Check,
  Loader2,
  Play,
} from 'lucide-react';
import { useFaceScanJob, CreateJobInput } from '@/hooks/useFaceScanJob';
import { useFaceRegionStats } from '@/hooks/useFaceRegions';
import { toast } from 'sonner';

interface FaceScanJobCreatorProps {
  totalImages?: number;
  unscannedImages?: number;
  taggedImages?: number;
  enrolledFaces?: number;
  onJobCreated?: (jobId: string) => void;
}

const JOB_TYPES = [
  {
    id: 'detect_local',
    name: 'Local Face Detection',
    description: 'Detect faces using browser-based AI (FREE)',
    cost: 0,
    icon: Cpu,
    badge: 'FREE',
  },
  {
    id: 'detect_mosaic',
    name: 'Cloud Face Detection',
    description: 'Detect faces using AI mosaic batching',
    costPer100: 0.02,
    icon: Cloud,
    badge: null,
  },
  {
    id: 'crop_faces',
    name: 'Crop & Store Faces',
    description: 'Crop tagged regions and save to storage',
    cost: 0,
    icon: ScanFace,
    badge: 'FREE',
  },
  {
    id: 'match_faces',
    name: 'Match Against Profiles',
    description: 'Compare detected faces to enrolled profiles',
    costPer100: 0.01,
    icon: Check,
    badge: null,
  },
  {
    id: 'full_pipeline',
    name: 'Full Pipeline',
    description: 'Detect → Crop → Match (most efficient)',
    costPer100: 0.03,
    icon: Zap,
    badge: 'RECOMMENDED',
  },
];

const AI_MODELS = [
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini Flash Lite', costMultiplier: 1 },
  { id: 'google/gemini-2.5-flash', name: 'Gemini Flash', costMultiplier: 2 },
  { id: 'google/gemini-2.5-pro', name: 'Gemini Pro', costMultiplier: 5 },
];

export function FaceScanJobCreator({
  totalImages = 0,
  unscannedImages = 0,
  taggedImages = 0,
  enrolledFaces = 0,
  onJobCreated,
}: FaceScanJobCreatorProps) {
  const [jobType, setJobType] = useState<string>('detect_local');
  const [scanMode, setScanMode] = useState<'all' | 'tagged_only' | 'untagged_only'>('all');
  const [modelKey, setModelKey] = useState('google/gemini-2.5-flash-lite');
  const [autoTagThreshold, setAutoTagThreshold] = useState([0.85]);
  const [confirmThreshold, setConfirmThreshold] = useState([0.60]);
  const [useLocalFirst, setUseLocalFirst] = useState(true);

  const { createJob, startJob } = useFaceScanJob();
  const { data: regionStats } = useFaceRegionStats();

  // Calculate estimated items based on scan mode
  const estimatedItems = useMemo(() => {
    switch (scanMode) {
      case 'tagged_only':
        return taggedImages;
      case 'untagged_only':
        return unscannedImages;
      default:
        return totalImages;
    }
  }, [scanMode, totalImages, taggedImages, unscannedImages]);

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    const jobConfig = JOB_TYPES.find(j => j.id === jobType);
    if (!jobConfig) return 0;

    if (jobConfig.cost === 0) return 0;

    const model = AI_MODELS.find(m => m.id === modelKey);
    const costMultiplier = model?.costMultiplier || 1;
    const costPer100 = jobConfig.costPer100 || 0;

    // If using local first for detection, reduce cloud costs
    let effectiveItems = estimatedItems;
    if (useLocalFirst && (jobType === 'detect_mosaic' || jobType === 'full_pipeline')) {
      // Assume 90% of faces will be detected locally
      effectiveItems = Math.ceil(estimatedItems * 0.1);
    }

    return (effectiveItems / 100) * costPer100 * costMultiplier;
  }, [jobType, estimatedItems, modelKey, useLocalFirst]);

  // Estimated time
  const estimatedTime = useMemo(() => {
    const itemsPerMinute = jobType === 'detect_local' ? 30 : 100; // Local is slower but free
    const minutes = Math.ceil(estimatedItems / itemsPerMinute);
    
    if (minutes < 1) return 'Less than a minute';
    if (minutes < 60) return `~${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    return `~${hours} hour${hours !== 1 ? 's' : ''}`;
  }, [estimatedItems, jobType]);

  const handleCreateJob = async () => {
    const input: CreateJobInput = {
      job_type: jobType as CreateJobInput['job_type'],
      scan_mode: scanMode,
      model_key: jobType !== 'detect_local' && jobType !== 'crop_faces' ? modelKey : undefined,
      auto_tag_threshold: autoTagThreshold[0],
      confirm_threshold: confirmThreshold[0],
      estimated_cost_cents: Math.round(estimatedCost * 100),
    };

    try {
      const job = await createJob.mutateAsync(input);
      onJobCreated?.(job.id);

      // Optionally start immediately
      await startJob.mutateAsync(job.id);
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const selectedJob = JOB_TYPES.find(j => j.id === jobType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanFace className="h-5 w-5" />
          Create Face Scan Job
        </CardTitle>
        <CardDescription>
          Configure a resumable face detection and matching job
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{totalImages}</div>
            <div className="text-xs text-muted-foreground">Total Images</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{unscannedImages}</div>
            <div className="text-xs text-muted-foreground">Unscanned</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{regionStats?.total || 0}</div>
            <div className="text-xs text-muted-foreground">Tagged Faces</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{enrolledFaces}</div>
            <div className="text-xs text-muted-foreground">Enrolled Profiles</div>
          </div>
        </div>

        {/* Job type selection */}
        <div className="space-y-3">
          <Label>Job Type</Label>
          <RadioGroup value={jobType} onValueChange={setJobType}>
            {JOB_TYPES.map(job => (
              <div
                key={job.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  jobType === job.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setJobType(job.id)}
              >
                <RadioGroupItem value={job.id} id={job.id} />
                <job.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{job.name}</span>
                    {job.badge && (
                      <Badge variant={job.badge === 'FREE' ? 'secondary' : 'default'} className="text-xs">
                        {job.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Scan mode */}
        <div className="space-y-3">
          <Label>Scan Scope</Label>
          <Select value={scanMode} onValueChange={(v) => setScanMode(v as typeof scanMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All images ({totalImages})</SelectItem>
              <SelectItem value="tagged_only">Tagged faces only ({taggedImages})</SelectItem>
              <SelectItem value="untagged_only">Unscanned images only ({unscannedImages})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Model selection (for cloud jobs) */}
        {jobType !== 'detect_local' && jobType !== 'crop_faces' && (
          <div className="space-y-3">
            <Label>AI Model</Label>
            <Select value={modelKey} onValueChange={setModelKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.costMultiplier}x cost)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Local-first option */}
        {(jobType === 'detect_mosaic' || jobType === 'full_pipeline') && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Use local detection first</Label>
              <p className="text-sm text-muted-foreground">
                Detect faces locally (free), only use cloud AI for failures
              </p>
            </div>
            <Switch checked={useLocalFirst} onCheckedChange={setUseLocalFirst} />
          </div>
        )}

        {/* Thresholds */}
        {(jobType === 'match_faces' || jobType === 'full_pipeline') && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Auto-tag threshold</Label>
                <span className="text-sm font-mono">{autoTagThreshold[0].toFixed(2)}</span>
              </div>
              <Slider
                value={autoTagThreshold}
                onValueChange={setAutoTagThreshold}
                min={0.5}
                max={1}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Faces above this confidence will be automatically tagged
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Review threshold</Label>
                <span className="text-sm font-mono">{confirmThreshold[0].toFixed(2)}</span>
              </div>
              <Slider
                value={confirmThreshold}
                onValueChange={setConfirmThreshold}
                min={0.3}
                max={autoTagThreshold[0]}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Faces between this and auto-tag threshold will be queued for review
              </p>
            </div>
          </div>
        )}

        {/* Estimate summary */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <ScanFace className="h-4 w-4" />
              Items to process
            </span>
            <span className="font-medium">{estimatedItems.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Estimated time
            </span>
            <span className="font-medium">{estimatedTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Estimated cost
            </span>
            <span className={`font-medium ${estimatedCost === 0 ? 'text-green-600' : ''}`}>
              {estimatedCost === 0 ? 'FREE' : `$${estimatedCost.toFixed(4)}`}
            </span>
          </div>
        </div>

        {/* Warnings */}
        {enrolledFaces === 0 && (jobType === 'match_faces' || jobType === 'full_pipeline') && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>No enrolled profiles</strong>
              <p className="text-muted-foreground">
                Face matching requires at least one profile with enrolled biometrics.
              </p>
            </div>
          </div>
        )}

        {/* Create button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleCreateJob}
          disabled={createJob.isPending || startJob.isPending || estimatedItems === 0}
        >
          {(createJob.isPending || startJob.isPending) ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Start Job
        </Button>
      </CardContent>
    </Card>
  );
}
