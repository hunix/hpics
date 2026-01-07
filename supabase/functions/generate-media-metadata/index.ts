import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetadataRequest {
  mode: 'single' | 'batch';
  mediaIds?: string[];
  documentIds?: string[];
  regenerate?: boolean;
  model?: string;
}

// Pricing per 1M tokens
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'google/gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'google/gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'google/gemini-2.5-flash-lite': { input: 0.019, output: 0.075 },
};

// ============ ENHANCED TOOL SCHEMAS ============

const ENHANCED_IMAGE_TOOL = {
  type: "function",
  function: {
    name: "extract_image_metadata",
    description: "Extract comprehensive structured metadata from an image for intelligence analysis",
    parameters: {
      type: "object",
      properties: {
        // CORE DESCRIPTION
        ai_description: { type: "string", description: "3-5 sentence detailed description of the image" },
        ai_summary_short: { type: "string", description: "One-line summary of the image" },
        
        // PEOPLE ANALYSIS
        people: {
          type: "object",
          properties: {
            count: { type: "number" },
            faces: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  position: { type: "string", enum: ["left", "center", "right", "background"] },
                  estimated_age_range: { type: "string" },
                  estimated_gender: { type: "string", enum: ["male", "female", "unknown"] },
                  expression: { type: "string" },
                  emotion: { type: "string" },
                  eye_contact: { type: "boolean" },
                  accessories: { type: "array", items: { type: "string" } },
                  facial_hair: { type: "string" },
                  is_primary_subject: { type: "boolean" }
                }
              }
            },
            group_dynamics: { type: "string" },
            relationships_suggested: { type: "array", items: { type: "string" } }
          }
        },
        
        // CLOTHING & APPEARANCE
        clothing_analysis: {
          type: "object",
          properties: {
            items: { type: "array", items: { type: "string" } },
            style: { type: "string", enum: ["formal", "casual", "athletic", "traditional", "business", "elegant", "streetwear", "uniform", "other"] },
            colors: { type: "array", items: { type: "string" } },
            occasion_suggested: { type: "string" },
            cultural_elements: { type: "array", items: { type: "string" } }
          }
        },
        
        // LOCATION & SETTING
        location_analysis: {
          type: "object",
          properties: {
            scene_type: { type: "string", enum: ["indoor", "outdoor", "vehicle", "aerial", "underwater", "studio"] },
            environment: { type: "string" },
            venue_type: { type: "string" },
            landmarks_detected: { type: "array", items: { type: "string" } },
            country_suggested: { type: "string" },
            city_suggested: { type: "string" },
            weather_visible: { type: "string" },
            time_of_day: { type: "string", enum: ["dawn", "morning", "afternoon", "evening", "night", "unknown"] },
            season_suggested: { type: "string", enum: ["spring", "summer", "autumn", "winter", "unknown"] }
          }
        },
        
        // OBJECTS & ITEMS
        objects: {
          type: "object",
          properties: {
            primary: { type: "array", items: { type: "string" } },
            secondary: { type: "array", items: { type: "string" } },
            electronics: { type: "array", items: { type: "string" } },
            vehicles: { type: "array", items: { type: "string" } },
            food_drinks: { type: "array", items: { type: "string" } },
            documents_visible: { type: "array", items: { type: "string" } },
            brands_detected: { type: "array", items: { type: "string" } },
            luxury_items: { type: "array", items: { type: "string" } },
            valuables_visible: { type: "boolean" }
          }
        },
        
        // ACTIVITIES & EVENTS
        activity_analysis: {
          type: "object",
          properties: {
            primary_activity: { type: "string" },
            event_type: { type: "string" },
            is_celebration: { type: "boolean" },
            is_professional: { type: "boolean" },
            sports_fitness: { type: "array", items: { type: "string" } },
            hobbies_indicated: { type: "array", items: { type: "string" } }
          }
        },
        
        // TEXT EXTRACTION (OCR)
        text_extraction: {
          type: "object",
          properties: {
            all_text: { type: "string" },
            languages_detected: { type: "array", items: { type: "string" } },
            handwritten_text: { type: "string" },
            printed_text: { type: "string" },
            signs_labels: { type: "array", items: { type: "string" } },
            document_content: {
              type: "object",
              properties: {
                type: { type: "string" },
                key_info: { type: "object", additionalProperties: { type: "string" } }
              }
            },
            contact_info_found: {
              type: "object",
              properties: {
                phone_numbers: { type: "array", items: { type: "string" } },
                emails: { type: "array", items: { type: "string" } },
                addresses: { type: "array", items: { type: "string" } },
                urls: { type: "array", items: { type: "string" } }
              }
            }
          }
        },
        
        // TECHNICAL QUALITY
        image_quality: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            sharpness: { type: "string", enum: ["sharp", "slightly_blurry", "blurry"] },
            exposure: { type: "string", enum: ["well_exposed", "overexposed", "underexposed"] },
            composition: { type: "string" },
            is_professional_photo: { type: "boolean" },
            camera_type_suggested: { type: "string" },
            editing_detected: { type: "boolean" },
            is_screenshot: { type: "boolean" },
            is_scan: { type: "boolean" },
            is_meme_graphic: { type: "boolean" }
          }
        },
        
        // VISUAL PROPERTIES
        visual_properties: {
          type: "object",
          properties: {
            dominant_colors: { type: "array", items: { type: "string" } },
            color_palette: { type: "array", items: { type: "string" } },
            brightness: { type: "string", enum: ["dark", "dim", "normal", "bright", "very_bright"] },
            contrast: { type: "string", enum: ["low", "normal", "high"] },
            saturation: { type: "string", enum: ["desaturated", "normal", "vibrant"] },
            artistic_style: { type: "string" },
            filter_detected: { type: "string" }
          }
        },
        
        // INTELLIGENCE TAGS
        intelligence: {
          type: "object",
          properties: {
            relationship_context: { type: "array", items: { type: "string" } },
            life_events: { type: "array", items: { type: "string" } },
            interests_revealed: { type: "array", items: { type: "string" } },
            personality_cues: { type: "array", items: { type: "string" } },
            wealth_indicators: { type: "array", items: { type: "string" } },
            profession_cues: { type: "array", items: { type: "string" } },
            travel_indicators: { type: "array", items: { type: "string" } }
          }
        },
        
        // CONTENT FLAGS
        content_flags: {
          type: "object",
          properties: {
            is_sensitive: { type: "boolean" },
            sensitivity_type: { type: "array", items: { type: "string" } },
            contains_minors: { type: "boolean" },
            security_level_suggested: { type: "string", enum: ["public", "private", "confidential"] }
          }
        },
        
        // SEARCHABILITY
        tags: { type: "array", items: { type: "string" }, description: "15-25 comprehensive searchable tags" },
        categories: { type: "array", items: { type: "string" } },
        search_keywords: { type: "array", items: { type: "string" } },
        
        // CROSS-REFERENCE
        similar_to: { type: "array", items: { type: "string" } },
        memory_cues: { type: "array", items: { type: "string" } }
      },
      required: ["ai_description", "ai_summary_short", "tags", "location_analysis", "image_quality"],
      additionalProperties: false
    }
  }
};

