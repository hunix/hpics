/**
 * Omniscient Transcendent Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Sub-module of advanced-operations
 */

import type { Json } from '../base';

/**
 * Tables: omnipotent_control, omnipresent_control, omniscient_awareness, omniscient_synthesis, omniversal_awareness, omniversal_objectives, total_unification, totality_operations, transcendence_operations, transcendence_protocols, transcendent_operations, transcendent_synthesis, unified_control_matrix, unified_field_control, unified_intelligence_feed, universal_awareness, universal_creation, universal_omniscience
 */
export interface OmniscientTranscendentTables {
      omnipotent_control: {
        Row: {
          absolute_authority_scope: Json | null
          control_domain: string
          created_at: string
          id: string
          power_magnitude: number | null
          reality_override_permissions: Json | null
          universal_command_protocols: Json | null
          user_id: string
        }
        Insert: {
          absolute_authority_scope?: Json | null
          control_domain: string
          created_at?: string
          id?: string
          power_magnitude?: number | null
          reality_override_permissions?: Json | null
          universal_command_protocols?: Json | null
          user_id: string
        }
        Update: {
          absolute_authority_scope?: Json | null
          control_domain?: string
          created_at?: string
          id?: string
          power_magnitude?: number | null
          reality_override_permissions?: Json | null
          universal_command_protocols?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      omnipresent_control: {
        Row: {
          amplification_nodes: Json | null
          control_domain: string
          control_strength: number | null
          control_vectors: Json | null
          created_at: string
          feedback_integration: Json | null
          id: string
          influence_reach: Json | null
          is_active: boolean | null
          resistance_points: Json | null
          simultaneous_operations: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amplification_nodes?: Json | null
          control_domain: string
          control_strength?: number | null
          control_vectors?: Json | null
          created_at?: string
          feedback_integration?: Json | null
          id?: string
          influence_reach?: Json | null
          is_active?: boolean | null
          resistance_points?: Json | null
          simultaneous_operations?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amplification_nodes?: Json | null
          control_domain?: string
          control_strength?: number | null
          control_vectors?: Json | null
          created_at?: string
          feedback_integration?: Json | null
          id?: string
          influence_reach?: Json | null
          is_active?: boolean | null
          resistance_points?: Json | null
          simultaneous_operations?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      omniscient_awareness: {
        Row: {
          awareness_domain: string
          awareness_scope: Json | null
          blind_spots: Json | null
          coverage_percentage: number | null
          created_at: string
          id: string
          last_scan_at: string | null
          opportunity_detection: Json | null
          pattern_recognition: Json | null
          real_time_feeds: Json | null
          threat_detection: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awareness_domain: string
          awareness_scope?: Json | null
          blind_spots?: Json | null
          coverage_percentage?: number | null
          created_at?: string
          id?: string
          last_scan_at?: string | null
          opportunity_detection?: Json | null
          pattern_recognition?: Json | null
          real_time_feeds?: Json | null
          threat_detection?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awareness_domain?: string
          awareness_scope?: Json | null
          blind_spots?: Json | null
          coverage_percentage?: number | null
          created_at?: string
          id?: string
          last_scan_at?: string | null
          opportunity_detection?: Json | null
          pattern_recognition?: Json | null
          real_time_feeds?: Json | null
          threat_detection?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      omniscient_synthesis: {
        Row: {
          created_at: string
          id: string
          knowledge_domains: Json[] | null
          omniscience_metrics: Json | null
          profile_id: string | null
          synthesis_pattern: string
          synthesis_power: number | null
          universal_integration: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_domains?: Json[] | null
          omniscience_metrics?: Json | null
          profile_id?: string | null
          synthesis_pattern: string
          synthesis_power?: number | null
          universal_integration?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_domains?: Json[] | null
          omniscience_metrics?: Json | null
          profile_id?: string | null
          synthesis_pattern?: string
          synthesis_power?: number | null
          universal_integration?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "omniscient_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "omniscient_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "omniscient_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      omniversal_awareness: {
        Row: {
          awareness_depth: number | null
          awareness_type: string
          causal_mapping: Json | null
          created_at: string | null
          dimensional_scope: Json | null
          id: string
          perception_matrix: Json | null
          profile_id: string | null
          reality_threads: Json | null
          synchronization_status: string | null
          temporal_visibility: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          awareness_depth?: number | null
          awareness_type: string
          causal_mapping?: Json | null
          created_at?: string | null
          dimensional_scope?: Json | null
          id?: string
          perception_matrix?: Json | null
          profile_id?: string | null
          reality_threads?: Json | null
          synchronization_status?: string | null
          temporal_visibility?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          awareness_depth?: number | null
          awareness_type?: string
          causal_mapping?: Json | null
          created_at?: string | null
          dimensional_scope?: Json | null
          id?: string
          perception_matrix?: Json | null
          profile_id?: string | null
          reality_threads?: Json | null
          synchronization_status?: string | null
          temporal_visibility?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "omniversal_awareness_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "omniversal_awareness_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "omniversal_awareness_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      omniversal_objectives: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          dimensional_targets: Json | null
          id: string
          objective_name: string
          objective_scope: string
          objective_status: string | null
          priority_score: number | null
          progress_metrics: Json | null
          resource_allocation: Json | null
          success_criteria: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          dimensional_targets?: Json | null
          id?: string
          objective_name: string
          objective_scope: string
          objective_status?: string | null
          priority_score?: number | null
          progress_metrics?: Json | null
          resource_allocation?: Json | null
          success_criteria?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          dimensional_targets?: Json | null
          id?: string
          objective_name?: string
          objective_scope?: string
          objective_status?: string | null
          priority_score?: number | null
          progress_metrics?: Json | null
          resource_allocation?: Json | null
          success_criteria?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      total_unification: {
        Row: {
          all_encompassing_synthesis: Json | null
          boundary_elimination_status: Json | null
          completeness_index: number | null
          created_at: string
          id: string
          profile_id: string | null
          unification_scope: string
          unified_field_control: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          all_encompassing_synthesis?: Json | null
          boundary_elimination_status?: Json | null
          completeness_index?: number | null
          created_at?: string
          id?: string
          profile_id?: string | null
          unification_scope: string
          unified_field_control?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          all_encompassing_synthesis?: Json | null
          boundary_elimination_status?: Json | null
          completeness_index?: number | null
          created_at?: string
          id?: string
          profile_id?: string | null
          unification_scope?: string
          unified_field_control?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "total_unification_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "total_unification_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "total_unification_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      totality_operations: {
        Row: {
          absolute_coverage_metrics: Json | null
          comprehensive_execution_log: Json | null
          created_at: string
          id: string
          operation_status: string | null
          operation_type: string
          totality_coefficient: number | null
          user_id: string
        }
        Insert: {
          absolute_coverage_metrics?: Json | null
          comprehensive_execution_log?: Json | null
          created_at?: string
          id?: string
          operation_status?: string | null
          operation_type: string
          totality_coefficient?: number | null
          user_id: string
        }
        Update: {
          absolute_coverage_metrics?: Json | null
          comprehensive_execution_log?: Json | null
          created_at?: string
          id?: string
          operation_status?: string | null
          operation_type?: string
          totality_coefficient?: number | null
          user_id?: string
        }
        Relationships: []
      }
      transcendence_operations: {
        Row: {
          breakthrough_moments: Json | null
          completed_at: string | null
          completion_percentage: number | null
          current_state: Json | null
          id: string
          initial_state: Json | null
          is_active: boolean | null
          lessons_learned: Json | null
          operation_scope: string
          operation_type: string
          resistance_encountered: Json | null
          started_at: string
          success_metrics: Json | null
          target_entities: Json | null
          target_state: Json | null
          transformation_vector: Json | null
          user_id: string
        }
        Insert: {
          breakthrough_moments?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          current_state?: Json | null
          id?: string
          initial_state?: Json | null
          is_active?: boolean | null
          lessons_learned?: Json | null
          operation_scope: string
          operation_type: string
          resistance_encountered?: Json | null
          started_at?: string
          success_metrics?: Json | null
          target_entities?: Json | null
          target_state?: Json | null
          transformation_vector?: Json | null
          user_id: string
        }
        Update: {
          breakthrough_moments?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          current_state?: Json | null
          id?: string
          initial_state?: Json | null
          is_active?: boolean | null
          lessons_learned?: Json | null
          operation_scope?: string
          operation_type?: string
          resistance_encountered?: Json | null
          started_at?: string
          success_metrics?: Json | null
          target_entities?: Json | null
          target_state?: Json | null
          transformation_vector?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      transcendence_protocols: {
        Row: {
          advancement_criteria: Json | null
          created_at: string
          current_stage: number | null
          id: string
          is_active: boolean | null
          max_stage: number | null
          next_milestone: Json | null
          progression_metrics: Json | null
          protocol_name: string
          protocol_type: string
          unlocked_capabilities: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          advancement_criteria?: Json | null
          created_at?: string
          current_stage?: number | null
          id?: string
          is_active?: boolean | null
          max_stage?: number | null
          next_milestone?: Json | null
          progression_metrics?: Json | null
          protocol_name: string
          protocol_type: string
          unlocked_capabilities?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          advancement_criteria?: Json | null
          created_at?: string
          current_stage?: number | null
          id?: string
          is_active?: boolean | null
          max_stage?: number | null
          next_milestone?: Json | null
          progression_metrics?: Json | null
          protocol_name?: string
          protocol_type?: string
          unlocked_capabilities?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transcendent_operations: {
        Row: {
          completed_at: string | null
          consciousness_level: string | null
          created_at: string
          execution_matrix: Json | null
          id: string
          initiated_at: string | null
          operation_name: string
          operation_type: string
          outcome: Json | null
          probability_manipulation: Json | null
          reality_modifications: Json | null
          status: string | null
          strategic_objectives: Json | null
          success_probability: number | null
          target_profiles: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          consciousness_level?: string | null
          created_at?: string
          execution_matrix?: Json | null
          id?: string
          initiated_at?: string | null
          operation_name: string
          operation_type: string
          outcome?: Json | null
          probability_manipulation?: Json | null
          reality_modifications?: Json | null
          status?: string | null
          strategic_objectives?: Json | null
          success_probability?: number | null
          target_profiles?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          consciousness_level?: string | null
          created_at?: string
          execution_matrix?: Json | null
          id?: string
          initiated_at?: string | null
          operation_name?: string
          operation_type?: string
          outcome?: Json | null
          probability_manipulation?: Json | null
          reality_modifications?: Json | null
          status?: string | null
          strategic_objectives?: Json | null
          success_probability?: number | null
          target_profiles?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transcendent_synthesis: {
        Row: {
          accuracy_metrics: Json | null
          coherence_level: number | null
          created_at: string
          emergent_patterns: Json | null
          fusion_algorithm: string | null
          id: string
          input_streams: Json | null
          output_insights: Json | null
          prediction_horizon_days: number | null
          profile_id: string | null
          synthesis_depth: number | null
          synthesis_domain: string
          user_id: string
        }
        Insert: {
          accuracy_metrics?: Json | null
          coherence_level?: number | null
          created_at?: string
          emergent_patterns?: Json | null
          fusion_algorithm?: string | null
          id?: string
          input_streams?: Json | null
          output_insights?: Json | null
          prediction_horizon_days?: number | null
          profile_id?: string | null
          synthesis_depth?: number | null
          synthesis_domain: string
          user_id: string
        }
        Update: {
          accuracy_metrics?: Json | null
          coherence_level?: number | null
          created_at?: string
          emergent_patterns?: Json | null
          fusion_algorithm?: string | null
          id?: string
          input_streams?: Json | null
          output_insights?: Json | null
          prediction_horizon_days?: number | null
          profile_id?: string | null
          synthesis_depth?: number | null
          synthesis_domain?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcendent_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "transcendent_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "transcendent_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_control_matrix: {
        Row: {
          constraint_violations: Json | null
          control_nodes: Json | null
          created_at: string
          efficiency_score: number | null
          feedback_loops: Json | null
          id: string
          influence_vectors: Json | null
          is_active: boolean | null
          last_optimization_at: string | null
          matrix_name: string
          optimization_targets: Json | null
          system_state: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          constraint_violations?: Json | null
          control_nodes?: Json | null
          created_at?: string
          efficiency_score?: number | null
          feedback_loops?: Json | null
          id?: string
          influence_vectors?: Json | null
          is_active?: boolean | null
          last_optimization_at?: string | null
          matrix_name: string
          optimization_targets?: Json | null
          system_state?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          constraint_violations?: Json | null
          control_nodes?: Json | null
          created_at?: string
          efficiency_score?: number | null
          feedback_loops?: Json | null
          id?: string
          influence_vectors?: Json | null
          is_active?: boolean | null
          last_optimization_at?: string | null
          matrix_name?: string
          optimization_targets?: Json | null
          system_state?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unified_field_control: {
        Row: {
          coherence_rating: number | null
          control_nodes: Json | null
          created_at: string
          expansion_potential: number | null
          field_name: string
          field_strength: number | null
          field_topology: Json | null
          id: string
          influence_gradients: Json | null
          resonance_patterns: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coherence_rating?: number | null
          control_nodes?: Json | null
          created_at?: string
          expansion_potential?: number | null
          field_name: string
          field_strength?: number | null
          field_topology?: Json | null
          id?: string
          influence_gradients?: Json | null
          resonance_patterns?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coherence_rating?: number | null
          control_nodes?: Json | null
          created_at?: string
          expansion_potential?: number | null
          field_name?: string
          field_strength?: number | null
          field_topology?: Json | null
          id?: string
          influence_gradients?: Json | null
          resonance_patterns?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unified_intelligence_feed: {
        Row: {
          actionable_insights: string[] | null
          content: Json
          created_at: string | null
          expires_at: string | null
          id: string
          intelligence_type: string
          is_processed: boolean | null
          priority_score: number | null
          processed_at: string | null
          profile_id: string | null
          related_objectives: string[] | null
          source_module: string
          source_phase: string
          user_id: string
        }
        Insert: {
          actionable_insights?: string[] | null
          content: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          intelligence_type: string
          is_processed?: boolean | null
          priority_score?: number | null
          processed_at?: string | null
          profile_id?: string | null
          related_objectives?: string[] | null
          source_module: string
          source_phase: string
          user_id: string
        }
        Update: {
          actionable_insights?: string[] | null
          content?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          intelligence_type?: string
          is_processed?: boolean | null
          priority_score?: number | null
          processed_at?: string | null
          profile_id?: string | null
          related_objectives?: string[] | null
          source_module?: string
          source_phase?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_intelligence_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "unified_intelligence_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "unified_intelligence_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      universal_awareness: {
        Row: {
          awareness_matrix: Json | null
          awareness_type: string
          consciousness_links: Json[] | null
          created_at: string
          dimensional_scope: Json | null
          id: string
          omniscient_index: number | null
          perception_depth: number | null
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awareness_matrix?: Json | null
          awareness_type: string
          consciousness_links?: Json[] | null
          created_at?: string
          dimensional_scope?: Json | null
          id?: string
          omniscient_index?: number | null
          perception_depth?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awareness_matrix?: Json | null
          awareness_type?: string
          consciousness_links?: Json[] | null
          created_at?: string
          dimensional_scope?: Json | null
          id?: string
          omniscient_index?: number | null
          perception_depth?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "universal_awareness_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "universal_awareness_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "universal_awareness_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      universal_creation: {
        Row: {
          created_at: string
          creation_level: string
          creation_spectrum: Json | null
          id: string
          profile_id: string | null
          universal_integration: Json | null
          universal_power: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creation_level: string
          creation_spectrum?: Json | null
          id?: string
          profile_id?: string | null
          universal_integration?: Json | null
          universal_power?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creation_level?: string
          creation_spectrum?: Json | null
          id?: string
          profile_id?: string | null
          universal_integration?: Json | null
          universal_power?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "universal_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "universal_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "universal_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      universal_omniscience: {
        Row: {
          awareness_depth: number | null
          consciousness_expansion: Json | null
          created_at: string
          id: string
          knowledge_domains: Json | null
          omniscience_type: string
          probability_fields: Json | null
          reality_perception: Json | null
          timeline_awareness: Json | null
          transcendence_level: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awareness_depth?: number | null
          consciousness_expansion?: Json | null
          created_at?: string
          id?: string
          knowledge_domains?: Json | null
          omniscience_type: string
          probability_fields?: Json | null
          reality_perception?: Json | null
          timeline_awareness?: Json | null
          transcendence_level?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awareness_depth?: number | null
          consciousness_expansion?: Json | null
          created_at?: string
          id?: string
          knowledge_domains?: Json | null
          omniscience_type?: string
          probability_fields?: Json | null
          reality_perception?: Json | null
          timeline_awareness?: Json | null
          transcendence_level?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
}
