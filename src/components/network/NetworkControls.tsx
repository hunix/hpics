import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Clock, Layers, Users, Star, AlertTriangle } from 'lucide-react';
import { RELATIONSHIP_TYPES, RELATIONSHIP_COLORS, type ColorMode } from '@/lib/network/types/visualization';

interface NetworkControlsProps {
  filter: string;
  setFilter: (filter: string) => void;
  minImportance: number[];
  setMinImportance: (value: number[]) => void;
  colorBy: ColorMode;
  setColorBy: (mode: ColorMode) => void;
  showDecay: boolean;
  setShowDecay: (show: boolean) => void;
  totalContacts: number;
  favoriteCount: number;
  needsAttentionCount: number;
}

export function NetworkControls({
  filter,
  setFilter,
  minImportance,
  setMinImportance,
  colorBy,
  setColorBy,
  showDecay,
  setShowDecay,
  totalContacts,
  favoriteCount,
  needsAttentionCount,
}: NetworkControlsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Filters & Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Relationship Type</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {RELATIONSHIP_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Minimum Importance: {minImportance[0]}%</Label>
          <Slider
            value={minImportance}
            onValueChange={setMinImportance}
            max={100}
            step={5}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Color By
          </Label>
          <Select value={colorBy} onValueChange={(v) => setColorBy(v as ColorMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cluster">Cluster (Community)</SelectItem>
              <SelectItem value="type">Relationship Type</SelectItem>
              <SelectItem value="pagerank">PageRank (Influence)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {colorBy === 'cluster' && 'Colors show detected communities'}
            {colorBy === 'type' && 'Colors show relationship categories'}
            {colorBy === 'pagerank' && 'Blue→Red gradient shows influence'}
          </p>
        </div>

        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-decay" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Relationship Decay
            </Label>
            <Switch id="show-decay" checked={showDecay} onCheckedChange={setShowDecay} />
          </div>
          {showDecay && (
            <p className="text-xs text-muted-foreground">
              Fading nodes indicate less recent contact. Orange/red dots warn of relationship decay.
            </p>
          )}
        </div>

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Legend</h4>
          <div className="grid grid-cols-2 gap-2">
            {RELATIONSHIP_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: RELATIONSHIP_COLORS[type] }}
                />
                <span className="text-xs capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Stats</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><Users className="h-4 w-4 inline mr-1" /> {totalContacts} contacts</p>
            <p><Star className="h-4 w-4 inline mr-1" /> {favoriteCount} favorites</p>
            <p><AlertTriangle className="h-4 w-4 inline mr-1" /> {needsAttentionCount} need attention</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