const ENHANCED_AUDIO_TOOL = {
  type: "function",
  function: {
    name: "extract_audio_metadata",
    description: "Extract comprehensive structured metadata from audio for intelligence analysis",
    parameters: {
      type: "object",
      properties: {
        // TRANSCRIPTION
        transcription: {
          type: "object",
          properties: {
            full_text: { type: "string" },
            with_timestamps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  start: { type: "number" },
                  end: { type: "number" },
                  text: { type: "string" },
                  speaker_id: { type: "string" }
                }
              }
            },
            word_count: { type: "number" },
            language_primary: { type: "string" },
            languages_detected: { type: "array", items: { type: "string" } },
            confidence_score: { type: "number" }
          }
        },
        
        // SPEAKER ANALYSIS
        speakers: {
          type: "object",
          properties: {
            count: { type: "number" },
            diarization: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  speaker_id: { type: "string" },
                  speaking_time_seconds: { type: "number" },
                  speaking_percentage: { type: "number" },
                  estimated_gender: { type: "string" },
                  estimated_age_range: { type: "string" },
                  voice_characteristics: { type: "array", items: { type: "string" } },
                  accent_detected: { type: "string" },
                  language_style: { type: "string" }
                }
              }
            },
            dominant_speaker: { type: "string" },
            conversation_balance: { type: "string", enum: ["balanced", "one_sided", "monologue"] }
          }
        },
        
        // CONTENT ANALYSIS
        content: {
          type: "object",
          properties: {
            summary: { type: "string" },
            summary_detailed: { type: "string" },
            topics_main: { type: "array", items: { type: "string" } },
            topics_mentioned: { type: "array", items: { type: "string" } },
            key_points: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } },
            decisions_made: { type: "array", items: { type: "string" } },
            questions_asked: { type: "array", items: { type: "string" } },
            questions_unanswered: { type: "array", items: { type: "string" } },
            names_mentioned: { type: "array", items: { type: "string" } },
            organizations_mentioned: { type: "array", items: { type: "string" } },
            locations_mentioned: { type: "array", items: { type: "string" } },
            dates_times_mentioned: { type: "array", items: { type: "string" } },
            numbers_amounts_mentioned: { type: "array", items: { type: "string" } }
          }
        },
        
        // EMOTIONAL ANALYSIS
        emotional_analysis: {
          type: "object",
          properties: {
            overall_sentiment: { type: "string", enum: ["very_positive", "positive", "neutral", "negative", "very_negative", "mixed"] },
            sentiment_timeline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  sentiment: { type: "string" },
                  intensity: { type: "number" }
                }
              }
            },
            emotional_moments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  emotion: { type: "string" },
                  trigger: { type: "string" }
                }
              }
            },
            tension_points: { type: "array", items: { type: "string" } },
            positive_moments: { type: "array", items: { type: "string" } },
            humor_detected: { type: "boolean" },
            conflict_indicators: { type: "array", items: { type: "string" } }
          }
        },
        
        // CONVERSATION DYNAMICS
        dynamics: {
          type: "object",
          properties: {
            conversation_type: { type: "string", enum: ["interview", "meeting", "casual_chat", "presentation", "debate", "negotiation", "other"] },
            formality_level: { type: "string", enum: ["very_formal", "formal", "neutral", "casual", "very_casual"] },
            power_dynamics: { type: "string", enum: ["equal", "hierarchical", "one_dominant"] },
            rapport_level: { type: "string", enum: ["high", "medium", "low", "tense"] },
            interruptions_count: { type: "number" },
            agreements: { type: "array", items: { type: "string" } },
            disagreements: { type: "array", items: { type: "string" } },
            turn_taking_pattern: { type: "string" }
          }
        },
        
        // INTELLIGENCE EXTRACTION
        intelligence: {
          type: "object",
          properties: {
            commitments_made: { type: "array", items: { type: "string" } },
            preferences_expressed: { type: "array", items: { type: "string" } },
            opinions_stated: { type: "array", items: { type: "string" } },
            complaints_concerns: { type: "array", items: { type: "string" } },
            interests_discussed: { type: "array", items: { type: "string" } },
            plans_mentioned: { type: "array", items: { type: "string" } },
            relationship_references: { type: "array", items: { type: "string" } },
            work_references: { type: "array", items: { type: "string" } },
            financial_references: { type: "array", items: { type: "string" } }
          }
        },
        
        // AUDIO QUALITY
        audio_quality: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            clarity: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
            background_noise_level: { type: "string", enum: ["none", "minimal", "moderate", "significant"] },
            background_sounds: { type: "array", items: { type: "string" } },
            recording_environment: { type: "string" }
          }
        },
        
        // CLASSIFICATION
        audio_type: { type: "string", enum: ["conversation", "voicemail", "meeting", "interview", "speech", "music", "podcast", "other"] },
        tags: { type: "array", items: { type: "string" }, description: "15-25 comprehensive searchable tags" },
        search_keywords: { type: "array", items: { type: "string" } },
        categories: { type: "array", items: { type: "string" } },
        
        // FOLLOW-UP
        follow_up_items: { type: "array", items: { type: "string" } },
        reminder_triggers: { type: "array", items: { type: "string" } }
      },
      required: ["transcription", "content", "audio_type", "tags"],
      additionalProperties: false
    }
  }
};

