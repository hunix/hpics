/**
 * Profiles Contacts Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json, Database } from '../base';

/**
 * Tables in this domain: certifications, contact_influence_profiles, contact_interests, contact_life_milestones, contact_locations, contact_methods, contact_observations, contact_personal_info, contact_relationships, digital_twins, dossiers, education, identity_blueprints, personality_profiles, profiles, profiles_access_logs, shared_contacts, unknown_persons
 */
export interface ProfilesContactsTables {
      certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          linkedin_id: string | null
          name: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          linkedin_id?: string | null
          name: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          linkedin_id?: string | null
          name?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_influence_profiles: {
        Row: {
          ai_model_used: string | null
          approach_sequence: Json | null
          attention_span: string | null
          authority_susceptibility: number | null
          avoid_words: string[] | null
          channel_preferences: Json | null
          commitment_consistency_susceptibility: number | null
          confidence_score: number | null
          created_at: string
          decision_style: string | null
          desire_motivators: string[] | null
          ego_sensitivities: string[] | null
          emotional_buying_triggers: Json | null
          evidence_sources: Json | null
          fear_motivators: string[] | null
          id: string
          information_preference: string | null
          last_analyzed_at: string | null
          liking_susceptibility: number | null
          memory_anchors: Json | null
          negative_triggers: Json | null
          overall_influence_score: number | null
          positive_triggers: Json | null
          power_words: string[] | null
          profile_id: string
          reciprocity_susceptibility: number | null
          recommended_methodologies: string[] | null
          risk_appetite: string | null
          scarcity_susceptibility: number | null
          social_proof_susceptibility: number | null
          thinking_style: string | null
          time_pressure_response: string | null
          timing_preferences: Json | null
          unity_susceptibility: number | null
          updated_at: string
          user_id: string
          validation_needs: Json | null
        }
        Insert: {
          ai_model_used?: string | null
          approach_sequence?: Json | null
          attention_span?: string | null
          authority_susceptibility?: number | null
          avoid_words?: string[] | null
          channel_preferences?: Json | null
          commitment_consistency_susceptibility?: number | null
          confidence_score?: number | null
          created_at?: string
          decision_style?: string | null
          desire_motivators?: string[] | null
          ego_sensitivities?: string[] | null
          emotional_buying_triggers?: Json | null
          evidence_sources?: Json | null
          fear_motivators?: string[] | null
          id?: string
          information_preference?: string | null
          last_analyzed_at?: string | null
          liking_susceptibility?: number | null
          memory_anchors?: Json | null
          negative_triggers?: Json | null
          overall_influence_score?: number | null
          positive_triggers?: Json | null
          power_words?: string[] | null
          profile_id: string
          reciprocity_susceptibility?: number | null
          recommended_methodologies?: string[] | null
          risk_appetite?: string | null
          scarcity_susceptibility?: number | null
          social_proof_susceptibility?: number | null
          thinking_style?: string | null
          time_pressure_response?: string | null
          timing_preferences?: Json | null
          unity_susceptibility?: number | null
          updated_at?: string
          user_id: string
          validation_needs?: Json | null
        }
        Update: {
          ai_model_used?: string | null
          approach_sequence?: Json | null
          attention_span?: string | null
          authority_susceptibility?: number | null
          avoid_words?: string[] | null
          channel_preferences?: Json | null
          commitment_consistency_susceptibility?: number | null
          confidence_score?: number | null
          created_at?: string
          decision_style?: string | null
          desire_motivators?: string[] | null
          ego_sensitivities?: string[] | null
          emotional_buying_triggers?: Json | null
          evidence_sources?: Json | null
          fear_motivators?: string[] | null
          id?: string
          information_preference?: string | null
          last_analyzed_at?: string | null
          liking_susceptibility?: number | null
          memory_anchors?: Json | null
          negative_triggers?: Json | null
          overall_influence_score?: number | null
          positive_triggers?: Json | null
          power_words?: string[] | null
          profile_id?: string
          reciprocity_susceptibility?: number | null
          recommended_methodologies?: string[] | null
          risk_appetite?: string | null
          scarcity_susceptibility?: number | null
          social_proof_susceptibility?: number | null
          thinking_style?: string | null
          time_pressure_response?: string | null
          timing_preferences?: Json | null
          unity_susceptibility?: number | null
          updated_at?: string
          user_id?: string
          validation_needs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_influence_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_influence_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_influence_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_interests: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          interest_type: string
          name: string
          notes: string | null
          profile_id: string
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          interest_type: string
          name: string
          notes?: string | null
          profile_id: string
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          interest_type?: string
          name?: string
          notes?: string | null
          profile_id?: string
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_life_milestones: {
        Row: {
          approximate_date: string | null
          created_at: string | null
          description: string | null
          emotional_valence: string | null
          event_date: string | null
          id: string
          impact_level: string | null
          milestone_type: string
          profile_id: string
          related_contacts: string[] | null
          source: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          verified: boolean | null
          your_involvement: string | null
        }
        Insert: {
          approximate_date?: string | null
          created_at?: string | null
          description?: string | null
          emotional_valence?: string | null
          event_date?: string | null
          id?: string
          impact_level?: string | null
          milestone_type: string
          profile_id: string
          related_contacts?: string[] | null
          source?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          your_involvement?: string | null
        }
        Update: {
          approximate_date?: string | null
          created_at?: string | null
          description?: string | null
          emotional_valence?: string | null
          event_date?: string | null
          id?: string
          impact_level?: string | null
          milestone_type?: string
          profile_id?: string
          related_contacts?: string[] | null
          source?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          your_involvement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_life_milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_life_milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_life_milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_locations: {
        Row: {
          address: string | null
          city: string | null
          confidence_score: number | null
          country: string | null
          country_code: string | null
          created_at: string
          first_seen_at: string | null
          id: string
          is_current: boolean | null
          last_seen_at: string | null
          latitude: number | null
          location_name: string | null
          location_type: string
          longitude: number | null
          metadata: Json | null
          profile_id: string
          region: string | null
          source: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          visit_count: number | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          confidence_score?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_seen_at?: string | null
          id?: string
          is_current?: boolean | null
          last_seen_at?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type: string
          longitude?: number | null
          metadata?: Json | null
          profile_id: string
          region?: string | null
          source?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          visit_count?: number | null
        }
        Update: {
          address?: string | null
          city?: string | null
          confidence_score?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_seen_at?: string | null
          id?: string
          is_current?: boolean | null
          last_seen_at?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type?: string
          longitude?: number | null
          metadata?: Json | null
          profile_id?: string
          region?: string | null
          source?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_locations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_locations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_locations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_methods: {
        Row: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          encryption_classification: string | null
          id: string
          is_encrypted: boolean | null
          is_primary: boolean | null
          label: string | null
          last_accessed_at: string | null
          profile_id: string
          value: string
          value_encrypted: string | null
        }
        Insert: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          encryption_classification?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_primary?: boolean | null
          label?: string | null
          last_accessed_at?: string | null
          profile_id: string
          value: string
          value_encrypted?: string | null
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          encryption_classification?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_primary?: boolean | null
          label?: string | null
          last_accessed_at?: string | null
          profile_id?: string
          value?: string
          value_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_observations: {
        Row: {
          ai_confidence_score: number | null
          ai_validation_result: Json | null
          ai_validation_status: string | null
          category: string
          confidence_level: string | null
          created_at: string
          id: string
          observation: string
          profile_id: string
          related_analysis_ids: string[] | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_validation_result?: Json | null
          ai_validation_status?: string | null
          category: string
          confidence_level?: string | null
          created_at?: string
          id?: string
          observation: string
          profile_id: string
          related_analysis_ids?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_validation_result?: Json | null
          ai_validation_status?: string | null
          category?: string
          confidence_level?: string | null
          created_at?: string
          id?: string
          observation?: string
          profile_id?: string
          related_analysis_ids?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_observations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_observations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_observations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_personal_info: {
        Row: {
          allergies: string[] | null
          blood_group: string | null
          chinese_zodiac: string | null
          clothing_size: string | null
          created_at: string
          date_of_birth: string | null
          dietary_preferences: string[] | null
          ethnicity: string | null
          eye_color: string | null
          father_name: string | null
          favorite_color: string | null
          gender: string | null
          hair_color: string | null
          handedness: string | null
          height_cm: number | null
          id: string
          main_residence_city: string | null
          main_residence_country: string | null
          marital_status: string | null
          mbti_type: string | null
          mother_name: string | null
          nationality: string | null
          place_of_birth: string | null
          political_affiliation: string | null
          profile_id: string
          religion: string | null
          rh_type: string | null
          shoe_size: string | null
          smoking_preference: string | null
          updated_at: string
          user_id: string
          usual_hangout_places: string[] | null
          weight_kg: number | null
          zodiac_sign: string | null
        }
        Insert: {
          allergies?: string[] | null
          blood_group?: string | null
          chinese_zodiac?: string | null
          clothing_size?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_preferences?: string[] | null
          ethnicity?: string | null
          eye_color?: string | null
          father_name?: string | null
          favorite_color?: string | null
          gender?: string | null
          hair_color?: string | null
          handedness?: string | null
          height_cm?: number | null
          id?: string
          main_residence_city?: string | null
          main_residence_country?: string | null
          marital_status?: string | null
          mbti_type?: string | null
          mother_name?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          political_affiliation?: string | null
          profile_id: string
          religion?: string | null
          rh_type?: string | null
          shoe_size?: string | null
          smoking_preference?: string | null
          updated_at?: string
          user_id: string
          usual_hangout_places?: string[] | null
          weight_kg?: number | null
          zodiac_sign?: string | null
        }
        Update: {
          allergies?: string[] | null
          blood_group?: string | null
          chinese_zodiac?: string | null
          clothing_size?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_preferences?: string[] | null
          ethnicity?: string | null
          eye_color?: string | null
          father_name?: string | null
          favorite_color?: string | null
          gender?: string | null
          hair_color?: string | null
          handedness?: string | null
          height_cm?: number | null
          id?: string
          main_residence_city?: string | null
          main_residence_country?: string | null
          marital_status?: string | null
          mbti_type?: string | null
          mother_name?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          political_affiliation?: string | null
          profile_id?: string
          religion?: string | null
          rh_type?: string | null
          shoe_size?: string | null
          smoking_preference?: string | null
          updated_at?: string
          user_id?: string
          usual_hangout_places?: string[] | null
          weight_kg?: number | null
          zodiac_sign?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_personal_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_personal_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_personal_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_relationships: {
        Row: {
          created_at: string
          end_date: string | null
          from_profile_id: string
          id: string
          inferred_from_ids: string[] | null
          inverse_label: string | null
          is_bidirectional: boolean | null
          is_inferred: boolean | null
          notes: string | null
          relationship_label: string
          relationship_type: string
          start_date: string | null
          to_profile_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          from_profile_id: string
          id?: string
          inferred_from_ids?: string[] | null
          inverse_label?: string | null
          is_bidirectional?: boolean | null
          is_inferred?: boolean | null
          notes?: string | null
          relationship_label: string
          relationship_type: string
          start_date?: string | null
          to_profile_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          from_profile_id?: string
          id?: string
          inferred_from_ids?: string[] | null
          inverse_label?: string | null
          is_bidirectional?: boolean | null
          is_inferred?: boolean | null
          notes?: string | null
          relationship_label?: string
          relationship_type?: string
          start_date?: string | null
          to_profile_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_relationships_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_relationships_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_relationships_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_relationships_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_relationships_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_relationships_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_twins: {
        Row: {
          behavioral_parameters: Json | null
          calibration_accuracy: number | null
          created_at: string
          divergence_alerts: Json | null
          generative_augmentations: Json | null
          id: string
          is_active: boolean | null
          last_calibration_at: string | null
          profile_id: string | null
          simulation_history: Json | null
          smga_state: Json | null
          twin_state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          behavioral_parameters?: Json | null
          calibration_accuracy?: number | null
          created_at?: string
          divergence_alerts?: Json | null
          generative_augmentations?: Json | null
          id?: string
          is_active?: boolean | null
          last_calibration_at?: string | null
          profile_id?: string | null
          simulation_history?: Json | null
          smga_state?: Json | null
          twin_state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          behavioral_parameters?: Json | null
          calibration_accuracy?: number | null
          created_at?: string
          divergence_alerts?: Json | null
          generative_augmentations?: Json | null
          id?: string
          is_active?: boolean | null
          last_calibration_at?: string | null
          profile_id?: string | null
          simulation_history?: Json | null
          smga_state?: Json | null
          twin_state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_twins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "digital_twins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "digital_twins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          ai_model_used: string | null
          classification: string | null
          created_at: string
          data_sources_used: Json | null
          dossier_type: string
          expires_at: string | null
          file_url: string | null
          generated_at: string
          generation_cost_cents: number | null
          id: string
          is_archived: boolean | null
          key_findings: Json | null
          profile_id: string | null
          recommendations: Json | null
          risk_assessment: Json | null
          sections: Json
          storage_path: string | null
          summary: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          classification?: string | null
          created_at?: string
          data_sources_used?: Json | null
          dossier_type: string
          expires_at?: string | null
          file_url?: string | null
          generated_at?: string
          generation_cost_cents?: number | null
          id?: string
          is_archived?: boolean | null
          key_findings?: Json | null
          profile_id?: string | null
          recommendations?: Json | null
          risk_assessment?: Json | null
          sections: Json
          storage_path?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          classification?: string | null
          created_at?: string
          data_sources_used?: Json | null
          dossier_type?: string
          expires_at?: string | null
          file_url?: string | null
          generated_at?: string
          generation_cost_cents?: number | null
          id?: string
          is_archived?: boolean | null
          key_findings?: Json | null
          profile_id?: string | null
          recommendations?: Json | null
          risk_assessment?: Json | null
          sections?: Json
          storage_path?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dossiers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dossiers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          activities: string | null
          created_at: string
          degree_type: string | null
          description: string | null
          end_date: string | null
          field_of_study: string | null
          grade_or_gpa: string | null
          id: string
          institution_name: string
          is_current: boolean | null
          linkedin_id: string | null
          profile_id: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activities?: string | null
          created_at?: string
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade_or_gpa?: string | null
          id?: string
          institution_name: string
          is_current?: boolean | null
          linkedin_id?: string | null
          profile_id: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activities?: string | null
          created_at?: string
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade_or_gpa?: string | null
          id?: string
          institution_name?: string
          is_current?: boolean | null
          linkedin_id?: string | null
          profile_id?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_blueprints: {
        Row: {
          anchor_experiences: Json | null
          aspirational_identity: Json | null
          created_at: string
          current_identity: Json | null
          id: string
          identity_conflicts: Json | null
          integration_opportunities: Json | null
          malleability_score: number | null
          profile_id: string | null
          rejected_identity: Json | null
          shadow_identity: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anchor_experiences?: Json | null
          aspirational_identity?: Json | null
          created_at?: string
          current_identity?: Json | null
          id?: string
          identity_conflicts?: Json | null
          integration_opportunities?: Json | null
          malleability_score?: number | null
          profile_id?: string | null
          rejected_identity?: Json | null
          shadow_identity?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anchor_experiences?: Json | null
          aspirational_identity?: Json | null
          created_at?: string
          current_identity?: Json | null
          id?: string
          identity_conflicts?: Json | null
          integration_opportunities?: Json | null
          malleability_score?: number | null
          profile_id?: string | null
          rejected_identity?: Json | null
          shadow_identity?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_blueprints_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "identity_blueprints_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "identity_blueprints_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personality_profiles: {
        Row: {
          agreeableness: Json | null
          conscientiousness: Json | null
          created_at: string
          exploitation_angles: Json | null
          extraction_sources: string[] | null
          extraversion: Json | null
          facet_scores: Json | null
          id: string
          influence_vulnerabilities: Json | null
          last_analyzed_at: string | null
          neuroticism: Json | null
          openness: Json | null
          profile_id: string
          sample_size: number | null
          stability_coefficient: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agreeableness?: Json | null
          conscientiousness?: Json | null
          created_at?: string
          exploitation_angles?: Json | null
          extraction_sources?: string[] | null
          extraversion?: Json | null
          facet_scores?: Json | null
          id?: string
          influence_vulnerabilities?: Json | null
          last_analyzed_at?: string | null
          neuroticism?: Json | null
          openness?: Json | null
          profile_id: string
          sample_size?: number | null
          stability_coefficient?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agreeableness?: Json | null
          conscientiousness?: Json | null
          created_at?: string
          exploitation_angles?: Json | null
          extraction_sources?: string[] | null
          extraversion?: Json | null
          facet_scores?: Json | null
          id?: string
          influence_vulnerabilities?: Json | null
          last_analyzed_at?: string | null
          neuroticism?: Json | null
          openness?: Json | null
          profile_id?: string
          sample_size?: number | null
          stability_coefficient?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personality_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "personality_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "personality_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activation_date: string | null
          avatar_url: string | null
          bio: string | null
          bio_encrypted: string | null
          country: string | null
          created_at: string
          data_richness_score: number | null
          encryption_classification: string | null
          engagement_score: number | null
          first_name: string
          hierarchy_level: string | null
          id: string
          initial_intel_completed: boolean | null
          instagram_followers: number | null
          instagram_handle: string | null
          is_active: boolean | null
          is_encrypted: boolean | null
          is_favorite: boolean | null
          is_self_profile: boolean | null
          job_title: string | null
          last_accessed_at: string | null
          last_contact_date: string | null
          last_enriched_at: string | null
          last_interaction_at: string | null
          last_name: string | null
          last_osint_scan: string | null
          last_social_capture_at: string | null
          linkedin_connections: number | null
          linkedin_handle: string | null
          linkedin_url: string | null
          linkedin_url_encrypted: string | null
          nickname: string | null
          notes: string | null
          notes_encrypted: string | null
          organization: string | null
          osint_scan_priority: number | null
          relationship_subtype: string | null
          relationship_type:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          social_platforms: Json | null
          tags: string[] | null
          tiktok_followers: number | null
          tiktok_handle: string | null
          twitter_followers: number | null
          twitter_handle: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          activation_date?: string | null
          avatar_url?: string | null
          bio?: string | null
          bio_encrypted?: string | null
          country?: string | null
          created_at?: string
          data_richness_score?: number | null
          encryption_classification?: string | null
          engagement_score?: number | null
          first_name: string
          hierarchy_level?: string | null
          id?: string
          initial_intel_completed?: boolean | null
          instagram_followers?: number | null
          instagram_handle?: string | null
          is_active?: boolean | null
          is_encrypted?: boolean | null
          is_favorite?: boolean | null
          is_self_profile?: boolean | null
          job_title?: string | null
          last_accessed_at?: string | null
          last_contact_date?: string | null
          last_enriched_at?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          last_osint_scan?: string | null
          last_social_capture_at?: string | null
          linkedin_connections?: number | null
          linkedin_handle?: string | null
          linkedin_url?: string | null
          linkedin_url_encrypted?: string | null
          nickname?: string | null
          notes?: string | null
          notes_encrypted?: string | null
          organization?: string | null
          osint_scan_priority?: number | null
          relationship_subtype?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          social_platforms?: Json | null
          tags?: string[] | null
          tiktok_followers?: number | null
          tiktok_handle?: string | null
          twitter_followers?: number | null
          twitter_handle?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          activation_date?: string | null
          avatar_url?: string | null
          bio?: string | null
          bio_encrypted?: string | null
          country?: string | null
          created_at?: string
          data_richness_score?: number | null
          encryption_classification?: string | null
          engagement_score?: number | null
          first_name?: string
          hierarchy_level?: string | null
          id?: string
          initial_intel_completed?: boolean | null
          instagram_followers?: number | null
          instagram_handle?: string | null
          is_active?: boolean | null
          is_encrypted?: boolean | null
          is_favorite?: boolean | null
          is_self_profile?: boolean | null
          job_title?: string | null
          last_accessed_at?: string | null
          last_contact_date?: string | null
          last_enriched_at?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          last_osint_scan?: string | null
          last_social_capture_at?: string | null
          linkedin_connections?: number | null
          linkedin_handle?: string | null
          linkedin_url?: string | null
          linkedin_url_encrypted?: string | null
          nickname?: string | null
          notes?: string | null
          notes_encrypted?: string | null
          organization?: string | null
          osint_scan_priority?: number | null
          relationship_subtype?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          social_platforms?: Json | null
          tags?: string[] | null
          tiktok_followers?: number | null
          tiktok_handle?: string | null
          twitter_followers?: number | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_access_logs: {
        Row: {
          access_context: string | null
          access_type: string
          accessed_at: string
          current_hash: string | null
          fields_accessed: string[] | null
          id: string
          ip_address: unknown
          previous_hash: string | null
          profile_id: string
          user_agent: string | null
          user_id: string
          was_decrypted: boolean | null
        }
        Insert: {
          access_context?: string | null
          access_type: string
          accessed_at?: string
          current_hash?: string | null
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          profile_id: string
          user_agent?: string | null
          user_id: string
          was_decrypted?: boolean | null
        }
        Update: {
          access_context?: string | null
          access_type?: string
          accessed_at?: string
          current_hash?: string | null
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          profile_id?: string
          user_agent?: string | null
          user_id?: string
          was_decrypted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_access_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profiles_access_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profiles_access_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_contacts: {
        Row: {
          id: string
          notes: string | null
          permission_level: string
          profile_id: string
          shared_at: string
          shared_by: string
          workspace_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          permission_level?: string
          profile_id: string
          shared_at?: string
          shared_by: string
          workspace_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          permission_level?: string
          profile_id?: string
          shared_at?: string
          shared_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shared_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shared_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      unknown_persons: {
        Row: {
          ai_model_used: string | null
          assigned_at: string | null
          assigned_profile_id: string | null
          best_match_confidence: number | null
          created_at: string
          cropped_image_url: string | null
          estimated_age_range: string | null
          estimated_gender: string | null
          face_region: Json | null
          facial_features: Json | null
          id: string
          media_id: string | null
          source_mosaic_id: string | null
          status: string
          suggested_profiles: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          assigned_at?: string | null
          assigned_profile_id?: string | null
          best_match_confidence?: number | null
          created_at?: string
          cropped_image_url?: string | null
          estimated_age_range?: string | null
          estimated_gender?: string | null
          face_region?: Json | null
          facial_features?: Json | null
          id?: string
          media_id?: string | null
          source_mosaic_id?: string | null
          status?: string
          suggested_profiles?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          assigned_at?: string | null
          assigned_profile_id?: string | null
          best_match_confidence?: number | null
          created_at?: string
          cropped_image_url?: string | null
          estimated_age_range?: string | null
          estimated_gender?: string | null
          face_region?: Json | null
          facial_features?: Json | null
          id?: string
          media_id?: string | null
          source_mosaic_id?: string | null
          status?: string
          suggested_profiles?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unknown_persons_assigned_profile_id_fkey"
            columns: ["assigned_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "unknown_persons_assigned_profile_id_fkey"
            columns: ["assigned_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "unknown_persons_assigned_profile_id_fkey"
            columns: ["assigned_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unknown_persons_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
}
