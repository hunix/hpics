import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, Tag, MessageSquare, Users, Camera, FileText, Music, 
  MapPin, Activity, Eye, Brain, AlertTriangle, Clock, DollarSign,
  Shirt, Building, Heart, Briefcase, Globe, Thermometer, Palette
} from 'lucide-react';
import { useState } from 'react';

interface AIMetadataDisplayProps {
  metadata: Record<string, any> | null;
  mimeType?: string | null;
  variant?: 'compact' | 'full';
}

function MetadataSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-md transition-colors">
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2 pb-2 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function KeyValue({ label, value }: { label: string; value: any }) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return null;
  }
  
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </Badge>
          ))}
        </div>
      ) : typeof value === 'boolean' ? (
        <Badge variant={value ? 'default' : 'outline'} className="text-xs w-fit">
          {value ? 'Yes' : 'No'}
        </Badge>
      ) : typeof value === 'object' ? (
        <pre className="text-xs p-2 bg-muted rounded overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <span className="text-sm">{String(value)}</span>
      )}
    </div>
  );
}

function TagList({ tags, max = 10 }: { tags: string[]; max?: number }) {
  const [showAll, setShowAll] = useState(false);

  if (!tags?.length) return null;
  
  const displayTags = showAll ? tags : tags.slice(0, max);
  
  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tag, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
      {tags.length > max && !showAll && (
        <Badge 
          variant="outline" 
          className="text-xs cursor-pointer hover:bg-muted"
          onClick={() => setShowAll(true)}
        >
          +{tags.length - max} more
        </Badge>
      )}
    </div>
  );
}