const ENHANCED_VIDEO_TOOL = {
  type: "function",
  function: {
    name: "extract_video_metadata",
    description: "Extract comprehensive structured metadata from video for intelligence analysis",
    parameters: {
      type: "object",
      properties: {
        // OVERALL SUMMARY
        summary: {
          type: "object",
          properties: {
            brief: { type: "string" },
            detailed: { type: "string" },
            duration_seconds: { type: "number" },
            key_moments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  description: { type: "string" },
                  importance: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            }
          }
        },
        
        // VISUAL ANALYSIS
        visual: {
          type: "object",
          properties: {
            scene_types: { type: "array", items: { type: "string" } },
            scene_changes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  from_scene: { type: "string" },
                  to_scene: { type: "string" }
                }
              }
            },
            locations_shown: { type: "array", items: { type: "string" } },
            indoor_outdoor_ratio: { type: "string" },
            lighting_conditions: { type: "array", items: { type: "string" } },
            camera_movement: { type: "string", enum: ["static", "handheld", "panning", "tracking", "mixed"] },
            video_quality: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
            is_professional_production: { type: "boolean" }
          }
        },
        
        // PEOPLE IN VIDEO
        people: {
          type: "object",
          properties: {
            unique_faces_count: { type: "number" },
            main_subjects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  estimated_age: { type: "string" },
                  estimated_gender: { type: "string" },
                  screen_time_percentage: { type: "number" },
                  activities: { type: "array", items: { type: "string" } },
                  clothing_style: { type: "string" },
                  emotional_arc: { type: "array", items: { type: "string" } }
                }
              }
            },
            group_interactions: { type: "array", items: { type: "string" } },
            body_language_notes: { type: "array", items: { type: "string" } }
          }
        },
        
        // AUDIO ANALYSIS
        audio: {
          type: "object",
          properties: {
            has_audio: { type: "boolean" },
            has_speech: { type: "boolean" },
            has_music: { type: "boolean" },
            music_genre: { type: "string" },
            transcription_summary: { type: "string" },
            full_transcription: { type: "string" },
            languages_spoken: { type: "array", items: { type: "string" } },
            speaker_count: { type: "number" },
            audio_quality: { type: "string" }
          }
        },
        
        // ACTIVITY & EVENTS
        activities: {
          type: "object",
          properties: {
            primary: { type: "string" },
            secondary: { type: "array", items: { type: "string" } },
            event_type: { type: "string" },
            sports_detected: { type: "array", items: { type: "string" } },
            skills_demonstrated: { type: "array", items: { type: "string" } }
          }
        },
        
        // CONTENT ANALYSIS
        content: {
          type: "object",
          properties: {
            topics_discussed: { type: "array", items: { type: "string" } },
            key_information: { type: "array", items: { type: "string" } },
            names_mentioned: { type: "array", items: { type: "string" } },
            places_mentioned: { type: "array", items: { type: "string" } },
            dates_referenced: { type: "array", items: { type: "string" } },
            tutorial_steps: { type: "array", items: { type: "string" } },
            story_arc: { type: "string" }
          }
        },
        
        // INTELLIGENCE
        intelligence: {
          type: "object",
          properties: {
            relationship_context: { type: "string" },
            occasion_type: { type: "string" },
            memory_value: { type: "string", enum: ["high", "medium", "low"] },
            interests_revealed: { type: "array", items: { type: "string" } },
            behavioral_observations: { type: "array", items: { type: "string" } },
            location_clues: { type: "array", items: { type: "string" } }
          }
        },
        
        // CLASSIFICATION
        video_type: { type: "string", enum: ["home_video", "meeting", "event", "tutorial", "interview", "vlog", "presentation", "other"] },
        tags: { type: "array", items: { type: "string" }, description: "15-25 comprehensive searchable tags" },
        categories: { type: "array", items: { type: "string" } },
        search_keywords: { type: "array", items: { type: "string" } },
        
        // TIMESTAMPS
        notable_timestamps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time: { type: "string" },
              event: { type: "string" },
              tags: { type: "array", items: { type: "string" } }
            }
          }
        }
      },
      required: ["summary", "visual", "video_type", "tags"],
      additionalProperties: false
    }
  }
};

