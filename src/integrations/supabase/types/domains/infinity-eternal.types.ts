/**
 * Infinity Eternal Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Sub-module of advanced-operations
 */

import type { Json } from '../base';

/**
 * Tables: eternal_dominion, eternal_influence, eternity_metrics, eternity_protocols, existence_mastery, existence_origination, immortal_influence, infinite_awareness, infinite_perception, infinite_protocols, infinite_recursion, infinite_synthesis, infinity_metrics, infinity_protocols, meta_existence, self_perpetuation, timeless_dominance
 */
export interface InfinityEternalTables {
      eternal_dominion: {
        Row: {
          causality_control: Json | null
          created_at: string
          dominion_metrics: Json | null
          dominion_scope: Json | null
          dominion_type: string
          entropy_reversal: Json | null
          existence_binding: Json | null
          id: string
          permanence_level: number | null
          temporal_lock: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          causality_control?: Json | null
          created_at?: string
          dominion_metrics?: Json | null
          dominion_scope?: Json | null
          dominion_type: string
          entropy_reversal?: Json | null
          existence_binding?: Json | null
          id?: string
          permanence_level?: number | null
          temporal_lock?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          causality_control?: Json | null
          created_at?: string
          dominion_metrics?: Json | null
          dominion_scope?: Json | null
          dominion_type?: string
          entropy_reversal?: Json | null
          existence_binding?: Json | null
          id?: string
          permanence_level?: number | null
          temporal_lock?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      eternal_influence: {
        Row: {
          causal_anchors: Json | null
          created_at: string | null
          decay_resistance: number | null
          id: string
          influence_propagation: Json | null
          influence_status: string | null
          influence_type: string
          permanence_score: number | null
          profile_id: string | null
          self_reinforcement_loops: Json | null
          temporal_persistence: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          causal_anchors?: Json | null
          created_at?: string | null
          decay_resistance?: number | null
          id?: string
          influence_propagation?: Json | null
          influence_status?: string | null
          influence_type: string
          permanence_score?: number | null
          profile_id?: string | null
          self_reinforcement_loops?: Json | null
          temporal_persistence?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          causal_anchors?: Json | null
          created_at?: string | null
          decay_resistance?: number | null
          id?: string
          influence_propagation?: Json | null
          influence_status?: string | null
          influence_type?: string
          permanence_score?: number | null
          profile_id?: string | null
          self_reinforcement_loops?: Json | null
          temporal_persistence?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eternal_influence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "eternal_influence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "eternal_influence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eternity_metrics: {
        Row: {
          created_at: string
          eternity_quotient: number | null
          id: string
          measurement_epoch: string | null
          metric_type: string
          metric_value: Json | null
          permanence_score: number | null
          temporal_stability: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          eternity_quotient?: number | null
          id?: string
          measurement_epoch?: string | null
          metric_type: string
          metric_value?: Json | null
          permanence_score?: number | null
          temporal_stability?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          eternity_quotient?: number | null
          id?: string
          measurement_epoch?: string | null
          metric_type?: string
          metric_value?: Json | null
          permanence_score?: number | null
          temporal_stability?: number | null
          user_id?: string
        }
        Relationships: []
      }
      eternity_protocols: {
        Row: {
          created_at: string
          execution_parameters: Json | null
          id: string
          last_executed_at: string | null
          permanence_requirements: Json | null
          protocol_name: string
          protocol_status: string | null
          protocol_type: string
          success_criteria: Json | null
          temporal_scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          execution_parameters?: Json | null
          id?: string
          last_executed_at?: string | null
          permanence_requirements?: Json | null
          protocol_name: string
          protocol_status?: string | null
          protocol_type: string
          success_criteria?: Json | null
          temporal_scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          execution_parameters?: Json | null
          id?: string
          last_executed_at?: string | null
          permanence_requirements?: Json | null
          protocol_name?: string
          protocol_status?: string | null
          protocol_type?: string
          success_criteria?: Json | null
          temporal_scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      existence_mastery: {
        Row: {
          being_manipulation: Json | null
          created_at: string
          creation_power: number | null
          existence_engineering: Json | null
          id: string
          mastery_domain: string
          mastery_level: number | null
          ontological_control: Json | null
          reality_authorship: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          being_manipulation?: Json | null
          created_at?: string
          creation_power?: number | null
          existence_engineering?: Json | null
          id?: string
          mastery_domain: string
          mastery_level?: number | null
          ontological_control?: Json | null
          reality_authorship?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          being_manipulation?: Json | null
          created_at?: string
          creation_power?: number | null
          existence_engineering?: Json | null
          id?: string
          mastery_domain?: string
          mastery_level?: number | null
          ontological_control?: Json | null
          reality_authorship?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      existence_origination: {
        Row: {
          created_at: string
          existence_anchors: Json[] | null
          existence_coefficient: number | null
          id: string
          origination_framework: Json | null
          origination_scope: string
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          existence_anchors?: Json[] | null
          existence_coefficient?: number | null
          id?: string
          origination_framework?: Json | null
          origination_scope: string
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          existence_anchors?: Json[] | null
          existence_coefficient?: number | null
          id?: string
          origination_framework?: Json | null
          origination_scope?: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "existence_origination_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "existence_origination_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "existence_origination_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      immortal_influence: {
        Row: {
          created_at: string
          deathless_control_protocols: Json | null
          eternal_impact_vectors: Json | null
          id: string
          influence_type: string
          legacy_propagation_rules: Json | null
          permanence_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deathless_control_protocols?: Json | null
          eternal_impact_vectors?: Json | null
          id?: string
          influence_type: string
          legacy_propagation_rules?: Json | null
          permanence_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          deathless_control_protocols?: Json | null
          eternal_impact_vectors?: Json | null
          id?: string
          influence_type?: string
          legacy_propagation_rules?: Json | null
          permanence_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      infinite_awareness: {
        Row: {
          awareness_score: number | null
          awareness_type: string
          blind_spot_elimination: Json | null
          created_at: string
          dimensional_coverage: Json | null
          id: string
          last_expansion_at: string | null
          penetration_depth: number | null
          perception_range: Json | null
          signal_sources: Json | null
          temporal_range: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awareness_score?: number | null
          awareness_type: string
          blind_spot_elimination?: Json | null
          created_at?: string
          dimensional_coverage?: Json | null
          id?: string
          last_expansion_at?: string | null
          penetration_depth?: number | null
          perception_range?: Json | null
          signal_sources?: Json | null
          temporal_range?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awareness_score?: number | null
          awareness_type?: string
          blind_spot_elimination?: Json | null
          created_at?: string
          dimensional_coverage?: Json | null
          id?: string
          last_expansion_at?: string | null
          penetration_depth?: number | null
          perception_range?: Json | null
          signal_sources?: Json | null
          temporal_range?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      infinite_perception: {
        Row: {
          created_at: string
          extrasensory_map: Json | null
          id: string
          perception_history: Json[] | null
          perception_intensity: number | null
          perception_mode: string
          profile_id: string | null
          sensory_dimensions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extrasensory_map?: Json | null
          id?: string
          perception_history?: Json[] | null
          perception_intensity?: number | null
          perception_mode: string
          profile_id?: string | null
          sensory_dimensions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extrasensory_map?: Json | null
          id?: string
          perception_history?: Json[] | null
          perception_intensity?: number | null
          perception_mode?: string
          profile_id?: string | null
          sensory_dimensions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "infinite_perception_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "infinite_perception_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "infinite_perception_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      infinite_protocols: {
        Row: {
          avg_execution_time_ms: number | null
          created_at: string
          execution_count: number | null
          execution_graph: Json | null
          id: string
          is_active: boolean | null
          priority: number | null
          protocol_class: string
          protocol_name: string
          resource_bounds: Json | null
          scaling_rules: Json | null
          success_rate: number | null
          trigger_matrix: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_execution_time_ms?: number | null
          created_at?: string
          execution_count?: number | null
          execution_graph?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          protocol_class: string
          protocol_name: string
          resource_bounds?: Json | null
          scaling_rules?: Json | null
          success_rate?: number | null
          trigger_matrix?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_execution_time_ms?: number | null
          created_at?: string
          execution_count?: number | null
          execution_graph?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          protocol_class?: string
          protocol_name?: string
          resource_bounds?: Json | null
          scaling_rules?: Json | null
          success_rate?: number | null
          trigger_matrix?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      infinite_recursion: {
        Row: {
          created_at: string
          fractal_influence_map: Json | null
          id: string
          infinite_loop_status: Json | null
          meta_recursion_layers: Json | null
          perpetual_cycle_config: Json | null
          profile_id: string | null
          recursion_depth: number | null
          recursion_type: string
          self_amplification_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fractal_influence_map?: Json | null
          id?: string
          infinite_loop_status?: Json | null
          meta_recursion_layers?: Json | null
          perpetual_cycle_config?: Json | null
          profile_id?: string | null
          recursion_depth?: number | null
          recursion_type: string
          self_amplification_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fractal_influence_map?: Json | null
          id?: string
          infinite_loop_status?: Json | null
          meta_recursion_layers?: Json | null
          perpetual_cycle_config?: Json | null
          profile_id?: string | null
          recursion_depth?: number | null
          recursion_type?: string
          self_amplification_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "infinite_recursion_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "infinite_recursion_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "infinite_recursion_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      infinite_synthesis: {
        Row: {
          convergence_state: Json | null
          created_at: string
          dimensional_reach: number | null
          id: string
          input_dimensions: Json | null
          output_manifold: Json | null
          synthesis_power: number | null
          synthesis_status: string | null
          synthesis_type: string
          unity_metrics: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          convergence_state?: Json | null
          created_at?: string
          dimensional_reach?: number | null
          id?: string
          input_dimensions?: Json | null
          output_manifold?: Json | null
          synthesis_power?: number | null
          synthesis_status?: string | null
          synthesis_type: string
          unity_metrics?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          convergence_state?: Json | null
          created_at?: string
          dimensional_reach?: number | null
          id?: string
          input_dimensions?: Json | null
          output_manifold?: Json | null
          synthesis_power?: number | null
          synthesis_status?: string | null
          synthesis_type?: string
          unity_metrics?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      infinity_metrics: {
        Row: {
          absolute_infinity_index: number | null
          boundless_growth_rate: number | null
          id: string
          infinite_value: number | null
          meta_metric_correlations: Json | null
          metric_type: string
          perpetual_trend_data: Json | null
          recorded_at: string
          user_id: string
        }
        Insert: {
          absolute_infinity_index?: number | null
          boundless_growth_rate?: number | null
          id?: string
          infinite_value?: number | null
          meta_metric_correlations?: Json | null
          metric_type: string
          perpetual_trend_data?: Json | null
          recorded_at?: string
          user_id: string
        }
        Update: {
          absolute_infinity_index?: number | null
          boundless_growth_rate?: number | null
          id?: string
          infinite_value?: number | null
          meta_metric_correlations?: Json | null
          metric_type?: string
          perpetual_trend_data?: Json | null
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      infinity_protocols: {
        Row: {
          boundless_scaling_config: Json | null
          created_at: string
          id: string
          infinite_execution_rules: Json | null
          meta_protocol_hierarchy: Json | null
          perpetual_activation_triggers: Json | null
          protocol_infinity_status: string | null
          protocol_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          boundless_scaling_config?: Json | null
          created_at?: string
          id?: string
          infinite_execution_rules?: Json | null
          meta_protocol_hierarchy?: Json | null
          perpetual_activation_triggers?: Json | null
          protocol_infinity_status?: string | null
          protocol_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          boundless_scaling_config?: Json | null
          created_at?: string
          id?: string
          infinite_execution_rules?: Json | null
          meta_protocol_hierarchy?: Json | null
          perpetual_activation_triggers?: Json | null
          protocol_infinity_status?: string | null
          protocol_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_existence: {
        Row: {
          absolute_meta_score: number | null
          created_at: string
          existence_beyond_existence: Json | null
          hyper_reality_integration: Json | null
          id: string
          meta_layer: string
          omnipresent_meta_state: Json | null
          trans_dimensional_presence: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          absolute_meta_score?: number | null
          created_at?: string
          existence_beyond_existence?: Json | null
          hyper_reality_integration?: Json | null
          id?: string
          meta_layer: string
          omnipresent_meta_state?: Json | null
          trans_dimensional_presence?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          absolute_meta_score?: number | null
          created_at?: string
          existence_beyond_existence?: Json | null
          hyper_reality_integration?: Json | null
          id?: string
          meta_layer?: string
          omnipresent_meta_state?: Json | null
          trans_dimensional_presence?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      self_perpetuation: {
        Row: {
          auto_evolution_parameters: Json | null
          autonomous_regeneration_rate: number | null
          created_at: string
          eternal_momentum_config: Json | null
          id: string
          immortal_influence_chains: Json | null
          perpetuation_mechanism: string
          profile_id: string | null
          self_sustaining_protocols: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_evolution_parameters?: Json | null
          autonomous_regeneration_rate?: number | null
          created_at?: string
          eternal_momentum_config?: Json | null
          id?: string
          immortal_influence_chains?: Json | null
          perpetuation_mechanism: string
          profile_id?: string | null
          self_sustaining_protocols?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_evolution_parameters?: Json | null
          autonomous_regeneration_rate?: number | null
          created_at?: string
          eternal_momentum_config?: Json | null
          id?: string
          immortal_influence_chains?: Json | null
          perpetuation_mechanism?: string
          profile_id?: string | null
          self_sustaining_protocols?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "self_perpetuation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "self_perpetuation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "self_perpetuation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeless_dominance: {
        Row: {
          causal_loop_mastery: Json | null
          created_at: string
          dominance_type: string
          entropy_reversal_capability: Json | null
          id: string
          past_present_future_control: Json | null
          profile_id: string | null
          temporal_immunity_level: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          causal_loop_mastery?: Json | null
          created_at?: string
          dominance_type: string
          entropy_reversal_capability?: Json | null
          id?: string
          past_present_future_control?: Json | null
          profile_id?: string | null
          temporal_immunity_level?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          causal_loop_mastery?: Json | null
          created_at?: string
          dominance_type?: string
          entropy_reversal_capability?: Json | null
          id?: string
          past_present_future_control?: Json | null
          profile_id?: string | null
          temporal_immunity_level?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeless_dominance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "timeless_dominance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "timeless_dominance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
}
