import React, { useState } from 'react';
import { 
  Instagram, Linkedin, AtSign, Twitter, Globe, 
  Brain, Link2, Trash2, ChevronDown, ChevronUp,
  User, MapPin, Briefcase, ExternalLink, Eye,
  CheckCircle2, Clock, Loader2, Users
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DeviceCapture } from '@/hooks/useDeviceCaptures';
import { ApplyToContactDialog } from './ApplyToContactDialog';
import { CaptureContactLinker } from './CaptureContactLinker';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CaptureCardProps {
  capture: DeviceCapture;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onAnalyze: () => void;
  onDelete: () => void;
  onLink: (captureId: string, profileId: string) => Promise<boolean>;
  isProcessing?: boolean;
}

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  linkedin: Linkedin,
  threads: AtSign,
  x: Twitter,
  twitter: Twitter,
};

const platformColors: Record<string, string> = {
  instagram: 'text-pink-500',
  linkedin: 'text-blue-600',
  threads: 'text-foreground',
  x: 'text-foreground',
  twitter: 'text-sky-500',
};

export function CaptureCard({
  capture,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  onAnalyze,
  onDelete,
  onLink,
  isProcessing,
}: CaptureCardProps) {
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const data = capture.extracted_data as any;
  const platform = data?.platform?.toLowerCase() || data?.source_app?.toLowerCase() || 'unknown';
  const PlatformIcon = platformIcons[platform] || Globe;
  const platformColor = platformColors[platform] || 'text-muted-foreground';

  const username = data?.username || data?.handle || 'Unknown';
  const displayName = data?.displayName || data?.fullName || data?.name || '';
  const bio = data?.bio || data?.headline || '';
  const profileImage = data?.profileImageUrl || data?.avatarUrl || data?.avatar;
  const followers = data?.followersCount || data?.followers;
  const following = data?.followingCount || data?.following;
  const posts = data?.postsCount || data?.posts?.length;
  const location = data?.location;
  const company = data?.company || data?.organization;
  const jobTitle = data?.jobTitle || data?.title;
  const isVerified = data?.isVerified;
  const isPrivate = data?.isPrivate;

  const capturedAt = formatDistanceToNow(new Date(capture.created_at), { addSuffix: true });
  const isLinked = !!capture.profile_id;
  const isAnalyzed = capture.status === 'processed';

  const handleLinkToProfile = async (profileId: string) => {
    setIsLinking(true);
    await onLink(capture.id, profileId);
    setIsLinking(false);
  };

  return (
    <>
      <Card className={cn(
        "transition-all",
        isSelected && "ring-2 ring-primary",
        isLinked && "border-green-200 dark:border-green-900"
      )}>
        <div className="p-3">
          {/* Header Row */}
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={isSelected} 
                onCheckedChange={onSelect}
                onClick={(e) => e.stopPropagation()}
              />
              <Avatar className="h-10 w-10">
                <AvatarImage src={profileImage} alt={displayName || username} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <PlatformIcon className={cn("h-4 w-4 shrink-0", platformColor)} />
                <span className="font-medium text-sm truncate">
                  @{username}
                </span>
                {isVerified && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    ✓ Verified
                  </Badge>
                )}
                {isPrivate && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    Private
                  </Badge>
                )}
              </div>
              {displayName && (
                <p className="text-sm text-muted-foreground truncate">{displayName}</p>
              )}
              {bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{bio}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1">
                {isLinked && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                    Linked
                  </Badge>
                )}
                {isAnalyzed && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-300">
                    <Brain className="h-3 w-3 mr-0.5" />
                    Analyzed
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {capturedAt}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          {(followers || following || posts) && (
            <div className="flex items-center gap-4 mt-2 ml-14 text-xs text-muted-foreground">
              {followers !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {typeof followers === 'number' ? followers.toLocaleString() : followers} followers
                </span>
              )}
              {following !== undefined && (
                <span>{typeof following === 'number' ? following.toLocaleString() : following} following</span>
              )}
              {posts !== undefined && (
                <span>{typeof posts === 'number' ? posts.toLocaleString() : posts} posts</span>
              )}
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-2 mt-3 ml-14">
            {!isLinked ? (
              <CaptureContactLinker
                captureId={capture.id}
                extractedData={data}
                onLink={handleLinkToProfile}
                isLinking={isLinking}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowApplyDialog(true)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View / Apply
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onAnalyze}
              disabled={isProcessing || isAnalyzed}
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Brain className="h-3 w-3 mr-1" />
              )}
              {isAnalyzed ? 'Analyzed' : 'Analyze'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>

            <div className="flex-1" />

            <CollapsibleTrigger asChild onClick={onExpand}>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Expanded Content */}
          <Collapsible open={isExpanded}>
            <CollapsibleContent>
              <div className="mt-3 pt-3 border-t space-y-2 ml-14">
                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{location}</span>
                    </div>
                  )}
                  {(company || jobTitle) && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="h-3 w-3" />
                      <span>{jobTitle}{company && jobTitle ? ' at ' : ''}{company}</span>
                    </div>
                  )}
                  {capture.source_url && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <a 
                        href={capture.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {capture.source_url}
                      </a>
                    </div>
                  )}
                </div>

                {/* Raw Data Preview */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View raw data
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-x-auto max-h-48">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </details>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </Card>

      <ApplyToContactDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
        extractedData={data}
        sourceType={platform}
        captureId={capture.id}
        preSelectedContactId={capture.profile_id}
        onApplied={() => setShowApplyDialog(false)}
      />
    </>
  );
}

export default CaptureCard;