const ENHANCED_DOCUMENT_TOOL = {
  type: "function",
  function: {
    name: "extract_document_metadata",
    description: "Extract comprehensive structured metadata from a document for intelligence analysis",
    parameters: {
      type: "object",
      properties: {
        // SUMMARY
        summary: {
          type: "object",
          properties: {
            one_line: { type: "string" },
            detailed: { type: "string" },
            executive_summary: { type: "string" },
            key_takeaways: { type: "array", items: { type: "string" } }
          }
        },
        
        // DOCUMENT ANALYSIS
        document_analysis: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["contract", "resume", "report", "article", "presentation", "notes", "form", "letter", "invoice", "receipt", "legal", "other"] },
            subtype: { type: "string" },
            format: { type: "string" },
            page_count: { type: "number" },
            word_count_estimated: { type: "number" },
            language: { type: "string" },
            languages_detected: { type: "array", items: { type: "string" } },
            writing_quality: { type: "string", enum: ["excellent", "good", "average", "poor"] },
            formality_level: { type: "string", enum: ["very_formal", "formal", "neutral", "casual", "very_casual"] },
            intended_audience: { type: "string" }
          }
        },
        
        // STRUCTURED EXTRACTION
        extracted_data: {
          type: "object",
          properties: {
            title: { type: "string" },
            author: { type: "string" },
            date_created: { type: "string" },
            dates_mentioned: { type: "array", items: { type: "string" } },
            organization: { type: "string" },
            department: { type: "string" },
            reference_numbers: { type: "array", items: { type: "string" } },
            version_info: { type: "string" }
          }
        },
        
        // ENTITY EXTRACTION
        entities: {
          type: "object",
          properties: {
            people: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string" },
                  mentions_count: { type: "number" }
                }
              }
            },
            organizations: { type: "array", items: { type: "string" } },
            locations: { type: "array", items: { type: "string" } },
            monetary_amounts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  amount: { type: "string" },
                  currency: { type: "string" },
                  context: { type: "string" }
                }
              }
            },
            dates_deadlines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  context: { type: "string" },
                  is_deadline: { type: "boolean" }
                }
              }
            },
            percentages_metrics: { type: "array", items: { type: "string" } },
            legal_terms: { type: "array", items: { type: "string" } },
            technical_terms: { type: "array", items: { type: "string" } }
          }
        },
        
        // CONTENT CLASSIFICATION
        content: {
          type: "object",
          properties: {
            main_topics: { type: "array", items: { type: "string" } },
            secondary_topics: { type: "array", items: { type: "string" } },
            industry_sector: { type: "string" },
            subject_matter: { type: "string" },
            document_purpose: { type: "string", enum: ["inform", "request", "agreement", "proposal", "report", "record", "instruct", "other"] },
            sentiment: { type: "string", enum: ["very_positive", "positive", "neutral", "negative", "very_negative", "formal"] },
            urgency_level: { type: "string", enum: ["critical", "high", "medium", "low", "none"] },
            confidentiality_level: { type: "string", enum: ["public", "internal", "confidential", "restricted"] }
          }
        },
        
        // ACTIONABLE ITEMS
        actionables: {
          type: "object",
          properties: {
            action_items: { type: "array", items: { type: "string" } },
            decisions_required: { type: "array", items: { type: "string" } },
            commitments: { type: "array", items: { type: "string" } },
            deadlines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  date: { type: "string" }
                }
              }
            },
            follow_ups: { type: "array", items: { type: "string" } },
            questions_to_address: { type: "array", items: { type: "string" } }
          }
        },
        
        // LEGAL/COMPLIANCE
        legal_analysis: {
          type: "object",
          properties: {
            is_legal_document: { type: "boolean" },
            contract_type: { type: "string" },
            key_clauses: { type: "array", items: { type: "string" } },
            obligations: { type: "array", items: { type: "string" } },
            rights_granted: { type: "array", items: { type: "string" } },
            termination_conditions: { type: "array", items: { type: "string" } },
            liability_clauses: { type: "array", items: { type: "string" } },
            signature_required: { type: "boolean" }
          }
        },
        
        // FINANCIAL
        financial_analysis: {
          type: "object",
          properties: {
            contains_financial_data: { type: "boolean" },
            totals_mentioned: { type: "array", items: { type: "string" } },
            payment_terms: { type: "string" },
            budget_items: { type: "array", items: { type: "string" } }
          }
        },
        
        // RELATIONSHIPS
        relationships: {
          type: "object",
          properties: {
            parties_involved: { type: "array", items: { type: "string" } },
            relationship_type: { type: "string" },
            power_dynamic: { type: "string" }
          }
        },
        
        // SEARCHABILITY
        tags: { type: "array", items: { type: "string" }, description: "15-25 comprehensive searchable tags" },
        categories: { type: "array", items: { type: "string" } },
        search_keywords: { type: "array", items: { type: "string" } },
        related_topics: { type: "array", items: { type: "string" } },
        
        // REMINDERS
        reminder_triggers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["expiry", "deadline", "renewal", "review", "follow_up"] },
              date: { type: "string" },
              description: { type: "string" },
              days_before: { type: "number" }
            }
          }
        }
      },
      required: ["summary", "document_analysis", "content", "tags"],
      additionalProperties: false
    }
  }
};

