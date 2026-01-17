import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, Grid3X3, Sparkles, TrendingDown, Copy, Layers } from "lucide-react";
import { getMosaicPreviewInfo } from "@/lib/metadataMosaic";

export type ProcessingStrategy = "individual" | "mosaic" | "hybrid" | "deduplicated";

interface ProcessingStrategySelectorProps {
  strategy: ProcessingStrategy;
  onStrategyChange: (strategy: ProcessingStrategy) => void;
  imageCount: number;
  totalItemCount: number;
  disabled?: boolean;
}

export function ProcessingStrategySelector({
  strategy,
  onStrategyChange,
  imageCount,
  totalItemCount,
  disabled = false,
}: ProcessingStrategySelectorProps) {
  const hasNonImages = totalItemCount > imageCount;
  const mosaicInfo = imageCount > 0 ? getMosaicPreviewInfo(imageCount, 'google/gemini-2.5-flash') : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Processing Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <RadioGroup
          value={strategy}
          onValueChange={(value) => onStrategyChange(value as ProcessingStrategy)}
          className="space-y-3"
          disabled={disabled}
        >
          {/* Individual */}
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="individual" id="individual" className="mt-1" />
            <Label htmlFor="individual" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Individual</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                1 AI call per file • Best for &lt;10 items
              </p>
            </Label>
          </div>

          {/* Mosaic */}
          <div className="flex items-start space-x-3">
            <RadioGroupItem 
              value="mosaic" 
              id="mosaic" 
              disabled={imageCount < 4}
              className="mt-1" 
            />
            <Label 
              htmlFor="mosaic" 
              className={`flex-1 cursor-pointer ${imageCount < 4 ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-green-500" />
                <span className="font-medium">Mosaic Batch</span>
                {mosaicInfo && mosaicInfo.savingsPercent > 0 && (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    ~{mosaicInfo.savingsPercent}% savings
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {imageCount >= 4 ? (
                  <>Up to 64 images/call • {mosaicInfo?.mosaicsRequired || 1} mosaic{(mosaicInfo?.mosaicsRequired || 1) > 1 ? 's' : ''} needed</>
                ) : (
                  'Requires 4+ images'
                )}
              </p>
            </Label>
          </div>

          {/* Hybrid */}
          {hasNonImages && (
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="hybrid" id="hybrid" className="mt-1" />
              <Label htmlFor="hybrid" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Hybrid</span>
                  <Badge variant="outline" className="text-xs">Recommended</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mosaic for images, individual for audio/video/docs
                </p>
              </Label>
            </div>
          )}

          {/* Deduplicated */}
          <div className="flex items-start space-x-3">
            <RadioGroupItem 
              value="deduplicated" 
              id="deduplicated" 
              disabled={imageCount < 10}
              className="mt-1" 
            />
            <Label 
              htmlFor="deduplicated" 
              className={`flex-1 cursor-pointer ${imageCount < 10 ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Smart Dedupe</span>
                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                  <Layers className="h-3 w-3 mr-1" />
                  Skip dupes
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {imageCount >= 10 ? (
                  <>Detect similar images, analyze only unique ones</>
                ) : (
                  'Requires 10+ images'
                )}
              </p>
            </Label>
          </div>
        </RadioGroup>

        {/* Preview info */}
        {strategy === 'mosaic' && mosaicInfo && imageCount >= 4 && (
          <div className="mt-3 p-2 rounded-md bg-muted/50 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Images to process:</span>
              <span className="font-medium">{imageCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mosaics to generate:</span>
              <span className="font-medium">{mosaicInfo.mosaicsRequired}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Grid size:</span>
              <span className="font-medium">{mosaicInfo.gridCols}×{mosaicInfo.gridRows}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
