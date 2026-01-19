/**
 * Reality Dimensional Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Sub-module of advanced-operations
 */

import type { Json } from '../base';

/**
 * Tables: decision_entanglement, dimensional_influence, dimensional_operations, dimensional_sovereignty, interference_patterns, morphic_fields, morphic_patterns, quantum_states, reality_anchors, reality_comprehension, reality_creation, reality_frameworks, reality_injection_protocols, reality_manipulation, reality_synthesis, synchronistic_events
 */
export interface RealityDimensionalTables {
      decision_entanglement: {
        Row: {
          correlation_type: string | null
          created_at: string | null
          decoherence_rate: number | null
          entanglement_strength: number | null
          id: string
          last_synchronized_at: string | null
          profile_a_id: string | null
          profile_b_id: string | null
          spin_alignment: Json | null
          user_id: string
        }
        Insert: {
          correlation_type?: string | null
          created_at?: string | null
          decoherence_rate?: number | null
          entanglement_strength?: number | null
          id?: string
          last_synchronized_at?: string | null
          profile_a_id?: string | null
          profile_b_id?: string | null
          spin_alignment?: Json | null
          user_id: string
        }
        Update: {
          correlation_type?: string | null
          created_at?: string | null
          decoherence_rate?: number | null
          entanglement_strength?: number | null
          id?: string
          last_synchronized_at?: string | null
          profile_a_id?: string | null
          profile_b_id?: string | null
          spin_alignment?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_entanglement_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "decision_entanglement_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "decision_entanglement_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_entanglement_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "decision_entanglement_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "decision_entanglement_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dimensional_influence: {
        Row: {
          amplification_factor: number | null
          created_at: string
          cross_dimensional_effects: Json | null
          decay_rate: number | null
          id: string
          influence_type: string
          influence_vectors: Json | null
          measured_impact: Json | null
          propagation_model: Json | null
          target_dimensions: Json | null
          user_id: string
        }
        Insert: {
          amplification_factor?: number | null
          created_at?: string
          cross_dimensional_effects?: Json | null
          decay_rate?: number | null
          id?: string
          influence_type: string
          influence_vectors?: Json | null
          measured_impact?: Json | null
          propagation_model?: Json | null
          target_dimensions?: Json | null
          user_id: string
        }
        Update: {
          amplification_factor?: number | null
          created_at?: string
          cross_dimensional_effects?: Json | null
          decay_rate?: number | null
          id?: string
          influence_type?: string
          influence_vectors?: Json | null
          measured_impact?: Json | null
          propagation_model?: Json | null
          target_dimensions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      dimensional_operations: {
        Row: {
          created_at: string
          cross_dimensional_effects: Json | null
          current_coordinates: Json | null
          dimension_weights: Json | null
          dimensions: Json | null
          id: string
          is_active: boolean | null
          operation_name: string
          optimization_target: Json | null
          path_calculation: Json | null
          target_coordinates: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cross_dimensional_effects?: Json | null
          current_coordinates?: Json | null
          dimension_weights?: Json | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          operation_name: string
          optimization_target?: Json | null
          path_calculation?: Json | null
          target_coordinates?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cross_dimensional_effects?: Json | null
          current_coordinates?: Json | null
          dimension_weights?: Json | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          operation_name?: string
          optimization_target?: Json | null
          path_calculation?: Json | null
          target_coordinates?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dimensional_sovereignty: {
        Row: {
          boundary_definitions: Json | null
          control_vectors: Json | null
          created_at: string | null
          dimension_identifier: string
          expansion_potential: number | null
          id: string
          inter_dimensional_links: Json | null
          sovereignty_level: number | null
          sovereignty_status: string | null
          stability_metrics: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          boundary_definitions?: Json | null
          control_vectors?: Json | null
          created_at?: string | null
          dimension_identifier: string
          expansion_potential?: number | null
          id?: string
          inter_dimensional_links?: Json | null
          sovereignty_level?: number | null
          sovereignty_status?: string | null
          stability_metrics?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          boundary_definitions?: Json | null
          control_vectors?: Json | null
          created_at?: string | null
          dimension_identifier?: string
          expansion_potential?: number | null
          id?: string
          inter_dimensional_links?: Json | null
          sovereignty_level?: number | null
          sovereignty_status?: string | null
          stability_metrics?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      interference_patterns: {
        Row: {
          amplitude: number | null
          constructive_factors: Json | null
          created_at: string | null
          destructive_factors: Json | null
          id: string
          outcome_modification: number | null
          pattern_type: string
          phase_shift: number | null
          profile_id: string | null
          user_id: string
        }
        Insert: {
          amplitude?: number | null
          constructive_factors?: Json | null
          created_at?: string | null
          destructive_factors?: Json | null
          id?: string
          outcome_modification?: number | null
          pattern_type: string
          phase_shift?: number | null
          profile_id?: string | null
          user_id: string
        }
        Update: {
          amplitude?: number | null
          constructive_factors?: Json | null
          created_at?: string | null
          destructive_factors?: Json | null
          id?: string
          outcome_modification?: number | null
          pattern_type?: string
          phase_shift?: number | null
          profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interference_patterns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "interference_patterns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "interference_patterns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      morphic_fields: {
        Row: {
          carrier_profiles: string[] | null
          created_at: string | null
          field_signature: string
          field_type: string | null
          formation_date: string | null
          id: string
          memory_patterns: Json | null
          propagation_paths: Json | null
          resonance_strength: number | null
          stability_index: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          carrier_profiles?: string[] | null
          created_at?: string | null
          field_signature: string
          field_type?: string | null
          formation_date?: string | null
          id?: string
          memory_patterns?: Json | null
          propagation_paths?: Json | null
          resonance_strength?: number | null
          stability_index?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          carrier_profiles?: string[] | null
          created_at?: string | null
          field_signature?: string
          field_type?: string | null
          formation_date?: string | null
          id?: string
          memory_patterns?: Json | null
          propagation_paths?: Json | null
          resonance_strength?: number | null
          stability_index?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      morphic_patterns: {
        Row: {
          affected_profiles: Json | null
          amplification_opportunities: Json | null
          decay_rate: number | null
          disruption_methods: Json | null
          first_detected_at: string
          id: string
          last_observed_at: string
          originating_profiles: Json | null
          pattern_name: string
          pattern_type: string
          propagation_mechanism: Json | null
          resonance_strength: number | null
          user_id: string
        }
        Insert: {
          affected_profiles?: Json | null
          amplification_opportunities?: Json | null
          decay_rate?: number | null
          disruption_methods?: Json | null
          first_detected_at?: string
          id?: string
          last_observed_at?: string
          originating_profiles?: Json | null
          pattern_name: string
          pattern_type: string
          propagation_mechanism?: Json | null
          resonance_strength?: number | null
          user_id: string
        }
        Update: {
          affected_profiles?: Json | null
          amplification_opportunities?: Json | null
          decay_rate?: number | null
          disruption_methods?: Json | null
          first_detected_at?: string
          id?: string
          last_observed_at?: string
          originating_profiles?: Json | null
          pattern_name?: string
          pattern_type?: string
          propagation_mechanism?: Json | null
          resonance_strength?: number | null
          user_id?: string
        }
        Relationships: []
      }
      quantum_states: {
        Row: {
          coherence_duration: unknown
          collapsed_at: string | null
          collapsed_state: Json | null
          created_at: string
          decoherence_factors: Json | null
          entangled_profiles: Json | null
          id: string
          measurement_strategy: Json | null
          observation_effects: Json | null
          probability_amplitudes: Json | null
          profile_id: string | null
          superposition_states: Json | null
          user_id: string
        }
        Insert: {
          coherence_duration?: unknown
          collapsed_at?: string | null
          collapsed_state?: Json | null
          created_at?: string
          decoherence_factors?: Json | null
          entangled_profiles?: Json | null
          id?: string
          measurement_strategy?: Json | null
          observation_effects?: Json | null
          probability_amplitudes?: Json | null
          profile_id?: string | null
          superposition_states?: Json | null
          user_id: string
        }
        Update: {
          coherence_duration?: unknown
          collapsed_at?: string | null
          collapsed_state?: Json | null
          created_at?: string
          decoherence_factors?: Json | null
          entangled_profiles?: Json | null
          id?: string
          measurement_strategy?: Json | null
          observation_effects?: Json | null
          probability_amplitudes?: Json | null
          profile_id?: string | null
          superposition_states?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantum_states_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "quantum_states_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "quantum_states_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_anchors: {
        Row: {
          anchor_belief: string
          anchor_strength: number | null
          attack_vectors: Json | null
          consensus_bubble_id: string | null
          created_at: string | null
          dependent_beliefs: Json | null
          id: string
          removal_difficulty: number | null
          user_id: string
        }
        Insert: {
          anchor_belief: string
          anchor_strength?: number | null
          attack_vectors?: Json | null
          consensus_bubble_id?: string | null
          created_at?: string | null
          dependent_beliefs?: Json | null
          id?: string
          removal_difficulty?: number | null
          user_id: string
        }
        Update: {
          anchor_belief?: string
          anchor_strength?: number | null
          attack_vectors?: Json | null
          consensus_bubble_id?: string | null
          created_at?: string | null
          dependent_beliefs?: Json | null
          id?: string
          removal_difficulty?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reality_anchors_consensus_bubble_id_fkey"
            columns: ["consensus_bubble_id"]
            isOneToOne: false
            referencedRelation: "consensus_bubbles"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_comprehension: {
        Row: {
          comprehension_index: number | null
          comprehension_scope: string
          created_at: string
          framework_model: Json | null
          id: string
          paradox_resolution: Json | null
          profile_id: string | null
          reality_layers: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comprehension_index?: number | null
          comprehension_scope: string
          created_at?: string
          framework_model?: Json | null
          id?: string
          paradox_resolution?: Json | null
          profile_id?: string | null
          reality_layers?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comprehension_index?: number | null
          comprehension_scope?: string
          created_at?: string
          framework_model?: Json | null
          id?: string
          paradox_resolution?: Json | null
          profile_id?: string | null
          reality_layers?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reality_comprehension_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_comprehension_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_comprehension_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_creation: {
        Row: {
          created_at: string
          creation_status: string | null
          creation_type: string
          id: string
          manifestation_power: number | null
          materialization_progress: number | null
          profile_id: string | null
          reality_blueprint: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creation_status?: string | null
          creation_type: string
          id?: string
          manifestation_power?: number | null
          materialization_progress?: number | null
          profile_id?: string | null
          reality_blueprint?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creation_status?: string | null
          creation_type?: string
          id?: string
          manifestation_power?: number | null
          materialization_progress?: number | null
          profile_id?: string | null
          reality_blueprint?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reality_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_frameworks: {
        Row: {
          anchor_points: Json | null
          breakthrough_triggers: Json | null
          cognitive_load_score: number | null
          created_at: string
          current_reality_map: Json | null
          framework_name: string
          framework_type: string
          id: string
          is_active: boolean | null
          profile_id: string | null
          progress_percentage: number | null
          resistance_patterns: Json | null
          target_reality_map: Json | null
          transition_strategy: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anchor_points?: Json | null
          breakthrough_triggers?: Json | null
          cognitive_load_score?: number | null
          created_at?: string
          current_reality_map?: Json | null
          framework_name: string
          framework_type?: string
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          progress_percentage?: number | null
          resistance_patterns?: Json | null
          target_reality_map?: Json | null
          transition_strategy?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anchor_points?: Json | null
          breakthrough_triggers?: Json | null
          cognitive_load_score?: number | null
          created_at?: string
          current_reality_map?: Json | null
          framework_name?: string
          framework_type?: string
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          progress_percentage?: number | null
          resistance_patterns?: Json | null
          target_reality_map?: Json | null
          transition_strategy?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reality_frameworks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_frameworks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_frameworks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_injection_protocols: {
        Row: {
          cognitive_dissonance_risk: number | null
          created_at: string | null
          executed_at: string | null
          execution_steps: Json | null
          id: string
          injection_belief: string
          injection_method: string | null
          status: string | null
          success_probability: number | null
          target_bubble_id: string | null
          trojan_wrapper: string | null
          user_id: string
        }
        Insert: {
          cognitive_dissonance_risk?: number | null
          created_at?: string | null
          executed_at?: string | null
          execution_steps?: Json | null
          id?: string
          injection_belief: string
          injection_method?: string | null
          status?: string | null
          success_probability?: number | null
          target_bubble_id?: string | null
          trojan_wrapper?: string | null
          user_id: string
        }
        Update: {
          cognitive_dissonance_risk?: number | null
          created_at?: string | null
          executed_at?: string | null
          execution_steps?: Json | null
          id?: string
          injection_belief?: string
          injection_method?: string | null
          status?: string | null
          success_probability?: number | null
          target_bubble_id?: string | null
          trojan_wrapper?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reality_injection_protocols_target_bubble_id_fkey"
            columns: ["target_bubble_id"]
            isOneToOne: false
            referencedRelation: "consensus_bubbles"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_manipulation: {
        Row: {
          belief_architecture: Json | null
          consensus_engineering: Json | null
          created_at: string
          effectiveness_score: number | null
          id: string
          manipulation_type: string
          narrative_control: Json | null
          perception_vectors: Json | null
          profile_id: string | null
          stability_rating: number | null
          target_reality: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          belief_architecture?: Json | null
          consensus_engineering?: Json | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          manipulation_type: string
          narrative_control?: Json | null
          perception_vectors?: Json | null
          profile_id?: string | null
          stability_rating?: number | null
          target_reality?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          belief_architecture?: Json | null
          consensus_engineering?: Json | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          manipulation_type?: string
          narrative_control?: Json | null
          perception_vectors?: Json | null
          profile_id?: string | null
          stability_rating?: number | null
          target_reality?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reality_manipulation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_manipulation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_manipulation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_synthesis: {
        Row: {
          causal_depth: number | null
          confidence_score: number | null
          created_at: string
          id: string
          input_sources: Json | null
          reality_model: Json | null
          spatial_accuracy: number | null
          synthesis_timestamp: string | null
          synthesis_type: string
          temporal_accuracy: number | null
          updated_at: string
          user_id: string
          validity_window: Json | null
        }
        Insert: {
          causal_depth?: number | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_sources?: Json | null
          reality_model?: Json | null
          spatial_accuracy?: number | null
          synthesis_timestamp?: string | null
          synthesis_type: string
          temporal_accuracy?: number | null
          updated_at?: string
          user_id: string
          validity_window?: Json | null
        }
        Update: {
          causal_depth?: number | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_sources?: Json | null
          reality_model?: Json | null
          spatial_accuracy?: number | null
          synthesis_timestamp?: string | null
          synthesis_type?: string
          temporal_accuracy?: number | null
          updated_at?: string
          user_id?: string
          validity_window?: Json | null
        }
        Relationships: []
      }
      synchronistic_events: {
        Row: {
          acausal_correlation: number | null
          created_at: string | null
          event_cluster_id: string | null
          event_description: string
          exploitation_potential: number | null
          id: string
          meaning_score: number | null
          optimal_intervention_time: string | null
          profile_id: string | null
          related_events: string[] | null
          timing_window: Json | null
          user_id: string
        }
        Insert: {
          acausal_correlation?: number | null
          created_at?: string | null
          event_cluster_id?: string | null
          event_description: string
          exploitation_potential?: number | null
          id?: string
          meaning_score?: number | null
          optimal_intervention_time?: string | null
          profile_id?: string | null
          related_events?: string[] | null
          timing_window?: Json | null
          user_id: string
        }
        Update: {
          acausal_correlation?: number | null
          created_at?: string | null
          event_cluster_id?: string | null
          event_description?: string
          exploitation_potential?: number | null
          id?: string
          meaning_score?: number | null
          optimal_intervention_time?: string | null
          profile_id?: string | null
          related_events?: string[] | null
          timing_window?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synchronistic_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "synchronistic_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "synchronistic_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
}