// ============ ENHANCED PROMPTS ============

const IMAGE_SYSTEM_PROMPT = `You are an advanced AI intelligence analyst specializing in comprehensive image analysis for a personal relationship management system.

Your task is to extract EVERY piece of useful information from images that could be valuable for:
1. Understanding relationships and social dynamics
2. Building personality profiles
3. Tracking life events and milestones
4. Identifying interests, hobbies, and preferences
5. Geographic and location intelligence
6. Financial and lifestyle indicators
7. Professional and career insights

Be thorough and extract:
- Detailed people analysis (age, gender, expressions, relationships, clothing, accessories)
- Location and setting details (landmarks, venue types, weather, time of day)
- All visible objects, brands, and items
- Any text visible through OCR
- Activities, events, and occasions
- Technical image quality metrics
- Intelligence insights for relationship management

Always provide comprehensive tags (15-25) for searchability.`;

const IMAGE_USER_PROMPT = `Analyze this image comprehensively and extract ALL possible metadata. Use the extract_image_metadata function to return structured analysis including:

1. PEOPLE: Count faces, estimate ages/genders, analyze expressions, note clothing and accessories, identify relationships
2. LOCATION: Determine scene type, environment, landmarks, country/city hints, weather, time of day
3. OBJECTS: List all visible items, electronics, vehicles, food, documents, brands, luxury items
4. ACTIVITIES: What's happening? Is it an event? Professional or personal?
5. TEXT: Extract ALL visible text (OCR) - signs, documents, screens, handwriting
6. QUALITY: Rate image quality, determine if professional, screenshot, scan, etc.
7. INTELLIGENCE: Identify relationship context, life events, interests, wealth indicators, profession cues
8. TAGS: Generate 15-25 comprehensive searchable tags

Be thorough - this metadata will be used for AI analysis and search across thousands of images.`;

const AUDIO_SYSTEM_PROMPT = `You are an advanced AI intelligence analyst specializing in comprehensive audio analysis for a personal relationship management system.

Your task is to extract EVERY piece of useful information from audio that could be valuable for:
1. Understanding conversations and communication patterns
2. Tracking commitments, decisions, and action items
3. Analyzing emotional dynamics and relationship health
4. Identifying interests, preferences, and opinions
5. Extracting mentioned people, places, dates, and amounts
6. Assessing speaker dynamics and conversation quality

Be thorough and extract:
- Complete or detailed transcription with speaker identification
- Speaker analysis (count, characteristics, speaking patterns)
- Content analysis (topics, key points, action items, decisions)
- Emotional analysis (sentiment, tension points, positive moments)
- Conversation dynamics (type, formality, power dynamics)
- Intelligence extraction (commitments, preferences, plans, relationships)

Always provide comprehensive tags (15-25) for searchability.`;

const AUDIO_USER_PROMPT = `Analyze this audio comprehensively and extract ALL possible metadata. Use the extract_audio_metadata function to return structured analysis including:

1. TRANSCRIPTION: Provide complete or detailed transcription with speaker identification where possible
2. SPEAKERS: Count speakers, analyze voice characteristics, accents, speaking styles
3. CONTENT: Identify main topics, key points, action items, decisions, questions
4. ENTITIES: Extract all names, organizations, locations, dates, amounts mentioned
5. EMOTIONAL: Analyze overall sentiment, emotional moments, tension points, humor
6. DYNAMICS: Determine conversation type, formality, rapport, power dynamics
7. INTELLIGENCE: Extract commitments, preferences, opinions, plans, relationship references
8. TAGS: Generate 15-25 comprehensive searchable tags

Be thorough - this metadata will be used for AI analysis and relationship intelligence.`;

const VIDEO_SYSTEM_PROMPT = `You are an advanced AI intelligence analyst specializing in comprehensive video analysis for a personal relationship management system.

Your task is to extract EVERY piece of useful information from videos that could be valuable for:
1. Understanding events, activities, and social dynamics
2. Analyzing people's behaviors and interactions
3. Tracking life events and memorable moments
4. Combining visual and audio intelligence
5. Identifying locations, settings, and contexts
6. Building comprehensive relationship profiles

Be thorough and extract:
- Overall summary with key moments and timestamps
- Visual analysis (scenes, locations, lighting, camera work)
- People analysis (faces, activities, emotional arcs, interactions)
- Audio analysis (speech, music, transcription)
- Activity and event recognition
- Intelligence insights for relationship management

Always provide comprehensive tags (15-25) for searchability.`;

