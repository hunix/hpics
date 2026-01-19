/**
 * Behavioral Predictions Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json } from '../base';

/**
 * Tables in this domain: behavioral_anomalies, behavioral_predictions, behavioral_scenario_predictions, counterfactual_scenarios, decision_windows, emergence_patterns, future_predictions, life_trajectory_predictions, opportunity_windows, pattern_of_life, phase_transition_indicators, precursor_signatures, prediction_models, timeline_interventions, timeline_probabilities, trajectory_intercepts
 */
export interface BehavioralPredictionsTables {
      behavioral_anomalies: {
        Row: {
          actual_value: Json | null
          anomaly_type: string
          baseline_id: string | null
          created_at: string
          description: string | null
          detected_at: string
          deviation_score: number | null
          expected_value: Json | null
          id: string
          is_resolved: boolean | null
          profile_id: string
          resolution_notes: string | null
          severity: string
          user_id: string
        }
        Insert: {
          actual_value?: Json | null
          anomaly_type: string
          baseline_id?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string
          deviation_score?: number | null
          expected_value?: Json | null
          id?: string
          is_resolved?: boolean | null
          profile_id: string
          resolution_notes?: string | null
          severity: string
          user_id: string
        }
        Update: {
          actual_value?: Json | null
          anomaly_type?: string
          baseline_id?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string
          deviation_score?: number | null
          expected_value?: Json | null
          id?: string
          is_resolved?: boolean | null
          profile_id?: string
          resolution_notes?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_anomalies_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "behavioral_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_anomalies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_anomalies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_anomalies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_predictions: {
        Row: {
          accuracy_score: number | null
          actual_outcome: Json | null
          confidence_score: number | null
          created_at: string
          features_used: Json | null
          id: string
          model_version: string | null
          outcome_recorded_at: string | null
          prediction_type: string
          prediction_value: Json
          profile_id: string
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score?: number | null
          created_at?: string
          features_used?: Json | null
          id?: string
          model_version?: string | null
          outcome_recorded_at?: string | null
          prediction_type: string
          prediction_value: Json
          profile_id: string
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score?: number | null
          created_at?: string
          features_used?: Json | null
          id?: string
          model_version?: string | null
          outcome_recorded_at?: string | null
          prediction_type?: string
          prediction_value?: Json
          profile_id?: string
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_scenario_predictions: {
        Row: {
          actual_response: Json | null
          alternative_responses: Json | null
          confidence_score: number
          context: Json | null
          created_at: string
          evidence_basis: Json | null
          id: string
          model_version: string | null
          predicted_response: Json
          prediction_accuracy: number | null
          profile_id: string
          response_probability: number | null
          scenario_category: string | null
          scenario_type: string
          stimulus: string
          user_id: string
          valid_until: string | null
          validated_at: string | null
        }
        Insert: {
          actual_response?: Json | null
          alternative_responses?: Json | null
          confidence_score: number
          context?: Json | null
          created_at?: string
          evidence_basis?: Json | null
          id?: string
          model_version?: string | null
          predicted_response: Json
          prediction_accuracy?: number | null
          profile_id: string
          response_probability?: number | null
          scenario_category?: string | null
          scenario_type: string
          stimulus: string
          user_id: string
          valid_until?: string | null
          validated_at?: string | null
        }
        Update: {
          actual_response?: Json | null
          alternative_responses?: Json | null
          confidence_score?: number
          context?: Json | null
          created_at?: string
          evidence_basis?: Json | null
          id?: string
          model_version?: string | null
          predicted_response?: Json
          prediction_accuracy?: number | null
          profile_id?: string
          response_probability?: number | null
          scenario_category?: string | null
          scenario_type?: string
          stimulus?: string
          user_id?: string
          valid_until?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_scenario_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_scenario_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_scenario_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counterfactual_scenarios: {
        Row: {
          alternative_timelines: Json | null
          baseline_state: Json | null
          causal_justification: string | null
          confidence: number | null
          created_at: string
          decision_tree: Json | null
          id: string
          intervention_type: string
          modified_variables: Json
          predicted_outcomes: Json | null
          profile_id: string | null
          scenario_name: string
          user_id: string
        }
        Insert: {
          alternative_timelines?: Json | null
          baseline_state?: Json | null
          causal_justification?: string | null
          confidence?: number | null
          created_at?: string
          decision_tree?: Json | null
          id?: string
          intervention_type: string
          modified_variables?: Json
          predicted_outcomes?: Json | null
          profile_id?: string | null
          scenario_name: string
          user_id: string
        }
        Update: {
          alternative_timelines?: Json | null
          baseline_state?: Json | null
          causal_justification?: string | null
          confidence?: number | null
          created_at?: string
          decision_tree?: Json | null
          id?: string
          intervention_type?: string
          modified_variables?: Json
          predicted_outcomes?: Json | null
          profile_id?: string | null
          scenario_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counterfactual_scenarios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "counterfactual_scenarios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "counterfactual_scenarios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_windows: {
        Row: {
          context_factors: Json | null
          created_at: string
          ends_at: string | null
          id: string
          influence_potential: number | null
          intervention_taken: Json | null
          outcome: Json | null
          profile_id: string | null
          recommended_actions: Json | null
          starts_at: string | null
          status: string | null
          updated_at: string
          urgency_score: number | null
          user_id: string
          window_name: string
          window_type: string
        }
        Insert: {
          context_factors?: Json | null
          created_at?: string
          ends_at?: string | null
          id?: string
          influence_potential?: number | null
          intervention_taken?: Json | null
          outcome?: Json | null
          profile_id?: string | null
          recommended_actions?: Json | null
          starts_at?: string | null
          status?: string | null
          updated_at?: string
          urgency_score?: number | null
          user_id: string
          window_name: string
          window_type: string
        }
        Update: {
          context_factors?: Json | null
          created_at?: string
          ends_at?: string | null
          id?: string
          influence_potential?: number | null
          intervention_taken?: Json | null
          outcome?: Json | null
          profile_id?: string | null
          recommended_actions?: Json | null
          starts_at?: string | null
          status?: string | null
          updated_at?: string
          urgency_score?: number | null
          user_id?: string
          window_name?: string
          window_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "decision_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "decision_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergence_patterns: {
        Row: {
          created_at: string | null
          detection_confidence: number | null
          exploitation_strategies: Json | null
          first_detected_at: string | null
          id: string
          is_validated: boolean | null
          last_observed_at: string | null
          novelty_score: number | null
          occurrence_count: number | null
          pattern_name: string
          pattern_signature: Json
          pattern_type: string
          source_domains: string[] | null
          strategic_value: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          detection_confidence?: number | null
          exploitation_strategies?: Json | null
          first_detected_at?: string | null
          id?: string
          is_validated?: boolean | null
          last_observed_at?: string | null
          novelty_score?: number | null
          occurrence_count?: number | null
          pattern_name: string
          pattern_signature: Json
          pattern_type: string
          source_domains?: string[] | null
          strategic_value?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          detection_confidence?: number | null
          exploitation_strategies?: Json | null
          first_detected_at?: string | null
          id?: string
          is_validated?: boolean | null
          last_observed_at?: string | null
          novelty_score?: number | null
          occurrence_count?: number | null
          pattern_name?: string
          pattern_signature?: Json
          pattern_type?: string
          source_domains?: string[] | null
          strategic_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      future_predictions: {
        Row: {
          confidence_interval: Json | null
          created_at: string
          id: string
          influencing_factors: Json | null
          intervention_opportunities: Json | null
          outcome_recorded: Json | null
          predicted_date_range: Json | null
          predicted_event: string
          prediction_type: string
          probability_score: number | null
          profile_id: string | null
          status: string | null
          supporting_evidence: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_interval?: Json | null
          created_at?: string
          id?: string
          influencing_factors?: Json | null
          intervention_opportunities?: Json | null
          outcome_recorded?: Json | null
          predicted_date_range?: Json | null
          predicted_event: string
          prediction_type: string
          probability_score?: number | null
          profile_id?: string | null
          status?: string | null
          supporting_evidence?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_interval?: Json | null
          created_at?: string
          id?: string
          influencing_factors?: Json | null
          intervention_opportunities?: Json | null
          outcome_recorded?: Json | null
          predicted_date_range?: Json | null
          predicted_event?: string
          prediction_type?: string
          probability_score?: number | null
          profile_id?: string | null
          status?: string | null
          supporting_evidence?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "future_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "future_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "future_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      life_trajectory_predictions: {
        Row: {
          career_trajectory: Json | null
          confidence_score: number | null
          created_at: string | null
          crisis_early_warnings: Json | null
          financial_trajectory: Json | null
          health_trajectory: Json | null
          id: string
          life_events_sequence: Json | null
          predicted_outcomes: Json | null
          prediction_type: string | null
          profile_id: string | null
          relationship_trajectory: Json | null
          updated_at: string | null
          user_id: string
          valid_until: string | null
          vulnerability_windows: Json | null
        }
        Insert: {
          career_trajectory?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          crisis_early_warnings?: Json | null
          financial_trajectory?: Json | null
          health_trajectory?: Json | null
          id?: string
          life_events_sequence?: Json | null
          predicted_outcomes?: Json | null
          prediction_type?: string | null
          profile_id?: string | null
          relationship_trajectory?: Json | null
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
          vulnerability_windows?: Json | null
        }
        Update: {
          career_trajectory?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          crisis_early_warnings?: Json | null
          financial_trajectory?: Json | null
          health_trajectory?: Json | null
          id?: string
          life_events_sequence?: Json | null
          predicted_outcomes?: Json | null
          prediction_type?: string | null
          profile_id?: string | null
          relationship_trajectory?: Json | null
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
          vulnerability_windows?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "life_trajectory_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "life_trajectory_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "life_trajectory_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_windows: {
        Row: {
          auto_action_config: Json | null
          auto_action_enabled: boolean | null
          created_at: string | null
          detected_at: string | null
          id: string
          opportunity_type: string
          profile_id: string | null
          recommended_actions: Json | null
          risk_factors: Json | null
          success_probability: number | null
          trigger_conditions: Json | null
          user_id: string
          utilization_outcome: Json | null
          was_utilized: boolean | null
          window_end: string
          window_quality: number | null
          window_start: string
        }
        Insert: {
          auto_action_config?: Json | null
          auto_action_enabled?: boolean | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          opportunity_type: string
          profile_id?: string | null
          recommended_actions?: Json | null
          risk_factors?: Json | null
          success_probability?: number | null
          trigger_conditions?: Json | null
          user_id: string
          utilization_outcome?: Json | null
          was_utilized?: boolean | null
          window_end: string
          window_quality?: number | null
          window_start: string
        }
        Update: {
          auto_action_config?: Json | null
          auto_action_enabled?: boolean | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          opportunity_type?: string
          profile_id?: string | null
          recommended_actions?: Json | null
          risk_factors?: Json | null
          success_probability?: number | null
          trigger_conditions?: Json | null
          user_id?: string
          utilization_outcome?: Json | null
          was_utilized?: boolean | null
          window_end?: string
          window_quality?: number | null
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "opportunity_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "opportunity_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_of_life: {
        Row: {
          activity_sequences: Json | null
          alerts: Json | null
          circadian_rhythm: Json | null
          created_at: string
          deviation_history: Json | null
          deviation_threshold: number | null
          id: string
          last_deviation_at: string | null
          locations: Json | null
          profile_id: string | null
          routine_strength: number | null
          routine_type: string
          time_windows: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_sequences?: Json | null
          alerts?: Json | null
          circadian_rhythm?: Json | null
          created_at?: string
          deviation_history?: Json | null
          deviation_threshold?: number | null
          id?: string
          last_deviation_at?: string | null
          locations?: Json | null
          profile_id?: string | null
          routine_strength?: number | null
          routine_type: string
          time_windows?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_sequences?: Json | null
          alerts?: Json | null
          circadian_rhythm?: Json | null
          created_at?: string
          deviation_history?: Json | null
          deviation_threshold?: number | null
          id?: string
          last_deviation_at?: string | null
          locations?: Json | null
          profile_id?: string | null
          routine_strength?: number | null
          routine_type?: string
          time_windows?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_of_life_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "pattern_of_life_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "pattern_of_life_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_transition_indicators: {
        Row: {
          created_at: string | null
          critical_mass_percentage: number | null
          current_phase: string | null
          estimated_transition_date: string | null
          id: string
          positioning_recommendations: Json | null
          post_transition_capabilities: Json | null
          tipping_indicators: Json | null
          transition_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          critical_mass_percentage?: number | null
          current_phase?: string | null
          estimated_transition_date?: string | null
          id?: string
          positioning_recommendations?: Json | null
          post_transition_capabilities?: Json | null
          tipping_indicators?: Json | null
          transition_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          critical_mass_percentage?: number | null
          current_phase?: string | null
          estimated_transition_date?: string | null
          id?: string
          positioning_recommendations?: Json | null
          post_transition_capabilities?: Json | null
          tipping_indicators?: Json | null
          transition_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      precursor_signatures: {
        Row: {
          confidence: number | null
          created_at: string | null
          entropy_gradient: number | null
          id: string
          lead_time_hours: number | null
          precursor_pattern: Json
          profile_id: string | null
          retrocausal_indicators: Json | null
          target_event: string
          user_id: string
          validated: boolean | null
          validation_date: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          entropy_gradient?: number | null
          id?: string
          lead_time_hours?: number | null
          precursor_pattern: Json
          profile_id?: string | null
          retrocausal_indicators?: Json | null
          target_event: string
          user_id: string
          validated?: boolean | null
          validation_date?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          entropy_gradient?: number | null
          id?: string
          lead_time_hours?: number | null
          precursor_pattern?: Json
          profile_id?: string | null
          retrocausal_indicators?: Json | null
          target_event?: string
          user_id?: string
          validated?: boolean | null
          validation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "precursor_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "precursor_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "precursor_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_models: {
        Row: {
          accuracy_metrics: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_trained_at: string | null
          model_config: Json | null
          model_name: string
          model_type: string
          prediction_count: number | null
          successful_predictions: number | null
          training_data_stats: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_metrics?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          model_config?: Json | null
          model_name: string
          model_type: string
          prediction_count?: number | null
          successful_predictions?: number | null
          training_data_stats?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_metrics?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          model_config?: Json | null
          model_name?: string
          model_type?: string
          prediction_count?: number | null
          successful_predictions?: number | null
          training_data_stats?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timeline_interventions: {
        Row: {
          action_taken: string
          actual_outcome: Json | null
          created_at: string
          decision_window_id: string | null
          effectiveness_score: number | null
          executed_at: string | null
          expected_outcome: Json | null
          id: string
          intervention_type: string
          lessons_learned: Json | null
          prediction_id: string | null
          profile_id: string | null
          timing: string | null
          user_id: string
        }
        Insert: {
          action_taken: string
          actual_outcome?: Json | null
          created_at?: string
          decision_window_id?: string | null
          effectiveness_score?: number | null
          executed_at?: string | null
          expected_outcome?: Json | null
          id?: string
          intervention_type: string
          lessons_learned?: Json | null
          prediction_id?: string | null
          profile_id?: string | null
          timing?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string
          actual_outcome?: Json | null
          created_at?: string
          decision_window_id?: string | null
          effectiveness_score?: number | null
          executed_at?: string | null
          expected_outcome?: Json | null
          id?: string
          intervention_type?: string
          lessons_learned?: Json | null
          prediction_id?: string | null
          profile_id?: string | null
          timing?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_interventions_decision_window_id_fkey"
            columns: ["decision_window_id"]
            isOneToOne: false
            referencedRelation: "decision_windows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_interventions_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "future_predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_interventions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "timeline_interventions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "timeline_interventions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_probabilities: {
        Row: {
          collapse_triggers: Json | null
          created_at: string | null
          id: string
          interference_with_others: Json | null
          intervention_leverage_points: Json | null
          malleability_score: number | null
          probability_amplitude: number | null
          profile_id: string | null
          timeline_description: string
          user_id: string
        }
        Insert: {
          collapse_triggers?: Json | null
          created_at?: string | null
          id?: string
          interference_with_others?: Json | null
          intervention_leverage_points?: Json | null
          malleability_score?: number | null
          probability_amplitude?: number | null
          profile_id?: string | null
          timeline_description: string
          user_id: string
        }
        Update: {
          collapse_triggers?: Json | null
          created_at?: string | null
          id?: string
          interference_with_others?: Json | null
          intervention_leverage_points?: Json | null
          malleability_score?: number | null
          probability_amplitude?: number | null
          profile_id?: string | null
          timeline_description?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_probabilities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "timeline_probabilities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "timeline_probabilities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trajectory_intercepts: {
        Row: {
          correction_progress: number | null
          created_at: string | null
          current_deviation: number | null
          current_trajectory: Json
          desired_trajectory: Json
          id: string
          intercept_points: Json | null
          intercept_status: string | null
          intervention_plan: Json | null
          next_intercept_at: string | null
          predicted_trajectory: Json
          profile_id: string | null
          trajectory_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correction_progress?: number | null
          created_at?: string | null
          current_deviation?: number | null
          current_trajectory: Json
          desired_trajectory: Json
          id?: string
          intercept_points?: Json | null
          intercept_status?: string | null
          intervention_plan?: Json | null
          next_intercept_at?: string | null
          predicted_trajectory: Json
          profile_id?: string | null
          trajectory_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correction_progress?: number | null
          created_at?: string | null
          current_deviation?: number | null
          current_trajectory?: Json
          desired_trajectory?: Json
          id?: string
          intercept_points?: Json | null
          intercept_status?: string | null
          intervention_plan?: Json | null
          next_intercept_at?: string | null
          predicted_trajectory?: Json
          profile_id?: string | null
          trajectory_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trajectory_intercepts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trajectory_intercepts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trajectory_intercepts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
}