export function AIMetadataDisplay({ metadata, mimeType, variant = 'compact' }: AIMetadataDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!metadata) return null;

  const isImage = mimeType?.startsWith('image/');
  const isAudio = mimeType?.startsWith('audio/');
  const isVideo = mimeType?.startsWith('video/');
  const isDocument = !isImage && !isAudio && !isVideo;

  // Get primary description
  const description = 
    metadata.ai_description ||
    metadata.ai_summary_short ||
    metadata.summary?.brief ||
    metadata.summary?.one_line ||
    metadata.transcription?.full_text?.substring(0, 200) ||
    metadata.content?.summary;

  const tags = metadata.tags || [];

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        {tags.length > 0 && <TagList tags={tags} max={5} />}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        <Brain className="h-4 w-4" />
        AI Intelligence Analysis
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-1 pr-4">
            {/* Description - Always show */}
            {description && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  Description
                </div>
                <p className="text-sm">{description}</p>
                {metadata.ai_description && metadata.ai_summary_short && (
                  <p className="text-xs text-muted-foreground italic">{metadata.ai_summary_short}</p>
                )}
              </div>
            )}

            {/* ===== IMAGE METADATA ===== */}
            {isImage && (
              <>
                {/* People Analysis */}
                {metadata.people && (
                  <MetadataSection title="People Analysis" icon={Users} defaultOpen>
                    <KeyValue label="Count" value={metadata.people.count} />
                    <KeyValue label="Group Dynamics" value={metadata.people.group_dynamics} />
                    <KeyValue label="Relationships Suggested" value={metadata.people.relationships_suggested} />
                    {metadata.people.faces?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">Detected Faces</span>
                        {metadata.people.faces.map((face: any, i: number) => (
                          <div key={i} className="text-xs p-2 bg-muted rounded space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {face.estimated_age_range && <Badge variant="outline">{face.estimated_age_range}</Badge>}
                              {face.estimated_gender && <Badge variant="outline">{face.estimated_gender}</Badge>}
                              {face.expression && <Badge variant="secondary">{face.expression}</Badge>}
                              {face.emotion && <Badge variant="secondary">{face.emotion}</Badge>}
                            </div>
                            {face.accessories?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {face.accessories.map((acc: string, j: number) => (
                                  <Badge key={j} variant="outline" className="text-xs">{acc}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </MetadataSection>
                )}

                {/* Clothing Analysis */}
                {metadata.clothing_analysis && (
                  <MetadataSection title="Clothing & Appearance" icon={Shirt}>
                    <KeyValue label="Style" value={metadata.clothing_analysis.style} />
                    <KeyValue label="Items" value={metadata.clothing_analysis.items} />
                    <KeyValue label="Occasion Suggested" value={metadata.clothing_analysis.occasion_suggested} />
                    <KeyValue label="Cultural Elements" value={metadata.clothing_analysis.cultural_elements} />
                  </MetadataSection>
                )}

                {/* Location Analysis */}
                {metadata.location_analysis && (
                  <MetadataSection title="Location & Setting" icon={MapPin} defaultOpen>
                    <KeyValue label="Scene Type" value={metadata.location_analysis.scene_type} />
                    <KeyValue label="Environment" value={metadata.location_analysis.environment} />
                    <KeyValue label="Venue Type" value={metadata.location_analysis.venue_type} />
                    <KeyValue label="Country Suggested" value={metadata.location_analysis.country_suggested} />
                    <KeyValue label="City Suggested" value={metadata.location_analysis.city_suggested} />
                    <KeyValue label="Landmarks" value={metadata.location_analysis.landmarks_detected} />
                    <KeyValue label="Weather" value={metadata.location_analysis.weather_visible} />
                    <KeyValue label="Time of Day" value={metadata.location_analysis.time_of_day} />
                    <KeyValue label="Season" value={metadata.location_analysis.season_suggested} />
                  </MetadataSection>
                )}

                {/* Objects */}
                {metadata.objects && (
                  <MetadataSection title="Objects & Items" icon={Eye}>
                    <KeyValue label="Primary Objects" value={metadata.objects.primary} />
                    <KeyValue label="Secondary Objects" value={metadata.objects.secondary} />
                    <KeyValue label="Electronics" value={metadata.objects.electronics} />
                    <KeyValue label="Vehicles" value={metadata.objects.vehicles} />
                    <KeyValue label="Food & Drinks" value={metadata.objects.food_drinks} />
                    <KeyValue label="Brands Detected" value={metadata.objects.brands_detected} />
                    <KeyValue label="Luxury Items" value={metadata.objects.luxury_items} />
                  </MetadataSection>
                )}

                {/* Activities */}
                {metadata.activity_analysis && (
                  <MetadataSection title="Activities & Events" icon={Activity}>
                    <KeyValue label="Primary Activity" value={metadata.activity_analysis.primary_activity} />
                    <KeyValue label="Event Type" value={metadata.activity_analysis.event_type} />
                    <KeyValue label="Is Celebration" value={metadata.activity_analysis.is_celebration} />
                    <KeyValue label="Is Professional" value={metadata.activity_analysis.is_professional} />
                    <KeyValue label="Sports/Fitness" value={metadata.activity_analysis.sports_fitness} />
                    <KeyValue label="Hobbies Indicated" value={metadata.activity_analysis.hobbies_indicated} />
                  </MetadataSection>
                )}

                {/* Text Extraction */}
                {metadata.text_extraction && (metadata.text_extraction.all_text || metadata.text_extraction.contact_info_found) && (
                  <MetadataSection title="Text Extraction (OCR)" icon={FileText}>
                    {metadata.text_extraction.all_text && (
                      <div className="p-2 bg-muted rounded text-xs max-h-32 overflow-y-auto">
                        {metadata.text_extraction.all_text}
                      </div>
                    )}
                    <KeyValue label="Languages Detected" value={metadata.text_extraction.languages_detected} />
                    <KeyValue label="Signs & Labels" value={metadata.text_extraction.signs_labels} />
                    {metadata.text_extraction.contact_info_found && (
                      <>
                        <KeyValue label="Phone Numbers" value={metadata.text_extraction.contact_info_found.phone_numbers} />
                        <KeyValue label="Emails" value={metadata.text_extraction.contact_info_found.emails} />
                        <KeyValue label="Addresses" value={metadata.text_extraction.contact_info_found.addresses} />
                        <KeyValue label="URLs" value={metadata.text_extraction.contact_info_found.urls} />
                      </>
                    )}
                  </MetadataSection>
                )}

                {/* Image Quality */}
                {metadata.image_quality && (
                  <MetadataSection title="Technical Quality" icon={Camera}>
                    <KeyValue label="Quality Score" value={metadata.image_quality.overall_score ? `${metadata.image_quality.overall_score}/100` : undefined} />
                    <KeyValue label="Sharpness" value={metadata.image_quality.sharpness} />
                    <KeyValue label="Exposure" value={metadata.image_quality.exposure} />
                    <KeyValue label="Composition" value={metadata.image_quality.composition} />
                    <KeyValue label="Professional Photo" value={metadata.image_quality.is_professional_photo} />
                    <KeyValue label="Camera Type" value={metadata.image_quality.camera_type_suggested} />
                    <KeyValue label="Screenshot" value={metadata.image_quality.is_screenshot} />
                    <KeyValue label="Scan" value={metadata.image_quality.is_scan} />
                    <KeyValue label="Meme/Graphic" value={metadata.image_quality.is_meme_graphic} />
                  </MetadataSection>
                )}

                {/* Visual Properties */}
                {metadata.visual_properties && (
                  <MetadataSection title="Visual Properties" icon={Palette}>
                    <KeyValue label="Dominant Colors" value={metadata.visual_properties.dominant_colors} />
                    <KeyValue label="Brightness" value={metadata.visual_properties.brightness} />
                    <KeyValue label="Contrast" value={metadata.visual_properties.contrast} />
                    <KeyValue label="Saturation" value={metadata.visual_properties.saturation} />
                    <KeyValue label="Artistic Style" value={metadata.visual_properties.artistic_style} />
                    <KeyValue label="Filter Detected" value={metadata.visual_properties.filter_detected} />
                  </MetadataSection>
                )}

                {/* Intelligence */}
                {metadata.intelligence && (
                  <MetadataSection title="Intelligence Insights" icon={Brain}>
                    <KeyValue label="Relationship Context" value={metadata.intelligence.relationship_context} />
                    <KeyValue label="Life Events" value={metadata.intelligence.life_events} />
                    <KeyValue label="Interests Revealed" value={metadata.intelligence.interests_revealed} />
                    <KeyValue label="Personality Cues" value={metadata.intelligence.personality_cues} />
                    <KeyValue label="Wealth Indicators" value={metadata.intelligence.wealth_indicators} />
                    <KeyValue label="Profession Cues" value={metadata.intelligence.profession_cues} />
                    <KeyValue label="Travel Indicators" value={metadata.intelligence.travel_indicators} />
                  </MetadataSection>
                )}

                {/* Content Flags */}
                {metadata.content_flags && (
                  <MetadataSection title="Content Flags" icon={AlertTriangle}>
                    <KeyValue label="Sensitive" value={metadata.content_flags.is_sensitive} />
                    <KeyValue label="Sensitivity Type" value={metadata.content_flags.sensitivity_type} />
                    <KeyValue label="Contains Minors" value={metadata.content_flags.contains_minors} />
                    <KeyValue label="Security Level" value={metadata.content_flags.security_level_suggested} />
                  </MetadataSection>
                )}
              </>
            )}

            {/* ===== AUDIO METADATA ===== */}
            {isAudio && (
              <>
                {/* Transcription */}
                {metadata.transcription && (
                  <MetadataSection title="Transcription" icon={FileText} defaultOpen>
                    {metadata.transcription.full_text && (
                      <div className="p-2 bg-muted rounded text-sm max-h-48 overflow-y-auto">
                        {metadata.transcription.full_text}
                      </div>
                    )}
                    <KeyValue label="Word Count" value={metadata.transcription.word_count} />
                    <KeyValue label="Primary Language" value={metadata.transcription.language_primary} />
                    <KeyValue label="Languages Detected" value={metadata.transcription.languages_detected} />
                    <KeyValue label="Confidence" value={metadata.transcription.confidence_score ? `${Math.round(metadata.transcription.confidence_score * 100)}%` : undefined} />
                  </MetadataSection>
                )}

                {/* Speakers */}
                {metadata.speakers && (
                  <MetadataSection title="Speaker Analysis" icon={Users}>
                    <KeyValue label="Speaker Count" value={metadata.speakers.count} />
                    <KeyValue label="Dominant Speaker" value={metadata.speakers.dominant_speaker} />
                    <KeyValue label="Conversation Balance" value={metadata.speakers.conversation_balance} />
                    {metadata.speakers.diarization?.map((speaker: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-muted rounded space-y-1">
                        <div className="font-medium">Speaker {speaker.speaker_id}</div>
                        <div className="flex flex-wrap gap-1">
                          {speaker.estimated_gender && <Badge variant="outline">{speaker.estimated_gender}</Badge>}
                          {speaker.estimated_age_range && <Badge variant="outline">{speaker.estimated_age_range}</Badge>}
                          {speaker.accent_detected && <Badge variant="secondary">{speaker.accent_detected}</Badge>}
                        </div>
                        <KeyValue label="Voice Characteristics" value={speaker.voice_characteristics} />
                      </div>
                    ))}
                  </MetadataSection>
                )}

                {/* Content */}
                {metadata.content && (
                  <MetadataSection title="Content Analysis" icon={MessageSquare} defaultOpen>
                    <KeyValue label="Summary" value={metadata.content.summary} />
                    <KeyValue label="Main Topics" value={metadata.content.topics_main} />
                    <KeyValue label="Key Points" value={metadata.content.key_points} />
                    <KeyValue label="Action Items" value={metadata.content.action_items} />
                    <KeyValue label="Decisions Made" value={metadata.content.decisions_made} />
                    <KeyValue label="Questions Asked" value={metadata.content.questions_asked} />
                    <KeyValue label="Names Mentioned" value={metadata.content.names_mentioned} />
                    <KeyValue label="Organizations" value={metadata.content.organizations_mentioned} />
                    <KeyValue label="Locations" value={metadata.content.locations_mentioned} />
                    <KeyValue label="Dates/Times" value={metadata.content.dates_times_mentioned} />
                  </MetadataSection>
                )}

                {/* Emotional Analysis */}
                {metadata.emotional_analysis && (
                  <MetadataSection title="Emotional Analysis" icon={Heart}>
                    <KeyValue label="Overall Sentiment" value={metadata.emotional_analysis.overall_sentiment} />
                    <KeyValue label="Tension Points" value={metadata.emotional_analysis.tension_points} />
                    <KeyValue label="Positive Moments" value={metadata.emotional_analysis.positive_moments} />
                    <KeyValue label="Humor Detected" value={metadata.emotional_analysis.humor_detected} />
                    <KeyValue label="Conflict Indicators" value={metadata.emotional_analysis.conflict_indicators} />
                  </MetadataSection>
                )}

                {/* Dynamics */}
                {metadata.dynamics && (
                  <MetadataSection title="Conversation Dynamics" icon={Activity}>
                    <KeyValue label="Conversation Type" value={metadata.dynamics.conversation_type} />
                    <KeyValue label="Formality Level" value={metadata.dynamics.formality_level} />
                    <KeyValue label="Power Dynamics" value={metadata.dynamics.power_dynamics} />
                    <KeyValue label="Rapport Level" value={metadata.dynamics.rapport_level} />
                    <KeyValue label="Interruptions" value={metadata.dynamics.interruptions_count} />
                    <KeyValue label="Agreements" value={metadata.dynamics.agreements} />
                    <KeyValue label="Disagreements" value={metadata.dynamics.disagreements} />
                  </MetadataSection>
                )}

                {/* Intelligence */}
                {metadata.intelligence && (
                  <MetadataSection title="Intelligence Insights" icon={Brain}>
                    <KeyValue label="Commitments Made" value={metadata.intelligence.commitments_made} />
                    <KeyValue label="Preferences Expressed" value={metadata.intelligence.preferences_expressed} />
                    <KeyValue label="Opinions Stated" value={metadata.intelligence.opinions_stated} />
                    <KeyValue label="Complaints/Concerns" value={metadata.intelligence.complaints_concerns} />
                    <KeyValue label="Interests Discussed" value={metadata.intelligence.interests_discussed} />
                    <KeyValue label="Plans Mentioned" value={metadata.intelligence.plans_mentioned} />
                    <KeyValue label="Relationship References" value={metadata.intelligence.relationship_references} />
                    <KeyValue label="Work References" value={metadata.intelligence.work_references} />
                    <KeyValue label="Financial References" value={metadata.intelligence.financial_references} />
                  </MetadataSection>
                )}

                {/* Follow-up */}
                {(metadata.follow_up_items?.length > 0 || metadata.reminder_triggers?.length > 0) && (
                  <MetadataSection title="Follow-up Items" icon={Clock}>
                    <KeyValue label="Follow-up Items" value={metadata.follow_up_items} />
                    <KeyValue label="Reminder Triggers" value={metadata.reminder_triggers} />
                  </MetadataSection>
                )}
              </>
            )}

            {/* ===== VIDEO METADATA ===== */}
            {isVideo && (
              <>
                {/* Summary */}
                {metadata.summary && (
                  <MetadataSection title="Summary" icon={MessageSquare} defaultOpen>
                    <KeyValue label="Brief" value={metadata.summary.brief} />
                    <KeyValue label="Detailed" value={metadata.summary.detailed} />
                    <KeyValue label="Duration" value={metadata.summary.duration_seconds ? `${Math.round(metadata.summary.duration_seconds / 60)} min` : undefined} />
                    {metadata.summary.key_moments?.map((moment: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-muted rounded">
                        <span className="font-medium">{moment.timestamp}</span>: {moment.description}
                        {moment.importance && <Badge variant="outline" className="ml-2">{moment.importance}</Badge>}
                      </div>
                    ))}
                  </MetadataSection>
                )}

                {/* Visual */}
                {metadata.visual && (
                  <MetadataSection title="Visual Analysis" icon={Eye}>
                    <KeyValue label="Scene Types" value={metadata.visual.scene_types} />
                    <KeyValue label="Locations Shown" value={metadata.visual.locations_shown} />
                    <KeyValue label="Indoor/Outdoor" value={metadata.visual.indoor_outdoor_ratio} />
                    <KeyValue label="Camera Movement" value={metadata.visual.camera_movement} />
                    <KeyValue label="Video Quality" value={metadata.visual.video_quality} />
                    <KeyValue label="Professional Production" value={metadata.visual.is_professional_production} />
                  </MetadataSection>
                )}

                {/* People */}
                {metadata.people && (
                  <MetadataSection title="People Analysis" icon={Users}>
                    <KeyValue label="Unique Faces" value={metadata.people.unique_faces_count} />
                    <KeyValue label="Group Interactions" value={metadata.people.group_interactions} />
                    <KeyValue label="Body Language Notes" value={metadata.people.body_language_notes} />
                  </MetadataSection>
                )}

                {/* Audio */}
                {metadata.audio && (
                  <MetadataSection title="Audio Analysis" icon={Music}>
                    <KeyValue label="Has Audio" value={metadata.audio.has_audio} />
                    <KeyValue label="Has Speech" value={metadata.audio.has_speech} />
                    <KeyValue label="Has Music" value={metadata.audio.has_music} />
                    <KeyValue label="Music Genre" value={metadata.audio.music_genre} />
                    <KeyValue label="Languages Spoken" value={metadata.audio.languages_spoken} />
                    <KeyValue label="Speaker Count" value={metadata.audio.speaker_count} />
                    {metadata.audio.transcription_summary && (
                      <div className="p-2 bg-muted rounded text-sm">
                        {metadata.audio.transcription_summary}
                      </div>
                    )}
                  </MetadataSection>
                )}

                {/* Activities */}
                {metadata.activities && (
                  <MetadataSection title="Activities" icon={Activity}>
                    <KeyValue label="Primary Activity" value={metadata.activities.primary} />
                    <KeyValue label="Secondary Activities" value={metadata.activities.secondary} />
                    <KeyValue label="Event Type" value={metadata.activities.event_type} />
                    <KeyValue label="Sports Detected" value={metadata.activities.sports_detected} />
                    <KeyValue label="Skills Demonstrated" value={metadata.activities.skills_demonstrated} />
                  </MetadataSection>
                )}

                {/* Content */}
                {metadata.content && (
                  <MetadataSection title="Content" icon={FileText}>
                    <KeyValue label="Topics Discussed" value={metadata.content.topics_discussed} />
                    <KeyValue label="Key Information" value={metadata.content.key_information} />
                    <KeyValue label="Names Mentioned" value={metadata.content.names_mentioned} />
                    <KeyValue label="Places Mentioned" value={metadata.content.places_mentioned} />
                    <KeyValue label="Story Arc" value={metadata.content.story_arc} />
                  </MetadataSection>
                )}

                {/* Intelligence */}
                {metadata.intelligence && (
                  <MetadataSection title="Intelligence" icon={Brain}>
                    <KeyValue label="Relationship Context" value={metadata.intelligence.relationship_context} />
                    <KeyValue label="Occasion Type" value={metadata.intelligence.occasion_type} />
                    <KeyValue label="Memory Value" value={metadata.intelligence.memory_value} />
                    <KeyValue label="Interests Revealed" value={metadata.intelligence.interests_revealed} />
                    <KeyValue label="Behavioral Observations" value={metadata.intelligence.behavioral_observations} />
                    <KeyValue label="Location Clues" value={metadata.intelligence.location_clues} />
                  </MetadataSection>
                )}
              </>
            )}

            {/* ===== DOCUMENT METADATA ===== */}
            {isDocument && (
              <>
                {/* Summary */}
                {metadata.summary && (
                  <MetadataSection title="Summary" icon={MessageSquare} defaultOpen>
                    <KeyValue label="One Line" value={metadata.summary.one_line} />
                    <KeyValue label="Detailed" value={metadata.summary.detailed} />
                    <KeyValue label="Executive Summary" value={metadata.summary.executive_summary} />
                    <KeyValue label="Key Takeaways" value={metadata.summary.key_takeaways} />
                  </MetadataSection>
                )}

                {/* Document Analysis */}
                {metadata.document_analysis && (
                  <MetadataSection title="Document Analysis" icon={FileText}>
                    <KeyValue label="Type" value={metadata.document_analysis.type} />
                    <KeyValue label="Subtype" value={metadata.document_analysis.subtype} />
                    <KeyValue label="Format" value={metadata.document_analysis.format} />
                    <KeyValue label="Language" value={metadata.document_analysis.language} />
                    <KeyValue label="Word Count" value={metadata.document_analysis.word_count_estimated} />
                    <KeyValue label="Writing Quality" value={metadata.document_analysis.writing_quality} />
                    <KeyValue label="Formality" value={metadata.document_analysis.formality_level} />
                    <KeyValue label="Intended Audience" value={metadata.document_analysis.intended_audience} />
                  </MetadataSection>
                )}

                {/* Extracted Data */}
                {metadata.extracted_data && (
                  <MetadataSection title="Extracted Data" icon={Eye}>
                    <KeyValue label="Title" value={metadata.extracted_data.title} />
                    <KeyValue label="Author" value={metadata.extracted_data.author} />
                    <KeyValue label="Organization" value={metadata.extracted_data.organization} />
                    <KeyValue label="Department" value={metadata.extracted_data.department} />
                    <KeyValue label="Date Created" value={metadata.extracted_data.date_created} />
                    <KeyValue label="Reference Numbers" value={metadata.extracted_data.reference_numbers} />
                  </MetadataSection>
                )}

                {/* Entities */}
                {metadata.entities && (
                  <MetadataSection title="Entities" icon={Users}>
                    {metadata.entities.people?.map((person: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-muted rounded">
                        <span className="font-medium">{person.name}</span>
                        {person.role && <span className="text-muted-foreground"> - {person.role}</span>}
                      </div>
                    ))}
                    <KeyValue label="Organizations" value={metadata.entities.organizations} />
                    <KeyValue label="Locations" value={metadata.entities.locations} />
                    <KeyValue label="Legal Terms" value={metadata.entities.legal_terms} />
                    <KeyValue label="Technical Terms" value={metadata.entities.technical_terms} />
                  </MetadataSection>
                )}

                {/* Content */}
                {metadata.content && (
                  <MetadataSection title="Content Classification" icon={Building}>
                    <KeyValue label="Main Topics" value={metadata.content.main_topics} />
                    <KeyValue label="Industry Sector" value={metadata.content.industry_sector} />
                    <KeyValue label="Subject Matter" value={metadata.content.subject_matter} />
                    <KeyValue label="Purpose" value={metadata.content.document_purpose} />
                    <KeyValue label="Sentiment" value={metadata.content.sentiment} />
                    <KeyValue label="Urgency" value={metadata.content.urgency_level} />
                    <KeyValue label="Confidentiality" value={metadata.content.confidentiality_level} />
                  </MetadataSection>
                )}

                {/* Actionables */}
                {metadata.actionables && (
                  <MetadataSection title="Actionable Items" icon={Clock}>
                    <KeyValue label="Action Items" value={metadata.actionables.action_items} />
                    <KeyValue label="Decisions Required" value={metadata.actionables.decisions_required} />
                    <KeyValue label="Commitments" value={metadata.actionables.commitments} />
                    <KeyValue label="Follow-ups" value={metadata.actionables.follow_ups} />
                    {metadata.actionables.deadlines?.map((deadline: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-muted rounded">
                        <span className="font-medium">{deadline.date}</span>: {deadline.item}
                      </div>
                    ))}
                  </MetadataSection>
                )}

                {/* Legal */}
                {metadata.legal_analysis?.is_legal_document && (
                  <MetadataSection title="Legal Analysis" icon={Briefcase}>
                    <KeyValue label="Contract Type" value={metadata.legal_analysis.contract_type} />
                    <KeyValue label="Key Clauses" value={metadata.legal_analysis.key_clauses} />
                    <KeyValue label="Obligations" value={metadata.legal_analysis.obligations} />
                    <KeyValue label="Rights Granted" value={metadata.legal_analysis.rights_granted} />
                    <KeyValue label="Termination Conditions" value={metadata.legal_analysis.termination_conditions} />
                    <KeyValue label="Signature Required" value={metadata.legal_analysis.signature_required} />
                  </MetadataSection>
                )}

                {/* Financial */}
                {metadata.financial_analysis?.contains_financial_data && (
                  <MetadataSection title="Financial Analysis" icon={DollarSign}>
                    <KeyValue label="Totals Mentioned" value={metadata.financial_analysis.totals_mentioned} />
                    <KeyValue label="Payment Terms" value={metadata.financial_analysis.payment_terms} />
                    <KeyValue label="Budget Items" value={metadata.financial_analysis.budget_items} />
                  </MetadataSection>
                )}

                {/* Reminders */}
                {metadata.reminder_triggers?.length > 0 && (
                  <MetadataSection title="Reminder Triggers" icon={Clock}>
                    {metadata.reminder_triggers.map((reminder: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-muted rounded space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{reminder.type}</Badge>
                          <span className="font-medium">{reminder.date}</span>
                        </div>
                        <p>{reminder.description}</p>
                      </div>
                    ))}
                  </MetadataSection>
                )}
              </>
            )}

            {/* Tags - Always show at bottom */}
            {tags.length > 0 && (
              <MetadataSection title="Tags & Keywords" icon={Tag} defaultOpen>
                <TagList tags={tags} max={25} />
                {metadata.search_keywords?.length > 0 && (
                  <>
                    <span className="text-xs font-medium text-muted-foreground mt-2 block">Search Keywords</span>
                    <TagList tags={metadata.search_keywords} max={15} />
                  </>
                )}
                {metadata.categories?.length > 0 && (
                  <>
                    <span className="text-xs font-medium text-muted-foreground mt-2 block">Categories</span>
                    <div className="flex flex-wrap gap-1">
                      {metadata.categories.map((cat: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{cat}</Badge>
                      ))}
                    </div>
                  </>
                )}
              </MetadataSection>
            )}

            {/* Memory Cues */}
            {metadata.memory_cues?.length > 0 && (
              <MetadataSection title="Memory Cues" icon={Globe}>
                <TagList tags={metadata.memory_cues} max={10} />
              </MetadataSection>
            )}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