const VIDEO_USER_PROMPT = `Analyze this video comprehensively and extract ALL possible metadata. Use the extract_video_metadata function to return structured analysis including:

1. SUMMARY: Provide brief and detailed summaries with key moments
2. VISUAL: Analyze scene types, locations, lighting, camera movement, quality
3. PEOPLE: Count unique faces, analyze main subjects, activities, emotional arcs
4. AUDIO: Analyze speech, music, provide transcription summary
5. ACTIVITIES: Identify primary activities, event types, sports, skills shown
6. CONTENT: Extract topics discussed, names/places mentioned, story arc
7. INTELLIGENCE: Determine relationship context, occasion, memory value
8. TIMESTAMPS: Note notable moments with timestamps
9. TAGS: Generate 15-25 comprehensive searchable tags

Be thorough - this metadata will be used for AI analysis and relationship intelligence.`;

const DOCUMENT_SYSTEM_PROMPT = `You are an advanced AI intelligence analyst specializing in comprehensive document analysis for a personal relationship management system.

Your task is to extract EVERY piece of useful information from documents that could be valuable for:
1. Understanding agreements, contracts, and obligations
2. Tracking deadlines, action items, and commitments
3. Identifying parties, relationships, and power dynamics
4. Extracting financial and legal information
5. Building comprehensive relationship profiles
6. Creating actionable reminders and follow-ups

Be thorough and extract:
- Comprehensive summaries at multiple detail levels
- Document type and structure analysis
- Entity extraction (people, organizations, dates, amounts)
- Content classification and topic analysis
- Actionable items and deadlines
- Legal and financial analysis where applicable
- Relationship insights

Always provide comprehensive tags (15-25) for searchability.`;

const DOCUMENT_USER_PROMPT = `Analyze this document comprehensively and extract ALL possible metadata. Use the extract_document_metadata function to return structured analysis including:

1. SUMMARY: Provide one-line, detailed, and executive summaries with key takeaways
2. DOCUMENT ANALYSIS: Determine type, format, language, quality, audience
3. EXTRACTED DATA: Extract title, author, dates, organization, references
4. ENTITIES: Extract all people (with roles), organizations, locations, amounts, dates/deadlines
5. CONTENT: Classify main topics, industry, purpose, sentiment, urgency, confidentiality
6. ACTIONABLES: List action items, decisions required, commitments, deadlines, follow-ups
7. LEGAL: If applicable, analyze clauses, obligations, rights, termination conditions
8. FINANCIAL: Extract any financial data, amounts, payment terms
9. RELATIONSHIPS: Identify parties involved and relationship dynamics
10. REMINDERS: Suggest reminder triggers for deadlines, expiries, renewals
11. TAGS: Generate 15-25 comprehensive searchable tags

Be thorough - this metadata will be used for AI analysis, reminders, and relationship intelligence.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // Create client with user's auth header for getClaims
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate JWT using getClaims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const userId = claimsData.claims.sub as string;
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: MetadataRequest = await req.json();
    const { mode, mediaIds = [], documentIds = [], regenerate = false, model = 'google/gemini-2.5-flash' } = body;

    const results: Array<{ id: string; type: 'media' | 'document'; success: boolean; error?: string }> = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Process media items
    for (const mediaId of mediaIds) {
      try {
        const { data: media, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .eq('id', mediaId)
          .single();

        if (mediaError || !media) {
          results.push({ id: mediaId, type: 'media', success: false, error: 'Media not found' });
          continue;
        }

        if (media.ai_metadata && !regenerate) {
          results.push({ id: mediaId, type: 'media', success: true, error: 'Already processed' });
          continue;
        }

        await supabase
          .from('media')
          .update({ ai_generation_status: 'processing', ai_generation_error: null })
          .eq('id', mediaId);

        const storagePath = media.storage_path || media.file_url;
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('media')
          .createSignedUrl(storagePath, 3600);

        if (urlError || !signedUrlData?.signedUrl) {
          await supabase
            .from('media')
            .update({ ai_generation_status: 'failed', ai_generation_error: 'Could not get file URL' })
            .eq('id', mediaId);
          results.push({ id: mediaId, type: 'media', success: false, error: 'Could not get file URL' });
          continue;
        }

        const isImage = media.mime_type?.startsWith('image/');
        const isAudio = media.mime_type?.startsWith('audio/');
        const isVideo = media.mime_type?.startsWith('video/');

        let systemPrompt = '';
        let userPrompt = '';
        let tool: any = null;
        let elevenlabsTranscription: any = null;

        if (isImage) {
          systemPrompt = IMAGE_SYSTEM_PROMPT;
          userPrompt = IMAGE_USER_PROMPT;
          tool = ENHANCED_IMAGE_TOOL;
        } else if (isAudio) {
          systemPrompt = AUDIO_SYSTEM_PROMPT;
          userPrompt = AUDIO_USER_PROMPT;
          tool = ENHANCED_AUDIO_TOOL;
          
          // Try to get high-quality transcription from ElevenLabs Scribe
          const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
          if (elevenlabsApiKey) {
            try {
              console.log(`Fetching audio file for ElevenLabs transcription: ${mediaId}`);
              
              // Fetch the audio file
              const audioResponse = await fetch(signedUrlData.signedUrl);
              if (audioResponse.ok) {
                const audioBlob = await audioResponse.blob();
                
                // Call ElevenLabs Scribe API
                const formData = new FormData();
                formData.append('file', audioBlob, 'audio.opus');
                formData.append('model_id', 'scribe_v1');
                formData.append('tag_audio_events', 'true');
                formData.append('diarize', 'true');
                
                const scribeResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
                  method: 'POST',
                  headers: {
                    'xi-api-key': elevenlabsApiKey,
                  },
                  body: formData,
                });
                
                if (scribeResponse.ok) {
                  elevenlabsTranscription = await scribeResponse.json();
                  console.log(`ElevenLabs transcription completed for ${mediaId}: ${elevenlabsTranscription.text?.length || 0} chars`);
                } else {
                  console.error(`ElevenLabs Scribe error for ${mediaId}: ${scribeResponse.status}`);
                }
              }
            } catch (transcriptionError) {
              console.error(`ElevenLabs transcription failed for ${mediaId}:`, transcriptionError);
              // Continue with AI analysis even if transcription fails
            }
          }
        } else if (isVideo) {
          systemPrompt = VIDEO_SYSTEM_PROMPT;
          userPrompt = VIDEO_USER_PROMPT;
          tool = ENHANCED_VIDEO_TOOL;
        } else {
          results.push({ id: mediaId, type: 'media', success: false, error: 'Unsupported media type' });
          continue;
        }

        const messages: Array<{ role: string; content: any }> = [
          { role: "system", content: systemPrompt }
        ];

        if (isImage) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: signedUrlData.signedUrl } }
            ]
          });
        } else if (isAudio && elevenlabsTranscription) {
          // Enhance prompt with ElevenLabs transcription for better analysis
          const transcriptContext = `
