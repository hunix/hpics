import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Tag, MessageSquare, Users, Camera, FileText, Music } from 'lucide-react';
import { useState } from 'react';

interface ImageMetadata {
  ai_description?: string;
  detected_objects?: string[];
  detected_faces_count?: number;
  detected_text?: string;
  scene_type?: string;
  mood?: string;
  quality_score?: number;
  is_screenshot?: boolean;
  contains_document?: boolean;
  tags?: string[];
  colors_dominant?: string[];
  people_description?: string;
}

interface AudioMetadata {
  transcription?: string;
  language?: string;
  speaker_count?: number;
  topics?: string[];
  sentiment?: string;
  summary?: string;
  audio_type?: string;
  tags?: string[];
  key_phrases?: string[];
}

interface VideoMetadata {
  ai_description?: string;
  scene_types?: string[];
  detected_faces_count?: number;
  topics?: string[];
  mood?: string;
  audio_present?: boolean;
  speech_present?: boolean;
  summary?: string;
  tags?: string[];
}

interface DocumentMetadata {
  ai_summary?: string;
  document_category?: string;
  topics?: string[];
  key_entities?: string[];
  sentiment?: string;
  language?: string;
  tags?: string[];
  action_items?: string[];
}

type AIMetadata = ImageMetadata | AudioMetadata | VideoMetadata | DocumentMetadata;

interface AIMetadataDisplayProps {
  metadata: AIMetadata | null;
  mimeType?: string | null;
  variant?: 'compact' | 'full';
}

export function AIMetadataDisplay({ metadata, mimeType, variant = 'compact' }: AIMetadataDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!metadata) return null;

  const isImage = mimeType?.startsWith('image/');
  const isAudio = mimeType?.startsWith('audio/');
  const isVideo = mimeType?.startsWith('video/');

  // Get description based on type
  const description = 
    (metadata as ImageMetadata).ai_description ||
    (metadata as AudioMetadata).summary ||
    (metadata as VideoMetadata).ai_description ||
    (metadata as DocumentMetadata).ai_summary;

  const tags = (metadata as any).tags || [];

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 5).map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        AI Analysis
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        {/* Description */}
        {description && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Description
            </div>
            <p className="text-sm">{description}</p>
          </div>
        )}

        {/* Image-specific metadata */}
        {isImage && (
          <>
            {(metadata as ImageMetadata).detected_faces_count !== undefined && 
             (metadata as ImageMetadata).detected_faces_count! > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{(metadata as ImageMetadata).detected_faces_count} face(s) detected</span>
              </div>
            )}
            {(metadata as ImageMetadata).scene_type && (
              <div className="flex items-center gap-2 text-sm">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{(metadata as ImageMetadata).scene_type}</Badge>
                {(metadata as ImageMetadata).mood && (
                  <Badge variant="outline">{(metadata as ImageMetadata).mood}</Badge>
                )}
              </div>
            )}
            {(metadata as ImageMetadata).detected_text && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Detected Text
                </div>
                <p className="text-sm p-2 bg-muted rounded text-muted-foreground">
                  {(metadata as ImageMetadata).detected_text}
                </p>
              </div>
            )}
            {(metadata as ImageMetadata).people_description && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Users className="h-3 w-3" />
                  People
                </div>
                <p className="text-sm">{(metadata as ImageMetadata).people_description}</p>
              </div>
            )}
          </>
        )}

        {/* Audio-specific metadata */}
        {isAudio && (
          <>
            {(metadata as AudioMetadata).transcription && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Music className="h-3 w-3" />
                  Transcription
                </div>
                <p className="text-sm p-2 bg-muted rounded max-h-32 overflow-y-auto">
                  {(metadata as AudioMetadata).transcription}
                </p>
              </div>
            )}
            {(metadata as AudioMetadata).speaker_count !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{(metadata as AudioMetadata).speaker_count} speaker(s)</span>
                {(metadata as AudioMetadata).language && (
                  <Badge variant="outline">{(metadata as AudioMetadata).language}</Badge>
                )}
              </div>
            )}
            {(metadata as AudioMetadata).key_phrases && (metadata as AudioMetadata).key_phrases!.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Key Phrases</div>
                <div className="flex flex-wrap gap-1">
                  {(metadata as AudioMetadata).key_phrases!.map((phrase, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Video-specific metadata */}
        {isVideo && (
          <>
            {(metadata as VideoMetadata).summary && (
              <p className="text-sm">{(metadata as VideoMetadata).summary}</p>
            )}
            {(metadata as VideoMetadata).detected_faces_count !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>~{(metadata as VideoMetadata).detected_faces_count} unique face(s)</span>
              </div>
            )}
          </>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Tag className="h-3 w-3" />
              Tags
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Topics */}
        {(metadata as any).topics && (metadata as any).topics.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Topics</div>
            <div className="flex flex-wrap gap-1">
              {(metadata as any).topics.map((topic: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
