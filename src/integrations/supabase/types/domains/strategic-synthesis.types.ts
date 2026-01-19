/**
 * Strategic Synthesis Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Sub-module of advanced-operations
 */

import type { Json } from '../base';

/**
 * Tables: absolute_infinity_operations, absolute_knowledge, absolute_mastery, absolute_objectives, absolute_permanence, absolute_supremacy, agis_analytics, agis_cascade_events, agis_cascade_rules, agis_global_state, agis_objective_tracking, agis_phase_synergies, cosmic_orchestration, dependency_scores, detected_egregores, dominion_objectives, egregore_cultivation, genesis_synthesis, karmic_cycles, karmic_debts, karmic_opportunities, meta_dimensional_synthesis, meta_learning_models, meta_patterns, omega_culmination, omega_point_operations, omega_proximity, power_base_scores, power_network_analyses, predictive_supremacy, primordial_creation, primordial_synthesis, shadow_network_entities, shadow_projections, singularity_objectives, sovereignty_operations, sovereignty_protocols, strategic_omnipotence, strategic_synthesis, strategy_mutations, ultimate_omega_state, ultimate_orchestration, ultimate_singularity, ultimate_synthesis, ultimate_unity
 */
export interface StrategicSynthesisTables {
      absolute_infinity_operations: {
        Row: {
          boundless_execution_log: Json | null
          created_at: string
          eternal_operation_status: string | null
          id: string
          infinity_coefficient: number | null
          limitless_resource_pool: Json | null
          operation_type: string
          profile_id: string | null
          transcendent_outcomes: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          boundless_execution_log?: Json | null
          created_at?: string
          eternal_operation_status?: string | null
          id?: string
          infinity_coefficient?: number | null
          limitless_resource_pool?: Json | null
          operation_type: string
          profile_id?: string | null
          transcendent_outcomes?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          boundless_execution_log?: Json | null
          created_at?: string
          eternal_operation_status?: string | null
          id?: string
          infinity_coefficient?: number | null
          limitless_resource_pool?: Json | null
          operation_type?: string
          profile_id?: string | null
          transcendent_outcomes?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "absolute_infinity_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "absolute_infinity_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "absolute_infinity_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      absolute_knowledge: {
        Row: {
          created_at: string
          derivation_chain: Json[] | null
          id: string
          knowledge_depth: number | null
          knowledge_payload: Json | null
          knowledge_type: string
          profile_id: string | null
          truth_coefficient: number | null
          universal_applicability: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          derivation_chain?: Json[] | null
          id?: string
          knowledge_depth?: number | null
          knowledge_payload?: Json | null
          knowledge_type: string
          profile_id?: string | null
          truth_coefficient?: number | null
          universal_applicability?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          derivation_chain?: Json[] | null
          id?: string
          knowledge_depth?: number | null
          knowledge_payload?: Json | null
          knowledge_type?: string
          profile_id?: string | null
          truth_coefficient?: number | null
          universal_applicability?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "absolute_knowledge_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "absolute_knowledge_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "absolute_knowledge_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      absolute_mastery: {
        Row: {
          challenges_overcome: Json | null
          competency_level: number | null
          control_percentage: number | null
          created_at: string
          id: string
          knowledge_graph: Json | null
          leverage_points: Json | null
          mastery_domain: string
          next_milestones: Json | null
          skill_matrix: Json | null
          updated_at: string
          user_id: string
          vulnerability_map: Json | null
        }
        Insert: {
          challenges_overcome?: Json | null
          competency_level?: number | null
          control_percentage?: number | null
          created_at?: string
          id?: string
          knowledge_graph?: Json | null
          leverage_points?: Json | null
          mastery_domain: string
          next_milestones?: Json | null
          skill_matrix?: Json | null
          updated_at?: string
          user_id: string
          vulnerability_map?: Json | null
        }
        Update: {
          challenges_overcome?: Json | null
          competency_level?: number | null
          control_percentage?: number | null
          created_at?: string
          id?: string
          knowledge_graph?: Json | null
          leverage_points?: Json | null
          mastery_domain?: string
          next_milestones?: Json | null
          skill_matrix?: Json | null
          updated_at?: string
          user_id?: string
          vulnerability_map?: Json | null
        }
        Relationships: []
      }
      absolute_objectives: {
        Row: {
          blockers: Json | null
          created_at: string
          current_progress: number | null
          dependencies: Json | null
          estimated_completion: string | null
          id: string
          objective_name: string
          objective_type: string
          priority_score: number | null
          resources_required: Json | null
          status: string | null
          sub_objectives: Json | null
          target_state: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blockers?: Json | null
          created_at?: string
          current_progress?: number | null
          dependencies?: Json | null
          estimated_completion?: string | null
          id?: string
          objective_name: string
          objective_type: string
          priority_score?: number | null
          resources_required?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          target_state?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blockers?: Json | null
          created_at?: string
          current_progress?: number | null
          dependencies?: Json | null
          estimated_completion?: string | null
          id?: string
          objective_name?: string
          objective_type?: string
          priority_score?: number | null
          resources_required?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          target_state?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      absolute_permanence: {
        Row: {
          anchored_reality: Json | null
          causal_protection: Json | null
          created_at: string
          existence_guarantee: Json | null
          id: string
          immutability_score: number | null
          permanence_protocols: Json | null
          permanence_type: string
          temporal_immunity: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anchored_reality?: Json | null
          causal_protection?: Json | null
          created_at?: string
          existence_guarantee?: Json | null
          id?: string
          immutability_score?: number | null
          permanence_protocols?: Json | null
          permanence_type: string
          temporal_immunity?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anchored_reality?: Json | null
          causal_protection?: Json | null
          created_at?: string
          existence_guarantee?: Json | null
          id?: string
          immutability_score?: number | null
          permanence_protocols?: Json | null
          permanence_type?: string
          temporal_immunity?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      absolute_supremacy: {
        Row: {
          control_vectors: Json | null
          created_at: string
          dominance_score: number | null
          evolution_trajectory: Json | null
          id: string
          influence_matrix: Json | null
          power_topology: Json | null
          resistance_mapping: Json | null
          supremacy_domain: string
          sustainability_rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          control_vectors?: Json | null
          created_at?: string
          dominance_score?: number | null
          evolution_trajectory?: Json | null
          id?: string
          influence_matrix?: Json | null
          power_topology?: Json | null
          resistance_mapping?: Json | null
          supremacy_domain: string
          sustainability_rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          control_vectors?: Json | null
          created_at?: string
          dominance_score?: number | null
          evolution_trajectory?: Json | null
          id?: string
          influence_matrix?: Json | null
          power_topology?: Json | null
          resistance_mapping?: Json | null
          supremacy_domain?: string
          sustainability_rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agis_analytics: {
        Row: {
          id: string
          metric_metadata: Json | null
          metric_type: string
          metric_value: number
          phase: number
          recorded_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          metric_metadata?: Json | null
          metric_type: string
          metric_value: number
          phase: number
          recorded_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          metric_metadata?: Json | null
          metric_type?: string
          metric_value?: number
          phase?: number
          recorded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agis_cascade_events: {
        Row: {
          affected_phases: number[] | null
          cascade_path: Json | null
          completed_at: string | null
          created_at: string | null
          execution_log: Json | null
          id: string
          outcome_status: string | null
          started_at: string | null
          trigger_event_type: string
          trigger_phase: number
          trigger_source_id: string | null
          user_id: string
        }
        Insert: {
          affected_phases?: number[] | null
          cascade_path?: Json | null
          completed_at?: string | null
          created_at?: string | null
          execution_log?: Json | null
          id?: string
          outcome_status?: string | null
          started_at?: string | null
          trigger_event_type: string
          trigger_phase: number
          trigger_source_id?: string | null
          user_id: string
        }
        Update: {
          affected_phases?: number[] | null
          cascade_path?: Json | null
          completed_at?: string | null
          created_at?: string | null
          execution_log?: Json | null
          id?: string
          outcome_status?: string | null
          started_at?: string | null
          trigger_event_type?: string
          trigger_phase?: number
          trigger_source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agis_cascade_rules: {
        Row: {
          action_params: Json | null
          cooldown_minutes: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          priority: number | null
          rule_name: string
          source_phase: number
          source_table: string
          target_action: string
          target_phase: number
          trigger_condition: Json
          trigger_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_params?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          priority?: number | null
          rule_name: string
          source_phase: number
          source_table: string
          target_action: string
          target_phase: number
          trigger_condition: Json
          trigger_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_params?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          priority?: number | null
          rule_name?: string
          source_phase?: number
          source_table?: string
          target_action?: string
          target_phase?: number
          trigger_condition?: Json
          trigger_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agis_global_state: {
        Row: {
          active_objectives: Json | null
          created_at: string | null
          cross_phase_correlations: Json | null
          id: string
          last_synthesis_at: string | null
          phase_health_scores: Json | null
          success_rate: number | null
          system_readiness_score: number | null
          total_operations_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_objectives?: Json | null
          created_at?: string | null
          cross_phase_correlations?: Json | null
          id?: string
          last_synthesis_at?: string | null
          phase_health_scores?: Json | null
          success_rate?: number | null
          system_readiness_score?: number | null
          total_operations_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_objectives?: Json | null
          created_at?: string | null
          cross_phase_correlations?: Json | null
          id?: string
          last_synthesis_at?: string | null
          phase_health_scores?: Json | null
          success_rate?: number | null
          system_readiness_score?: number | null
          total_operations_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agis_objective_tracking: {
        Row: {
          achieved_outcomes: Json | null
          blockers: Json | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          current_phase: number
          id: string
          is_active: boolean | null
          objective_name: string
          objective_type: string | null
          phase_progression: Json | null
          profile_id: string | null
          starting_phase: number
          target_outcome: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achieved_outcomes?: Json | null
          blockers?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_phase: number
          id?: string
          is_active?: boolean | null
          objective_name: string
          objective_type?: string | null
          phase_progression?: Json | null
          profile_id?: string | null
          starting_phase: number
          target_outcome?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achieved_outcomes?: Json | null
          blockers?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_phase?: number
          id?: string
          is_active?: boolean | null
          objective_name?: string
          objective_type?: string | null
          phase_progression?: Json | null
          profile_id?: string | null
          starting_phase?: number
          target_outcome?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agis_objective_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "agis_objective_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "agis_objective_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agis_phase_synergies: {
        Row: {
          created_at: string | null
          id: string
          interaction_count: number | null
          last_interaction_at: string | null
          phase_a: number
          phase_b: number
          successful_cascades: number | null
          synergy_score: number | null
          synergy_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction_at?: string | null
          phase_a: number
          phase_b: number
          successful_cascades?: number | null
          synergy_score?: number | null
          synergy_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction_at?: string | null
          phase_a?: number
          phase_b?: number
          successful_cascades?: number | null
          synergy_score?: number | null
          synergy_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cosmic_orchestration: {
        Row: {
          cascade_effects: Json | null
          coherence_score: number | null
          created_at: string | null
          harmony_metrics: Json | null
          id: string
          orchestration_complexity: number | null
          orchestration_name: string
          orchestration_scope: string
          orchestration_status: string | null
          participant_matrix: Json | null
          synchronization_protocols: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cascade_effects?: Json | null
          coherence_score?: number | null
          created_at?: string | null
          harmony_metrics?: Json | null
          id?: string
          orchestration_complexity?: number | null
          orchestration_name: string
          orchestration_scope: string
          orchestration_status?: string | null
          participant_matrix?: Json | null
          synchronization_protocols?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cascade_effects?: Json | null
          coherence_score?: number | null
          created_at?: string | null
          harmony_metrics?: Json | null
          id?: string
          orchestration_complexity?: number | null
          orchestration_name?: string
          orchestration_scope?: string
          orchestration_status?: string | null
          participant_matrix?: Json | null
          synchronization_protocols?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dependency_scores: {
        Row: {
          attachment_dependency: number | null
          created_at: string
          dependency_creation_tactics: Json | null
          dependency_trend: Json | null
          emotional_dependency: number | null
          exit_prevention_protocols: Json | null
          financial_dependency: number | null
          id: string
          informational_dependency: number | null
          isolation_factor: number | null
          narcissistic_supply_dependency: number | null
          profile_id: string | null
          social_dependency: number | null
          total_dependency_score: number | null
          updated_at: string
          user_id: string
          withdrawal_severity_prediction: Json | null
        }
        Insert: {
          attachment_dependency?: number | null
          created_at?: string
          dependency_creation_tactics?: Json | null
          dependency_trend?: Json | null
          emotional_dependency?: number | null
          exit_prevention_protocols?: Json | null
          financial_dependency?: number | null
          id?: string
          informational_dependency?: number | null
          isolation_factor?: number | null
          narcissistic_supply_dependency?: number | null
          profile_id?: string | null
          social_dependency?: number | null
          total_dependency_score?: number | null
          updated_at?: string
          user_id: string
          withdrawal_severity_prediction?: Json | null
        }
        Update: {
          attachment_dependency?: number | null
          created_at?: string
          dependency_creation_tactics?: Json | null
          dependency_trend?: Json | null
          emotional_dependency?: number | null
          exit_prevention_protocols?: Json | null
          financial_dependency?: number | null
          id?: string
          informational_dependency?: number | null
          isolation_factor?: number | null
          narcissistic_supply_dependency?: number | null
          profile_id?: string | null
          social_dependency?: number | null
          total_dependency_score?: number | null
          updated_at?: string
          user_id?: string
          withdrawal_severity_prediction?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dependency_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dependency_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dependency_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_egregores: {
        Row: {
          autonomy_level: number | null
          carrier_count: number | null
          carrier_profiles: string[] | null
          core_beliefs: Json | null
          created_at: string | null
          egregore_name: string
          egregore_type: string | null
          feeding_requirements: Json | null
          id: string
          replication_rate: number | null
          resistance_to_opposition: number | null
          updated_at: string | null
          user_id: string
          vitality_score: number | null
          vulnerability_points: Json | null
        }
        Insert: {
          autonomy_level?: number | null
          carrier_count?: number | null
          carrier_profiles?: string[] | null
          core_beliefs?: Json | null
          created_at?: string | null
          egregore_name: string
          egregore_type?: string | null
          feeding_requirements?: Json | null
          id?: string
          replication_rate?: number | null
          resistance_to_opposition?: number | null
          updated_at?: string | null
          user_id: string
          vitality_score?: number | null
          vulnerability_points?: Json | null
        }
        Update: {
          autonomy_level?: number | null
          carrier_count?: number | null
          carrier_profiles?: string[] | null
          core_beliefs?: Json | null
          created_at?: string | null
          egregore_name?: string
          egregore_type?: string | null
          feeding_requirements?: Json | null
          id?: string
          replication_rate?: number | null
          resistance_to_opposition?: number | null
          updated_at?: string | null
          user_id?: string
          vitality_score?: number | null
          vulnerability_points?: Json | null
        }
        Relationships: []
      }
      dominion_objectives: {
        Row: {
          created_at: string
          current_state: Json | null
          dependencies: Json | null
          id: string
          objective_class: string
          objective_name: string
          progress_percentage: number | null
          resource_allocation: Json | null
          risk_factors: Json | null
          status: string | null
          sub_objectives: Json | null
          success_criteria: Json | null
          target_state: Json | null
          timeline: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_state?: Json | null
          dependencies?: Json | null
          id?: string
          objective_class: string
          objective_name: string
          progress_percentage?: number | null
          resource_allocation?: Json | null
          risk_factors?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          success_criteria?: Json | null
          target_state?: Json | null
          timeline?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_state?: Json | null
          dependencies?: Json | null
          id?: string
          objective_class?: string
          objective_name?: string
          progress_percentage?: number | null
          resource_allocation?: Json | null
          risk_factors?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          success_criteria?: Json | null
          target_state?: Json | null
          timeline?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      egregore_cultivation: {
        Row: {
          action_type: string | null
          actual_outcome: Json | null
          cultivation_action: string
          effectiveness_score: number | null
          egregore_id: string | null
          energy_input: number | null
          executed_at: string | null
          expected_outcome: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action_type?: string | null
          actual_outcome?: Json | null
          cultivation_action: string
          effectiveness_score?: number | null
          egregore_id?: string | null
          energy_input?: number | null
          executed_at?: string | null
          expected_outcome?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string | null
          actual_outcome?: Json | null
          cultivation_action?: string
          effectiveness_score?: number | null
          egregore_id?: string | null
          energy_input?: number | null
          executed_at?: string | null
          expected_outcome?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "egregore_cultivation_egregore_id_fkey"
            columns: ["egregore_id"]
            isOneToOne: false
            referencedRelation: "detected_egregores"
            referencedColumns: ["id"]
          },
        ]
      }
      genesis_synthesis: {
        Row: {
          created_at: string
          element_fusion: Json | null
          id: string
          profile_id: string | null
          synthesis_intensity: number | null
          synthesis_mode: string
          synthesis_output: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          element_fusion?: Json | null
          id?: string
          profile_id?: string | null
          synthesis_intensity?: number | null
          synthesis_mode: string
          synthesis_output?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          element_fusion?: Json | null
          id?: string
          profile_id?: string | null
          synthesis_intensity?: number | null
          synthesis_mode?: string
          synthesis_output?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "genesis_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "genesis_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "genesis_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      karmic_cycles: {
        Row: {
          breaking_requirements: Json | null
          created_at: string | null
          current_phase: string | null
          cycle_duration_days: number | null
          cycle_name: string
          cycle_type: string | null
          id: string
          pattern_description: string | null
          profile_id: string | null
          repetition_count: number | null
          severity_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          breaking_requirements?: Json | null
          created_at?: string | null
          current_phase?: string | null
          cycle_duration_days?: number | null
          cycle_name: string
          cycle_type?: string | null
          id?: string
          pattern_description?: string | null
          profile_id?: string | null
          repetition_count?: number | null
          severity_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          breaking_requirements?: Json | null
          created_at?: string | null
          current_phase?: string | null
          cycle_duration_days?: number | null
          cycle_name?: string
          cycle_type?: string | null
          id?: string
          pattern_description?: string | null
          profile_id?: string | null
          repetition_count?: number | null
          severity_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "karmic_cycles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karmic_cycles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karmic_cycles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      karmic_debts: {
        Row: {
          accrual_rate: number | null
          created_at: string | null
          creditor_profile_id: string | null
          creditor_type: string | null
          debt_description: string
          debt_magnitude: number | null
          due_date_estimate: string | null
          exploitation_potential: number | null
          id: string
          payment_options: Json | null
          profile_id: string | null
          user_id: string
        }
        Insert: {
          accrual_rate?: number | null
          created_at?: string | null
          creditor_profile_id?: string | null
          creditor_type?: string | null
          debt_description: string
          debt_magnitude?: number | null
          due_date_estimate?: string | null
          exploitation_potential?: number | null
          id?: string
          payment_options?: Json | null
          profile_id?: string | null
          user_id: string
        }
        Update: {
          accrual_rate?: number | null
          created_at?: string | null
          creditor_profile_id?: string | null
          creditor_type?: string | null
          debt_description?: string
          debt_magnitude?: number | null
          due_date_estimate?: string | null
          exploitation_potential?: number | null
          id?: string
          payment_options?: Json | null
          profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "karmic_debts_creditor_profile_id_fkey"
            columns: ["creditor_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karmic_debts_creditor_profile_id_fkey"
            columns: ["creditor_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karmic_debts_creditor_profile_id_fkey"
            columns: ["creditor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karmic_debts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karmic_debts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karmic_debts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      karmic_opportunities: {
        Row: {
          created_at: string | null
          cycle_id: string | null
          id: string
          intervention_type: string | null
          long_term_impact: Json | null
          opportunity_description: string
          profile_id: string | null
          success_probability: number | null
          user_id: string
          window_closes: string | null
          window_opens: string | null
        }
        Insert: {
          created_at?: string | null
          cycle_id?: string | null
          id?: string
          intervention_type?: string | null
          long_term_impact?: Json | null
          opportunity_description: string
          profile_id?: string | null
          success_probability?: number | null
          user_id: string
          window_closes?: string | null
          window_opens?: string | null
        }
        Update: {
          created_at?: string | null
          cycle_id?: string | null
          id?: string
          intervention_type?: string | null
          long_term_impact?: Json | null
          opportunity_description?: string
          profile_id?: string | null
          success_probability?: number | null
          user_id?: string
          window_closes?: string | null
          window_opens?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "karmic_opportunities_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "karmic_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karmic_opportunities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karmic_opportunities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "karmic_opportunities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_dimensional_synthesis: {
        Row: {
          created_at: string
          cross_dimensional_map: Json | null
          dimensional_layers: number | null
          id: string
          profile_id: string | null
          synthesis_coherence: number | null
          synthesis_outcomes: Json | null
          synthesis_type: string
          temporal_binding: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cross_dimensional_map?: Json | null
          dimensional_layers?: number | null
          id?: string
          profile_id?: string | null
          synthesis_coherence?: number | null
          synthesis_outcomes?: Json | null
          synthesis_type: string
          temporal_binding?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cross_dimensional_map?: Json | null
          dimensional_layers?: number | null
          id?: string
          profile_id?: string | null
          synthesis_coherence?: number | null
          synthesis_outcomes?: Json | null
          synthesis_type?: string
          temporal_binding?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_dimensional_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "meta_dimensional_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "meta_dimensional_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_learning_models: {
        Row: {
          accuracy_score: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_trained_at: string | null
          learning_domain: string
          model_name: string
          model_parameters: Json | null
          model_type: string
          performance_metrics: Json | null
          training_data_sources: Json | null
          training_iterations: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          learning_domain: string
          model_name: string
          model_parameters?: Json | null
          model_type?: string
          performance_metrics?: Json | null
          training_data_sources?: Json | null
          training_iterations?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          learning_domain?: string
          model_name?: string
          model_parameters?: Json | null
          model_type?: string
          performance_metrics?: Json | null
          training_data_sources?: Json | null
          training_iterations?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meta_patterns: {
        Row: {
          abstraction_level: number | null
          constituent_patterns: Json | null
          discovered_at: string
          discovery_method: string | null
          id: string
          last_validated_at: string | null
          manifestation_contexts: Json | null
          manipulation_leverage: number | null
          pattern_name: string
          prediction_power: number | null
          user_id: string
          validation_evidence: Json | null
        }
        Insert: {
          abstraction_level?: number | null
          constituent_patterns?: Json | null
          discovered_at?: string
          discovery_method?: string | null
          id?: string
          last_validated_at?: string | null
          manifestation_contexts?: Json | null
          manipulation_leverage?: number | null
          pattern_name: string
          prediction_power?: number | null
          user_id: string
          validation_evidence?: Json | null
        }
        Update: {
          abstraction_level?: number | null
          constituent_patterns?: Json | null
          discovered_at?: string
          discovery_method?: string | null
          id?: string
          last_validated_at?: string | null
          manifestation_contexts?: Json | null
          manipulation_leverage?: number | null
          pattern_name?: string
          prediction_power?: number | null
          user_id?: string
          validation_evidence?: Json | null
        }
        Relationships: []
      }
      omega_culmination: {
        Row: {
          created_at: string
          culmination_type: string
          finality_score: number | null
          id: string
          omega_point_achievement: Json | null
          profile_id: string | null
          transcendent_completion: Json | null
          ultimate_convergence_state: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          culmination_type: string
          finality_score?: number | null
          id?: string
          omega_point_achievement?: Json | null
          profile_id?: string | null
          transcendent_completion?: Json | null
          ultimate_convergence_state?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          culmination_type?: string
          finality_score?: number | null
          id?: string
          omega_point_achievement?: Json | null
          profile_id?: string | null
          transcendent_completion?: Json | null
          ultimate_convergence_state?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "omega_culmination_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "omega_culmination_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "omega_culmination_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      omega_point_operations: {
        Row: {
          attractor_state: Json | null
          convergence_vector: Json | null
          created_at: string
          destiny_alignment: number | null
          finality_metrics: Json | null
          id: string
          omega_proximity: number | null
          operation_name: string
          operation_status: string | null
          transcendence_path: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attractor_state?: Json | null
          convergence_vector?: Json | null
          created_at?: string
          destiny_alignment?: number | null
          finality_metrics?: Json | null
          id?: string
          omega_proximity?: number | null
          operation_name: string
          operation_status?: string | null
          transcendence_path?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attractor_state?: Json | null
          convergence_vector?: Json | null
          created_at?: string
          destiny_alignment?: number | null
          finality_metrics?: Json | null
          id?: string
          omega_proximity?: number | null
          operation_name?: string
          operation_status?: string | null
          transcendence_path?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      omega_proximity: {
        Row: {
          bridge_domains: Json | null
          consciousness_level: string | null
          created_at: string | null
          evolutionary_readiness: number | null
          id: string
          network_position_score: number | null
          noosphere_influence: number | null
          profile_id: string | null
          proximity_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bridge_domains?: Json | null
          consciousness_level?: string | null
          created_at?: string | null
          evolutionary_readiness?: number | null
          id?: string
          network_position_score?: number | null
          noosphere_influence?: number | null
          profile_id?: string | null
          proximity_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bridge_domains?: Json | null
          consciousness_level?: string | null
          created_at?: string | null
          evolutionary_readiness?: number | null
          id?: string
          network_position_score?: number | null
          noosphere_influence?: number | null
          profile_id?: string | null
          proximity_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "omega_proximity_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "omega_proximity_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "omega_proximity_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      power_base_scores: {
        Row: {
          coercive_power: number | null
          created_at: string | null
          expert_power: number | null
          id: string
          informational_power: number | null
          legitimate_power: number | null
          leverage_points: Json | null
          power_dynamics_history: Json | null
          profile_id: string | null
          referent_power: number | null
          reward_power: number | null
          total_power_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coercive_power?: number | null
          created_at?: string | null
          expert_power?: number | null
          id?: string
          informational_power?: number | null
          legitimate_power?: number | null
          leverage_points?: Json | null
          power_dynamics_history?: Json | null
          profile_id?: string | null
          referent_power?: number | null
          reward_power?: number | null
          total_power_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coercive_power?: number | null
          created_at?: string | null
          expert_power?: number | null
          id?: string
          informational_power?: number | null
          legitimate_power?: number | null
          leverage_points?: Json | null
          power_dynamics_history?: Json | null
          profile_id?: string | null
          referent_power?: number | null
          reward_power?: number | null
          total_power_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "power_base_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "power_base_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "power_base_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      power_network_analyses: {
        Row: {
          analysis_type: string
          average_clustering: number | null
          betweenness_rankings: Json | null
          brokers: Json | null
          closeness_rankings: Json | null
          coalition_strength: Json | null
          communities: Json | null
          community_bridges: Json | null
          computed_at: string
          created_at: string
          critical_nodes: Json | null
          detected_coalitions: Json | null
          eigenvector_rankings: Json | null
          expires_at: string | null
          gatekeepers: Json | null
          id: string
          influence_paths: Json | null
          influencers: Json | null
          katz_rankings: Json | null
          network_density: number | null
          optimal_targets: Json | null
          pagerank_rankings: Json | null
          power_scores: Json | null
          scope_description: string | null
          structural_holes: Json | null
          total_edges: number | null
          total_nodes: number | null
          user_id: string
          vulnerability_map: Json | null
          weak_ties: Json | null
        }
        Insert: {
          analysis_type: string
          average_clustering?: number | null
          betweenness_rankings?: Json | null
          brokers?: Json | null
          closeness_rankings?: Json | null
          coalition_strength?: Json | null
          communities?: Json | null
          community_bridges?: Json | null
          computed_at?: string
          created_at?: string
          critical_nodes?: Json | null
          detected_coalitions?: Json | null
          eigenvector_rankings?: Json | null
          expires_at?: string | null
          gatekeepers?: Json | null
          id?: string
          influence_paths?: Json | null
          influencers?: Json | null
          katz_rankings?: Json | null
          network_density?: number | null
          optimal_targets?: Json | null
          pagerank_rankings?: Json | null
          power_scores?: Json | null
          scope_description?: string | null
          structural_holes?: Json | null
          total_edges?: number | null
          total_nodes?: number | null
          user_id: string
          vulnerability_map?: Json | null
          weak_ties?: Json | null
        }
        Update: {
          analysis_type?: string
          average_clustering?: number | null
          betweenness_rankings?: Json | null
          brokers?: Json | null
          closeness_rankings?: Json | null
          coalition_strength?: Json | null
          communities?: Json | null
          community_bridges?: Json | null
          computed_at?: string
          created_at?: string
          critical_nodes?: Json | null
          detected_coalitions?: Json | null
          eigenvector_rankings?: Json | null
          expires_at?: string | null
          gatekeepers?: Json | null
          id?: string
          influence_paths?: Json | null
          influencers?: Json | null
          katz_rankings?: Json | null
          network_density?: number | null
          optimal_targets?: Json | null
          pagerank_rankings?: Json | null
          power_scores?: Json | null
          scope_description?: string | null
          structural_holes?: Json | null
          total_edges?: number | null
          total_nodes?: number | null
          user_id?: string
          vulnerability_map?: Json | null
          weak_ties?: Json | null
        }
        Relationships: []
      }
      predictive_supremacy: {
        Row: {
          accuracy_history: Json | null
          actual_outcome: Json | null
          causal_chain: Json | null
          confidence_interval: Json | null
          created_at: string
          id: string
          intervention_points: Json | null
          prediction_domain: string
          prediction_type: string
          probability_distribution: Json | null
          profile_id: string | null
          time_horizon_hours: number | null
          user_id: string
          validated_at: string | null
        }
        Insert: {
          accuracy_history?: Json | null
          actual_outcome?: Json | null
          causal_chain?: Json | null
          confidence_interval?: Json | null
          created_at?: string
          id?: string
          intervention_points?: Json | null
          prediction_domain: string
          prediction_type: string
          probability_distribution?: Json | null
          profile_id?: string | null
          time_horizon_hours?: number | null
          user_id: string
          validated_at?: string | null
        }
        Update: {
          accuracy_history?: Json | null
          actual_outcome?: Json | null
          causal_chain?: Json | null
          confidence_interval?: Json | null
          created_at?: string
          id?: string
          intervention_points?: Json | null
          prediction_domain?: string
          prediction_type?: string
          probability_distribution?: Json | null
          profile_id?: string | null
          time_horizon_hours?: number | null
          user_id?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictive_supremacy_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "predictive_supremacy_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "predictive_supremacy_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      primordial_creation: {
        Row: {
          created_at: string
          creation_domain: string
          creation_matrix: Json | null
          id: string
          manifestation_log: Json[] | null
          primordial_power: number | null
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creation_domain: string
          creation_matrix?: Json | null
          id?: string
          manifestation_log?: Json[] | null
          primordial_power?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creation_domain?: string
          creation_matrix?: Json | null
          id?: string
          manifestation_log?: Json[] | null
          primordial_power?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "primordial_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "primordial_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "primordial_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      primordial_synthesis: {
        Row: {
          annihilation_protocols: Json | null
          created_at: string | null
          creation_patterns: Json | null
          energy_balance: Json | null
          fundamental_forces: Json | null
          id: string
          stability_coefficient: number | null
          synthesis_formulas: Json | null
          synthesis_mastery: number | null
          synthesis_status: string | null
          synthesis_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annihilation_protocols?: Json | null
          created_at?: string | null
          creation_patterns?: Json | null
          energy_balance?: Json | null
          fundamental_forces?: Json | null
          id?: string
          stability_coefficient?: number | null
          synthesis_formulas?: Json | null
          synthesis_mastery?: number | null
          synthesis_status?: string | null
          synthesis_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annihilation_protocols?: Json | null
          created_at?: string | null
          creation_patterns?: Json | null
          energy_balance?: Json | null
          fundamental_forces?: Json | null
          id?: string
          stability_coefficient?: number | null
          synthesis_formulas?: Json | null
          synthesis_mastery?: number | null
          synthesis_status?: string | null
          synthesis_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shadow_network_entities: {
        Row: {
          connection_anomalies: Json | null
          created_at: string
          detection_method: string | null
          entity_label: string | null
          entity_type: string
          homophily_violations: Json | null
          id: string
          inference_confidence: number | null
          intermediary_paths: Json | null
          negative_space_indicators: Json | null
          related_profile_ids: string[] | null
          updated_at: string
          user_id: string
          visibility_score: number | null
        }
        Insert: {
          connection_anomalies?: Json | null
          created_at?: string
          detection_method?: string | null
          entity_label?: string | null
          entity_type: string
          homophily_violations?: Json | null
          id?: string
          inference_confidence?: number | null
          intermediary_paths?: Json | null
          negative_space_indicators?: Json | null
          related_profile_ids?: string[] | null
          updated_at?: string
          user_id: string
          visibility_score?: number | null
        }
        Update: {
          connection_anomalies?: Json | null
          created_at?: string
          detection_method?: string | null
          entity_label?: string | null
          entity_type?: string
          homophily_violations?: Json | null
          id?: string
          inference_confidence?: number | null
          intermediary_paths?: Json | null
          negative_space_indicators?: Json | null
          related_profile_ids?: string[] | null
          updated_at?: string
          user_id?: string
          visibility_score?: number | null
        }
        Relationships: []
      }
      shadow_projections: {
        Row: {
          awareness_level: number | null
          created_at: string | null
          exploitation_vectors: Json | null
          id: string
          integration_potential: number | null
          projected_trait: string
          projection_intensity: number | null
          source_profile_id: string | null
          target_profile_id: string | null
          user_id: string
        }
        Insert: {
          awareness_level?: number | null
          created_at?: string | null
          exploitation_vectors?: Json | null
          id?: string
          integration_potential?: number | null
          projected_trait: string
          projection_intensity?: number | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          user_id: string
        }
        Update: {
          awareness_level?: number | null
          created_at?: string | null
          exploitation_vectors?: Json | null
          id?: string
          integration_potential?: number | null
          projected_trait?: string
          projection_intensity?: number | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shadow_projections_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shadow_projections_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shadow_projections_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shadow_projections_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shadow_projections_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shadow_projections_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      singularity_objectives: {
        Row: {
          constraint_parameters: Json | null
          created_at: string | null
          estimated_completion: string | null
          id: string
          objective_name: string
          objective_type: string
          priority_level: number | null
          progress_percentage: number | null
          resource_requirements: Json | null
          status: string | null
          sub_objectives: Json | null
          success_criteria: Json
          target_profiles: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          constraint_parameters?: Json | null
          created_at?: string | null
          estimated_completion?: string | null
          id?: string
          objective_name: string
          objective_type?: string
          priority_level?: number | null
          progress_percentage?: number | null
          resource_requirements?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          success_criteria: Json
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          constraint_parameters?: Json | null
          created_at?: string | null
          estimated_completion?: string | null
          id?: string
          objective_name?: string
          objective_type?: string
          priority_level?: number | null
          progress_percentage?: number | null
          resource_requirements?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          success_criteria?: Json
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sovereignty_operations: {
        Row: {
          created_at: string | null
          effectiveness_score: number | null
          execution_timeline: Json | null
          id: string
          operation_name: string
          operation_status: string | null
          operation_type: string
          outcome_projections: Json | null
          profile_id: string | null
          resource_deployment: Json | null
          risk_assessment: Json | null
          target_dimensions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          effectiveness_score?: number | null
          execution_timeline?: Json | null
          id?: string
          operation_name: string
          operation_status?: string | null
          operation_type: string
          outcome_projections?: Json | null
          profile_id?: string | null
          resource_deployment?: Json | null
          risk_assessment?: Json | null
          target_dimensions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          effectiveness_score?: number | null
          execution_timeline?: Json | null
          id?: string
          operation_name?: string
          operation_status?: string | null
          operation_type?: string
          outcome_projections?: Json | null
          profile_id?: string | null
          resource_deployment?: Json | null
          risk_assessment?: Json | null
          target_dimensions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sovereignty_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "sovereignty_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "sovereignty_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sovereignty_protocols: {
        Row: {
          authority_matrix: Json | null
          consolidation_progress: number | null
          created_at: string | null
          enforcement_mechanisms: Json | null
          id: string
          jurisdiction_scope: Json | null
          legitimacy_score: number | null
          protocol_name: string
          protocol_status: string | null
          resistance_threshold: number | null
          sovereignty_domain: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          authority_matrix?: Json | null
          consolidation_progress?: number | null
          created_at?: string | null
          enforcement_mechanisms?: Json | null
          id?: string
          jurisdiction_scope?: Json | null
          legitimacy_score?: number | null
          protocol_name: string
          protocol_status?: string | null
          resistance_threshold?: number | null
          sovereignty_domain: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          authority_matrix?: Json | null
          consolidation_progress?: number | null
          created_at?: string | null
          enforcement_mechanisms?: Json | null
          id?: string
          jurisdiction_scope?: Json | null
          legitimacy_score?: number | null
          protocol_name?: string
          protocol_status?: string | null
          resistance_threshold?: number | null
          sovereignty_domain?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      strategic_omnipotence: {
        Row: {
          contingency_branches: Json | null
          created_at: string
          execution_timeline: Json | null
          id: string
          objective_hierarchy: Json | null
          outcome: Json | null
          power_projection: Json | null
          resource_allocation: Json | null
          risk_assessment: Json | null
          status: string | null
          strategy_name: string
          success_probability: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contingency_branches?: Json | null
          created_at?: string
          execution_timeline?: Json | null
          id?: string
          objective_hierarchy?: Json | null
          outcome?: Json | null
          power_projection?: Json | null
          resource_allocation?: Json | null
          risk_assessment?: Json | null
          status?: string | null
          strategy_name: string
          success_probability?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contingency_branches?: Json | null
          created_at?: string
          execution_timeline?: Json | null
          id?: string
          objective_hierarchy?: Json | null
          outcome?: Json | null
          power_projection?: Json | null
          resource_allocation?: Json | null
          risk_assessment?: Json | null
          status?: string | null
          strategy_name?: string
          success_probability?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategic_synthesis: {
        Row: {
          alternative_strategies: Json | null
          confidence_score: number | null
          created_at: string | null
          id: string
          input_sources: Json
          profile_id: string | null
          recommendation_rank: number | null
          resource_efficiency: number | null
          risk_assessment: Json | null
          status: string | null
          synthesis_type: string
          synthesized_strategy: Json
          timeline_projection: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alternative_strategies?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          input_sources: Json
          profile_id?: string | null
          recommendation_rank?: number | null
          resource_efficiency?: number | null
          risk_assessment?: Json | null
          status?: string | null
          synthesis_type: string
          synthesized_strategy: Json
          timeline_projection?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alternative_strategies?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          input_sources?: Json
          profile_id?: string | null
          recommendation_rank?: number | null
          resource_efficiency?: number | null
          risk_assessment?: Json | null
          status?: string | null
          synthesis_type?: string
          synthesized_strategy?: Json
          timeline_projection?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "strategic_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "strategic_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_mutations: {
        Row: {
          adoption_rate: number | null
          created_at: string
          discovered_at: string | null
          fitness_delta: number | null
          genome_id: string | null
          id: string
          mutated_value: Json | null
          mutation_type: string
          original_value: Json | null
          success_examples: Json | null
          user_id: string
        }
        Insert: {
          adoption_rate?: number | null
          created_at?: string
          discovered_at?: string | null
          fitness_delta?: number | null
          genome_id?: string | null
          id?: string
          mutated_value?: Json | null
          mutation_type: string
          original_value?: Json | null
          success_examples?: Json | null
          user_id: string
        }
        Update: {
          adoption_rate?: number | null
          created_at?: string
          discovered_at?: string | null
          fitness_delta?: number | null
          genome_id?: string | null
          id?: string
          mutated_value?: Json | null
          mutation_type?: string
          original_value?: Json | null
          success_examples?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_mutations_genome_id_fkey"
            columns: ["genome_id"]
            isOneToOne: false
            referencedRelation: "campaign_genomes"
            referencedColumns: ["id"]
          },
        ]
      }
      ultimate_omega_state: {
        Row: {
          absolute_mastery_metrics: Json | null
          achieved_at: string | null
          completion_percentage: number | null
          created_at: string
          final_form_parameters: Json | null
          id: string
          omega_protocols: Json | null
          state_type: string
          user_id: string
        }
        Insert: {
          absolute_mastery_metrics?: Json | null
          achieved_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          final_form_parameters?: Json | null
          id?: string
          omega_protocols?: Json | null
          state_type: string
          user_id: string
        }
        Update: {
          absolute_mastery_metrics?: Json | null
          achieved_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          final_form_parameters?: Json | null
          id?: string
          omega_protocols?: Json | null
          state_type?: string
          user_id?: string
        }
        Relationships: []
      }
      ultimate_orchestration: {
        Row: {
          component_systems: Json | null
          conflict_resolution: Json | null
          created_at: string
          execution_order: Json | null
          id: string
          last_orchestration_at: string | null
          latency_ms: number | null
          optimization_targets: Json | null
          orchestration_name: string
          performance_score: number | null
          status: string | null
          synchronization_rules: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          component_systems?: Json | null
          conflict_resolution?: Json | null
          created_at?: string
          execution_order?: Json | null
          id?: string
          last_orchestration_at?: string | null
          latency_ms?: number | null
          optimization_targets?: Json | null
          orchestration_name: string
          performance_score?: number | null
          status?: string | null
          synchronization_rules?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          component_systems?: Json | null
          conflict_resolution?: Json | null
          created_at?: string
          execution_order?: Json | null
          id?: string
          last_orchestration_at?: string | null
          latency_ms?: number | null
          optimization_targets?: Json | null
          orchestration_name?: string
          performance_score?: number | null
          status?: string | null
          synchronization_rules?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ultimate_singularity: {
        Row: {
          absolute_unification_state: Json | null
          convergence_point: Json | null
          created_at: string
          id: string
          infinite_density_metrics: Json | null
          singularity_achievement_score: number | null
          singularity_type: string
          transcendent_collapse_parameters: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          absolute_unification_state?: Json | null
          convergence_point?: Json | null
          created_at?: string
          id?: string
          infinite_density_metrics?: Json | null
          singularity_achievement_score?: number | null
          singularity_type: string
          transcendent_collapse_parameters?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          absolute_unification_state?: Json | null
          convergence_point?: Json | null
          created_at?: string
          id?: string
          infinite_density_metrics?: Json | null
          singularity_achievement_score?: number | null
          singularity_type?: string
          transcendent_collapse_parameters?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ultimate_synthesis: {
        Row: {
          created_at: string
          cross_domain_fusion: Json | null
          emergent_capabilities: Json | null
          evolution_stage: string | null
          id: string
          next_evolution_threshold: number | null
          phase_integration: Json | null
          synergy_multipliers: Json | null
          synthesis_name: string
          total_power_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cross_domain_fusion?: Json | null
          emergent_capabilities?: Json | null
          evolution_stage?: string | null
          id?: string
          next_evolution_threshold?: number | null
          phase_integration?: Json | null
          synergy_multipliers?: Json | null
          synthesis_name: string
          total_power_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cross_domain_fusion?: Json | null
          emergent_capabilities?: Json | null
          evolution_stage?: string | null
          id?: string
          next_evolution_threshold?: number | null
          phase_integration?: Json | null
          synergy_multipliers?: Json | null
          synthesis_name?: string
          total_power_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ultimate_unity: {
        Row: {
          boundary_dissolution: number | null
          collective_synthesis: Json | null
          consciousness_merge: Json | null
          created_at: string
          id: string
          integration_scope: Json | null
          singular_awareness: Json | null
          unity_completeness: number | null
          unity_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          boundary_dissolution?: number | null
          collective_synthesis?: Json | null
          consciousness_merge?: Json | null
          created_at?: string
          id?: string
          integration_scope?: Json | null
          singular_awareness?: Json | null
          unity_completeness?: number | null
          unity_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          boundary_dissolution?: number | null
          collective_synthesis?: Json | null
          consciousness_merge?: Json | null
          created_at?: string
          id?: string
          integration_scope?: Json | null
          singular_awareness?: Json | null
          unity_completeness?: number | null
          unity_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
}