HIGH-QUALITY TRANSCRIPTION (from ElevenLabs Scribe):
${elevenlabsTranscription.text}

WORD-LEVEL DETAILS:
${JSON.stringify(elevenlabsTranscription.words?.slice(0, 100) || [], null, 2)}

AUDIO EVENTS DETECTED:
${JSON.stringify(elevenlabsTranscription.audio_events || [], null, 2)}

Use this precise transcription to analyze the audio content. Focus on extracting intelligence, emotional analysis, speaker dynamics, and actionable insights.
`;
          messages.push({
            role: "user",
            content: `${userPrompt}\n\n${transcriptContext}\n\nMedia URL for additional context: ${signedUrlData.signedUrl}`
          });
        } else {
          messages.push({
            role: "user",
            content: `${userPrompt}\n\nMedia URL: ${signedUrlData.signedUrl}`
          });
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            tools: [tool],
            tool_choice: { type: "function", function: { name: tool.function.name } },
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI API error:', aiResponse.status, errorText);
          
          await supabase
            .from('media')
            .update({ 
              ai_generation_status: 'failed', 
              ai_generation_error: `AI API error: ${aiResponse.status}` 
            })
            .eq('id', mediaId);
          
          results.push({ id: mediaId, type: 'media', success: false, error: `AI API error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall?.function?.arguments) {
          await supabase
            .from('media')
            .update({ ai_generation_status: 'failed', ai_generation_error: 'No metadata extracted' })
            .eq('id', mediaId);
          results.push({ id: mediaId, type: 'media', success: false, error: 'No metadata extracted' });
          continue;
        }

        const metadata = JSON.parse(toolCall.function.arguments);
        
        // Add ElevenLabs transcription data if available
        if (elevenlabsTranscription) {
          metadata.elevenlabs_transcription = {
            text: elevenlabsTranscription.text,
            words: elevenlabsTranscription.words,
            audio_events: elevenlabsTranscription.audio_events,
            language_detected: elevenlabsTranscription.language_code,
          };
        }
        
        const inputTokens = aiData.usage?.prompt_tokens || 0;
        const outputTokens = aiData.usage?.completion_tokens || 0;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;

        const pricing = MODEL_PRICING[model] || MODEL_PRICING['google/gemini-2.5-flash'];
        const costCents = Math.ceil(
          ((inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output) * 100
        );

        await supabase
          .from('media')
          .update({
            ai_metadata: metadata,
            ai_metadata_generated_at: new Date().toISOString(),
            ai_model_used: model,
            ai_generation_status: 'completed',
            ai_generation_error: null,
          })
          .eq('id', mediaId);

        await supabase.from('ai_usage_logs').insert({
          user_id: userId,
          profile_id: media.profile_id,
          function_name: 'generate-media-metadata',
          provider: model.split('/')[0],
          model_name: model,
          estimated_cost_cents: costCents,
          actual_cost_cents: costCents,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          status: 'completed',
          request_metadata: { mediaId, mimeType: media.mime_type },
        });

        // Trigger biometric matching for images with detected faces
        if (isImage && metadata.people?.count > 0 && metadata.people?.faces?.length > 0) {
          try {
            // Queue biometric match for each detected face (high confidence faces only)
            const facesWithPotential = metadata.people.faces.filter((f: any) => f.is_primary_subject);
            if (facesWithPotential.length > 0) {
              // Create a biometric match record for review
              await supabase.from('biometric_matches').insert({
                user_id: userId,
                source_type: 'media',
                source_id: mediaId,
                match_type: 'facial',
                auto_tagged: false,
                confidence_score: 0, // Will be updated when match-biometrics runs
                alternative_matches: { 
                  pending_analysis: true,
                  faces_detected: metadata.people.count,
                  media_url: signedUrlData.signedUrl 
                },
              });
              console.log(`Queued biometric matching for media ${mediaId} with ${metadata.people.count} faces`);
            }
          } catch (bioError) {
            console.log(`Biometric queue error for media ${mediaId}:`, bioError);
            // Non-blocking - don't fail the main process
          }
        }

        results.push({ id: mediaId, type: 'media', success: true });
        console.log(`Processed media ${mediaId}: ${inputTokens + outputTokens} tokens, $${(costCents / 100).toFixed(4)}`);

      } catch (itemError) {
        console.error(`Error processing media ${mediaId}:`, itemError);
        await supabase
          .from('media')
          .update({ 
            ai_generation_status: 'failed', 
            ai_generation_error: itemError instanceof Error ? itemError.message : 'Unknown error'
          })
          .eq('id', mediaId);
        results.push({ 
          id: mediaId, 
          type: 'media', 
          success: false, 
          error: itemError instanceof Error ? itemError.message : 'Unknown error' 
        });
      }
    }

    // Process documents
    for (const documentId of documentIds) {
      try {
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (docError || !doc) {
          results.push({ id: documentId, type: 'document', success: false, error: 'Document not found' });
          continue;
        }

        if (doc.ai_metadata && !regenerate) {
          results.push({ id: documentId, type: 'document', success: true, error: 'Already processed' });
          continue;
        }

        await supabase
          .from('documents')
          .update({ ai_generation_status: 'processing', ai_generation_error: null })
          .eq('id', documentId);

        const storagePath = doc.storage_path || doc.file_url;
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(storagePath, 3600);

        if (urlError || !signedUrlData?.signedUrl) {
          await supabase
            .from('documents')
            .update({ ai_generation_status: 'failed', ai_generation_error: 'Could not get file URL' })
            .eq('id', documentId);
          results.push({ id: documentId, type: 'document', success: false, error: 'Could not get file URL' });
          continue;
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: DOCUMENT_SYSTEM_PROMPT },
              { role: "user", content: `${DOCUMENT_USER_PROMPT}\n\nDocument URL: ${signedUrlData.signedUrl}\nDocument title: ${doc.title}\nDocument type: ${doc.document_type}` }
            ],
            tools: [ENHANCED_DOCUMENT_TOOL],
            tool_choice: { type: "function", function: { name: "extract_document_metadata" } },
          }),
        });

        if (!aiResponse.ok) {
          await supabase
            .from('documents')
            .update({ ai_generation_status: 'failed', ai_generation_error: `AI API error: ${aiResponse.status}` })
            .eq('id', documentId);
          results.push({ id: documentId, type: 'document', success: false, error: `AI API error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

        if (!toolCall?.function?.arguments) {
          await supabase
            .from('documents')
            .update({ ai_generation_status: 'failed', ai_generation_error: 'No metadata extracted' })
            .eq('id', documentId);
          results.push({ id: documentId, type: 'document', success: false, error: 'No metadata extracted' });
          continue;
        }

        const metadata = JSON.parse(toolCall.function.arguments);
        const inputTokens = aiData.usage?.prompt_tokens || 0;
        const outputTokens = aiData.usage?.completion_tokens || 0;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;

        const pricing = MODEL_PRICING[model] || MODEL_PRICING['google/gemini-2.5-flash'];
        const costCents = Math.ceil(
          ((inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output) * 100
        );

        await supabase
          .from('documents')
          .update({
            ai_metadata: metadata,
            ai_metadata_generated_at: new Date().toISOString(),
            ai_model_used: model,
            ai_generation_status: 'completed',
            ai_generation_error: null,
          })
          .eq('id', documentId);

        await supabase.from('ai_usage_logs').insert({
          user_id: userId,
          profile_id: doc.profile_id,
          function_name: 'generate-media-metadata',
          provider: model.split('/')[0],
          model_name: model,
          estimated_cost_cents: costCents,
          actual_cost_cents: costCents,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          status: 'completed',
          request_metadata: { documentId, documentType: doc.document_type },
        });

        results.push({ id: documentId, type: 'document', success: true });
        console.log(`Processed document ${documentId}: ${inputTokens + outputTokens} tokens, $${(costCents / 100).toFixed(4)}`);

      } catch (itemError) {
        console.error(`Error processing document ${documentId}:`, itemError);
        await supabase
          .from('documents')
          .update({ 
            ai_generation_status: 'failed', 
            ai_generation_error: itemError instanceof Error ? itemError.message : 'Unknown error'
          })
          .eq('id', documentId);
        results.push({ 
          id: documentId, 
          type: 'document', 
          success: false, 
          error: itemError instanceof Error ? itemError.message : 'Unknown error' 
        });
      }
    }

    const pricing = MODEL_PRICING[model] || MODEL_PRICING['google/gemini-2.5-flash'];
    const totalCostCents = Math.ceil(
      ((totalInputTokens / 1_000_000) * pricing.input + (totalOutputTokens / 1_000_000) * pricing.output) * 100
    );

    return new Response(JSON.stringify({
      results,
      summary: {
        processed: results.filter(r => r.success && r.error !== 'Already processed').length,
        skipped: results.filter(r => r.error === 'Already processed').length,
        failed: results.filter(r => !r.success).length,
        totalInputTokens,
        totalOutputTokens,
        totalCostCents,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-media-metadata:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
