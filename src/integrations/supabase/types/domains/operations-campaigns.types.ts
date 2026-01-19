/**
 * Operations Campaigns Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json } from '../base';

/**
 * Tables in this domain: addiction_protocols, autonomous_campaigns, cognitive_warfare_operations, cult_tactic_deployments, deception_analyses, deception_operations, deception_signatures, false_memory_tracking, identity_destabilization_logs, intervention_playbooks, intervention_triggers, learned_helplessness_tracking, manipulation_detections, mass_formation_indicators, memetic_campaigns, memory_interventions, multi_target_campaigns, narrative_campaigns, narrative_crystallization, narrative_identities, narrative_nodes, narrative_simulations, nudge_campaigns, stockholm_syndrome_tracking
 */
export interface OperationsCampaignsTables {
      addiction_protocols: {
        Row: {
          addiction_type: string
          compliance_metrics: Json | null
          created_at: string
          current_phase: string | null
          dependency_progression: Json | null
          dopamine_cycle_mapping: Json | null
          effectiveness_score: number | null
          id: string
          intermittent_reinforcement_score: number | null
          last_reinforcement_at: string | null
          next_scheduled_at: string | null
          profile_id: string | null
          protocol_name: string
          reinforcement_schedule: Json
          updated_at: string
          user_id: string
          variable_ratio_config: Json | null
          withdrawal_timing: Json | null
        }
        Insert: {
          addiction_type: string
          compliance_metrics?: Json | null
          created_at?: string
          current_phase?: string | null
          dependency_progression?: Json | null
          dopamine_cycle_mapping?: Json | null
          effectiveness_score?: number | null
          id?: string
          intermittent_reinforcement_score?: number | null
          last_reinforcement_at?: string | null
          next_scheduled_at?: string | null
          profile_id?: string | null
          protocol_name: string
          reinforcement_schedule?: Json
          updated_at?: string
          user_id: string
          variable_ratio_config?: Json | null
          withdrawal_timing?: Json | null
        }
        Update: {
          addiction_type?: string
          compliance_metrics?: Json | null
          created_at?: string
          current_phase?: string | null
          dependency_progression?: Json | null
          dopamine_cycle_mapping?: Json | null
          effectiveness_score?: number | null
          id?: string
          intermittent_reinforcement_score?: number | null
          last_reinforcement_at?: string | null
          next_scheduled_at?: string | null
          profile_id?: string | null
          protocol_name?: string
          reinforcement_schedule?: Json
          updated_at?: string
          user_id?: string
          variable_ratio_config?: Json | null
          withdrawal_timing?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "addiction_protocols_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "addiction_protocols_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "addiction_protocols_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      autonomous_campaigns: {
        Row: {
          actions_today: number | null
          auto_execute: boolean | null
          campaign_name: string
          campaign_type: string
          created_at: string | null
          current_phase: string | null
          escalation_config: Json | null
          execution_rules: Json | null
          id: string
          is_active: boolean | null
          last_action_at: string | null
          max_daily_actions: number | null
          next_action_at: string | null
          objective: string
          phase_progress: number | null
          profile_id: string | null
          success_criteria: Json | null
          success_rate: number | null
          total_actions: number | null
          trigger_conditions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions_today?: number | null
          auto_execute?: boolean | null
          campaign_name: string
          campaign_type: string
          created_at?: string | null
          current_phase?: string | null
          escalation_config?: Json | null
          execution_rules?: Json | null
          id?: string
          is_active?: boolean | null
          last_action_at?: string | null
          max_daily_actions?: number | null
          next_action_at?: string | null
          objective: string
          phase_progress?: number | null
          profile_id?: string | null
          success_criteria?: Json | null
          success_rate?: number | null
          total_actions?: number | null
          trigger_conditions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions_today?: number | null
          auto_execute?: boolean | null
          campaign_name?: string
          campaign_type?: string
          created_at?: string | null
          current_phase?: string | null
          escalation_config?: Json | null
          execution_rules?: Json | null
          id?: string
          is_active?: boolean | null
          last_action_at?: string | null
          max_daily_actions?: number | null
          next_action_at?: string | null
          objective?: string
          phase_progress?: number | null
          profile_id?: string | null
          success_criteria?: Json | null
          success_rate?: number | null
          total_actions?: number | null
          trigger_conditions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "autonomous_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "autonomous_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_warfare_operations: {
        Row: {
          abort_conditions: Json | null
          attack_surface_map: Json | null
          belief_system_targets: Json | null
          cognitive_vulnerabilities: Json | null
          created_at: string
          current_phase: string | null
          dissonance_vectors: Json | null
          effectiveness_score: number | null
          escalation_triggers: Json | null
          id: string
          mission_objectives: Json | null
          narrative_control_points: Json | null
          operation_name: string
          operation_type: string
          perception_filters: Json | null
          phase_progression: Json | null
          profile_id: string | null
          reality_anchors: Json | null
          resistance_encountered: Json | null
          status: string | null
          success_criteria: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          abort_conditions?: Json | null
          attack_surface_map?: Json | null
          belief_system_targets?: Json | null
          cognitive_vulnerabilities?: Json | null
          created_at?: string
          current_phase?: string | null
          dissonance_vectors?: Json | null
          effectiveness_score?: number | null
          escalation_triggers?: Json | null
          id?: string
          mission_objectives?: Json | null
          narrative_control_points?: Json | null
          operation_name: string
          operation_type?: string
          perception_filters?: Json | null
          phase_progression?: Json | null
          profile_id?: string | null
          reality_anchors?: Json | null
          resistance_encountered?: Json | null
          status?: string | null
          success_criteria?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          abort_conditions?: Json | null
          attack_surface_map?: Json | null
          belief_system_targets?: Json | null
          cognitive_vulnerabilities?: Json | null
          created_at?: string
          current_phase?: string | null
          dissonance_vectors?: Json | null
          effectiveness_score?: number | null
          escalation_triggers?: Json | null
          id?: string
          mission_objectives?: Json | null
          narrative_control_points?: Json | null
          operation_name?: string
          operation_type?: string
          perception_filters?: Json | null
          phase_progression?: Json | null
          profile_id?: string | null
          reality_anchors?: Json | null
          resistance_encountered?: Json | null
          status?: string | null
          success_criteria?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_warfare_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cognitive_warfare_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cognitive_warfare_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cult_tactic_deployments: {
        Row: {
          behavior_control_score: number | null
          confession_culture_metrics: Json | null
          created_at: string
          emotional_control_score: number | null
          exit_cost_perception: number | null
          group_identity_strength: number | null
          id: string
          information_control_score: number | null
          loaded_language_adoption: string[] | null
          profile_id: string | null
          surveillance_acceptance: number | null
          thought_control_score: number | null
          thought_stopping_techniques: Json | null
          total_bite_score: number | null
          updated_at: string
          us_vs_them_narrative_strength: number | null
          user_id: string
        }
        Insert: {
          behavior_control_score?: number | null
          confession_culture_metrics?: Json | null
          created_at?: string
          emotional_control_score?: number | null
          exit_cost_perception?: number | null
          group_identity_strength?: number | null
          id?: string
          information_control_score?: number | null
          loaded_language_adoption?: string[] | null
          profile_id?: string | null
          surveillance_acceptance?: number | null
          thought_control_score?: number | null
          thought_stopping_techniques?: Json | null
          total_bite_score?: number | null
          updated_at?: string
          us_vs_them_narrative_strength?: number | null
          user_id: string
        }
        Update: {
          behavior_control_score?: number | null
          confession_culture_metrics?: Json | null
          created_at?: string
          emotional_control_score?: number | null
          exit_cost_perception?: number | null
          group_identity_strength?: number | null
          id?: string
          information_control_score?: number | null
          loaded_language_adoption?: string[] | null
          profile_id?: string | null
          surveillance_acceptance?: number | null
          thought_control_score?: number | null
          thought_stopping_techniques?: Json | null
          total_bite_score?: number | null
          updated_at?: string
          us_vs_them_narrative_strength?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cult_tactic_deployments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cult_tactic_deployments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cult_tactic_deployments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deception_analyses: {
        Row: {
          analysis_version: string | null
          analyzed_at: string
          behavioral_indicators: Json | null
          conflict_severity: number | null
          created_at: string
          cross_modal_conflicts: Json | null
          deception_likelihood: string | null
          deception_score: number | null
          deception_timeline: Json | null
          expression_authenticity_score: number | null
          facial_indicators: Json | null
          id: string
          linguistic_authenticity_score: number | null
          linguistic_deception_markers: Json | null
          linguistic_indicators: Json | null
          micro_expressions: Json | null
          models_used: string[] | null
          overall_confidence: number
          peak_deception_moments: Json | null
          profile_id: string
          source_id: string | null
          source_type: string
          user_id: string
          vocal_authenticity_score: number | null
          vocal_indicators: Json | null
          voice_stress_markers: Json | null
        }
        Insert: {
          analysis_version?: string | null
          analyzed_at?: string
          behavioral_indicators?: Json | null
          conflict_severity?: number | null
          created_at?: string
          cross_modal_conflicts?: Json | null
          deception_likelihood?: string | null
          deception_score?: number | null
          deception_timeline?: Json | null
          expression_authenticity_score?: number | null
          facial_indicators?: Json | null
          id?: string
          linguistic_authenticity_score?: number | null
          linguistic_deception_markers?: Json | null
          linguistic_indicators?: Json | null
          micro_expressions?: Json | null
          models_used?: string[] | null
          overall_confidence: number
          peak_deception_moments?: Json | null
          profile_id: string
          source_id?: string | null
          source_type: string
          user_id: string
          vocal_authenticity_score?: number | null
          vocal_indicators?: Json | null
          voice_stress_markers?: Json | null
        }
        Update: {
          analysis_version?: string | null
          analyzed_at?: string
          behavioral_indicators?: Json | null
          conflict_severity?: number | null
          created_at?: string
          cross_modal_conflicts?: Json | null
          deception_likelihood?: string | null
          deception_score?: number | null
          deception_timeline?: Json | null
          expression_authenticity_score?: number | null
          facial_indicators?: Json | null
          id?: string
          linguistic_authenticity_score?: number | null
          linguistic_deception_markers?: Json | null
          linguistic_indicators?: Json | null
          micro_expressions?: Json | null
          models_used?: string[] | null
          overall_confidence?: number
          peak_deception_moments?: Json | null
          profile_id?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
          vocal_authenticity_score?: number | null
          vocal_indicators?: Json | null
          voice_stress_markers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deception_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deception_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deception_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deception_operations: {
        Row: {
          burn_notice_protocol: Json | null
          contingency_plans: Json | null
          cover_stories: Json | null
          created_at: string
          credibility_anchors: Json | null
          deception_type: string
          discovery_risk: number | null
          duration_estimate: string | null
          false_trail_data: Json | null
          id: string
          maintenance_requirements: Json | null
          operation_name: string
          planted_information: Json | null
          plausibility_score: number | null
          profile_id: string | null
          status: string | null
          target_beliefs: Json | null
          updated_at: string
          user_id: string
          verification_traps: Json | null
        }
        Insert: {
          burn_notice_protocol?: Json | null
          contingency_plans?: Json | null
          cover_stories?: Json | null
          created_at?: string
          credibility_anchors?: Json | null
          deception_type: string
          discovery_risk?: number | null
          duration_estimate?: string | null
          false_trail_data?: Json | null
          id?: string
          maintenance_requirements?: Json | null
          operation_name: string
          planted_information?: Json | null
          plausibility_score?: number | null
          profile_id?: string | null
          status?: string | null
          target_beliefs?: Json | null
          updated_at?: string
          user_id: string
          verification_traps?: Json | null
        }
        Update: {
          burn_notice_protocol?: Json | null
          contingency_plans?: Json | null
          cover_stories?: Json | null
          created_at?: string
          credibility_anchors?: Json | null
          deception_type?: string
          discovery_risk?: number | null
          duration_estimate?: string | null
          false_trail_data?: Json | null
          id?: string
          maintenance_requirements?: Json | null
          operation_name?: string
          planted_information?: Json | null
          plausibility_score?: number | null
          profile_id?: string | null
          status?: string | null
          target_beliefs?: Json | null
          updated_at?: string
          user_id?: string
          verification_traps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deception_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deception_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deception_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deception_signatures: {
        Row: {
          baseline_comparison: Json | null
          confidence_score: number | null
          context_triggers: Json | null
          created_at: string
          detection_accuracy: number | null
          id: string
          last_detected_at: string | null
          occurrence_count: number | null
          profile_id: string | null
          signature_pattern: Json | null
          signature_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_comparison?: Json | null
          confidence_score?: number | null
          context_triggers?: Json | null
          created_at?: string
          detection_accuracy?: number | null
          id?: string
          last_detected_at?: string | null
          occurrence_count?: number | null
          profile_id?: string | null
          signature_pattern?: Json | null
          signature_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_comparison?: Json | null
          confidence_score?: number | null
          context_triggers?: Json | null
          created_at?: string
          detection_accuracy?: number | null
          id?: string
          last_detected_at?: string | null
          occurrence_count?: number | null
          profile_id?: string | null
          signature_pattern?: Json | null
          signature_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deception_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deception_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deception_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      false_memory_tracking: {
        Row: {
          confidence_after: number | null
          confidence_before: number | null
          contradiction_detections: Json | null
          created_at: string
          id: string
          implantation_technique: string | null
          implanted_narrative: string
          memory_stability_score: number | null
          profile_id: string | null
          reality_testing_bypass_score: number | null
          reinforcement_schedule: Json | null
          success_status: string | null
          target_memory_description: string
          updated_at: string
          user_id: string
          verification_attempts: Json | null
        }
        Insert: {
          confidence_after?: number | null
          confidence_before?: number | null
          contradiction_detections?: Json | null
          created_at?: string
          id?: string
          implantation_technique?: string | null
          implanted_narrative: string
          memory_stability_score?: number | null
          profile_id?: string | null
          reality_testing_bypass_score?: number | null
          reinforcement_schedule?: Json | null
          success_status?: string | null
          target_memory_description: string
          updated_at?: string
          user_id: string
          verification_attempts?: Json | null
        }
        Update: {
          confidence_after?: number | null
          confidence_before?: number | null
          contradiction_detections?: Json | null
          created_at?: string
          id?: string
          implantation_technique?: string | null
          implanted_narrative?: string
          memory_stability_score?: number | null
          profile_id?: string | null
          reality_testing_bypass_score?: number | null
          reinforcement_schedule?: Json | null
          success_status?: string | null
          target_memory_description?: string
          updated_at?: string
          user_id?: string
          verification_attempts?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "false_memory_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "false_memory_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "false_memory_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_destabilization_logs: {
        Row: {
          created_at: string | null
          delivery_context: Json | null
          deployed_at: string | null
          effectiveness_score: number | null
          id: string
          intensity_level: string | null
          profile_id: string | null
          response_observed: string | null
          script_content: string | null
          technique_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_context?: Json | null
          deployed_at?: string | null
          effectiveness_score?: number | null
          id?: string
          intensity_level?: string | null
          profile_id?: string | null
          response_observed?: string | null
          script_content?: string | null
          technique_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_context?: Json | null
          deployed_at?: string | null
          effectiveness_score?: number | null
          id?: string
          intensity_level?: string | null
          profile_id?: string | null
          response_observed?: string | null
          script_content?: string | null
          technique_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_destabilization_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "identity_destabilization_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "identity_destabilization_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_playbooks: {
        Row: {
          channel_recommendations: string[] | null
          churn_prediction_id: string | null
          completed_at: string | null
          created_at: string | null
          escalation_path: Json | null
          gift_suggestions: Json | null
          id: string
          intervention_steps: Json | null
          outcome: string | null
          outcome_notes: string | null
          outreach_scripts: Json | null
          playbook_type: string | null
          profile_id: string | null
          risk_level: string | null
          started_at: string | null
          status: string | null
          success_probability: number | null
          timing_recommendations: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_recommendations?: string[] | null
          churn_prediction_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          escalation_path?: Json | null
          gift_suggestions?: Json | null
          id?: string
          intervention_steps?: Json | null
          outcome?: string | null
          outcome_notes?: string | null
          outreach_scripts?: Json | null
          playbook_type?: string | null
          profile_id?: string | null
          risk_level?: string | null
          started_at?: string | null
          status?: string | null
          success_probability?: number | null
          timing_recommendations?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_recommendations?: string[] | null
          churn_prediction_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          escalation_path?: Json | null
          gift_suggestions?: Json | null
          id?: string
          intervention_steps?: Json | null
          outcome?: string | null
          outcome_notes?: string | null
          outreach_scripts?: Json | null
          playbook_type?: string | null
          profile_id?: string | null
          risk_level?: string | null
          started_at?: string | null
          status?: string | null
          success_probability?: number | null
          timing_recommendations?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_playbooks_churn_prediction_id_fkey"
            columns: ["churn_prediction_id"]
            isOneToOne: false
            referencedRelation: "churn_predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_playbooks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intervention_playbooks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intervention_playbooks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_triggers: {
        Row: {
          cooldown_hours: number | null
          created_at: string | null
          id: string
          intervention_action: string
          intervention_params: Json | null
          is_active: boolean | null
          last_triggered_at: string | null
          priority: number | null
          profile_id: string | null
          success_count: number | null
          trigger_config: Json
          trigger_count: number | null
          trigger_name: string
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          intervention_action: string
          intervention_params?: Json | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          priority?: number | null
          profile_id?: string | null
          success_count?: number | null
          trigger_config: Json
          trigger_count?: number | null
          trigger_name: string
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          intervention_action?: string
          intervention_params?: Json | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          priority?: number | null
          profile_id?: string | null
          success_count?: number | null
          trigger_config?: Json
          trigger_count?: number | null
          trigger_name?: string
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_triggers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intervention_triggers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intervention_triggers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learned_helplessness_tracking: {
        Row: {
          attribution_style: Json | null
          created_at: string
          escape_attempt_detections: Json | null
          helplessness_score: number | null
          hopelessness_indicators: Json | null
          id: string
          initiative_blocking_events: Json | null
          no_win_situations_deployed: Json | null
          passivity_trend: Json | null
          profile_id: string | null
          response_patterns: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attribution_style?: Json | null
          created_at?: string
          escape_attempt_detections?: Json | null
          helplessness_score?: number | null
          hopelessness_indicators?: Json | null
          id?: string
          initiative_blocking_events?: Json | null
          no_win_situations_deployed?: Json | null
          passivity_trend?: Json | null
          profile_id?: string | null
          response_patterns?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attribution_style?: Json | null
          created_at?: string
          escape_attempt_detections?: Json | null
          helplessness_score?: number | null
          hopelessness_indicators?: Json | null
          id?: string
          initiative_blocking_events?: Json | null
          no_win_situations_deployed?: Json | null
          passivity_trend?: Json | null
          profile_id?: string | null
          response_patterns?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learned_helplessness_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "learned_helplessness_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "learned_helplessness_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manipulation_detections: {
        Row: {
          affected_domains: string[] | null
          counter_measures: Json | null
          created_at: string | null
          detected_at: string | null
          detected_in_profile_id: string | null
          detection_confidence: number | null
          evidence: Json | null
          id: string
          is_ongoing: boolean | null
          manipulation_type: string
          resolved_at: string | null
          severity: string | null
          source_actor_id: string | null
          timeline: Json | null
          user_id: string
        }
        Insert: {
          affected_domains?: string[] | null
          counter_measures?: Json | null
          created_at?: string | null
          detected_at?: string | null
          detected_in_profile_id?: string | null
          detection_confidence?: number | null
          evidence?: Json | null
          id?: string
          is_ongoing?: boolean | null
          manipulation_type: string
          resolved_at?: string | null
          severity?: string | null
          source_actor_id?: string | null
          timeline?: Json | null
          user_id: string
        }
        Update: {
          affected_domains?: string[] | null
          counter_measures?: Json | null
          created_at?: string | null
          detected_at?: string | null
          detected_in_profile_id?: string | null
          detection_confidence?: number | null
          evidence?: Json | null
          id?: string
          is_ongoing?: boolean | null
          manipulation_type?: string
          resolved_at?: string | null
          severity?: string | null
          source_actor_id?: string | null
          timeline?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manipulation_detections_detected_in_profile_id_fkey"
            columns: ["detected_in_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "manipulation_detections_detected_in_profile_id_fkey"
            columns: ["detected_in_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "manipulation_detections_detected_in_profile_id_fkey"
            columns: ["detected_in_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manipulation_detections_source_actor_id_fkey"
            columns: ["source_actor_id"]
            isOneToOne: false
            referencedRelation: "threat_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      mass_formation_indicators: {
        Row: {
          anxiety_index: number | null
          created_at: string | null
          estimated_tipping_date: string | null
          focal_object: string | null
          focal_object_strength: number | null
          free_floating_frustration: number | null
          hypnotic_susceptibility: number | null
          id: string
          meaning_deficit_score: number | null
          population_segment: string
          social_atomization_score: number | null
          tipping_point_probability: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anxiety_index?: number | null
          created_at?: string | null
          estimated_tipping_date?: string | null
          focal_object?: string | null
          focal_object_strength?: number | null
          free_floating_frustration?: number | null
          hypnotic_susceptibility?: number | null
          id?: string
          meaning_deficit_score?: number | null
          population_segment: string
          social_atomization_score?: number | null
          tipping_point_probability?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anxiety_index?: number | null
          created_at?: string | null
          estimated_tipping_date?: string | null
          focal_object?: string | null
          focal_object_strength?: number | null
          free_floating_frustration?: number | null
          hypnotic_susceptibility?: number | null
          id?: string
          meaning_deficit_score?: number | null
          population_segment?: string
          social_atomization_score?: number | null
          tipping_point_probability?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      memetic_campaigns: {
        Row: {
          amplification_nodes: string[] | null
          campaign_name: string
          completed_at: string | null
          core_narrative: string | null
          counter_narratives: Json | null
          created_at: string | null
          current_reach: number | null
          emotional_hooks: string[] | null
          id: string
          infected_count: number | null
          infection_rate: number | null
          launched_at: string | null
          meme_content: Json
          peak_reach: number | null
          propagation_model: string | null
          recovered_count: number | null
          recovery_rate: number | null
          status: string | null
          susceptible_population: number | null
          target_networks: string[] | null
          target_profiles: string[] | null
          updated_at: string | null
          user_id: string
          virality_coefficient: number | null
        }
        Insert: {
          amplification_nodes?: string[] | null
          campaign_name: string
          completed_at?: string | null
          core_narrative?: string | null
          counter_narratives?: Json | null
          created_at?: string | null
          current_reach?: number | null
          emotional_hooks?: string[] | null
          id?: string
          infected_count?: number | null
          infection_rate?: number | null
          launched_at?: string | null
          meme_content: Json
          peak_reach?: number | null
          propagation_model?: string | null
          recovered_count?: number | null
          recovery_rate?: number | null
          status?: string | null
          susceptible_population?: number | null
          target_networks?: string[] | null
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id: string
          virality_coefficient?: number | null
        }
        Update: {
          amplification_nodes?: string[] | null
          campaign_name?: string
          completed_at?: string | null
          core_narrative?: string | null
          counter_narratives?: Json | null
          created_at?: string | null
          current_reach?: number | null
          emotional_hooks?: string[] | null
          id?: string
          infected_count?: number | null
          infection_rate?: number | null
          launched_at?: string | null
          meme_content?: Json
          peak_reach?: number | null
          propagation_model?: string | null
          recovered_count?: number | null
          recovery_rate?: number | null
          status?: string | null
          susceptible_population?: number | null
          target_networks?: string[] | null
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id?: string
          virality_coefficient?: number | null
        }
        Relationships: []
      }
      memory_interventions: {
        Row: {
          created_at: string | null
          follow_up_required: boolean | null
          id: string
          intervention_type: string | null
          lability_window_end: string | null
          lability_window_start: string | null
          memory_category: string | null
          notes: string | null
          prediction_error_applied: boolean | null
          prediction_error_content: string | null
          profile_id: string | null
          success_score: number | null
          target_memory: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          intervention_type?: string | null
          lability_window_end?: string | null
          lability_window_start?: string | null
          memory_category?: string | null
          notes?: string | null
          prediction_error_applied?: boolean | null
          prediction_error_content?: string | null
          profile_id?: string | null
          success_score?: number | null
          target_memory: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          intervention_type?: string | null
          lability_window_end?: string | null
          lability_window_start?: string | null
          memory_category?: string | null
          notes?: string | null
          prediction_error_applied?: boolean | null
          prediction_error_content?: string | null
          profile_id?: string | null
          success_score?: number | null
          target_memory?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_interventions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "memory_interventions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "memory_interventions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_target_campaigns: {
        Row: {
          campaign_name: string
          campaign_objective: string
          completed_at: string | null
          coordination_strategy: string | null
          created_at: string | null
          cross_target_effects: Json | null
          current_phase: string | null
          id: string
          is_active: boolean | null
          overall_progress: number | null
          per_target_tactics: Json | null
          started_at: string | null
          synergy_score: number | null
          target_profiles: string[] | null
          target_statuses: Json | null
          timing_config: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_name: string
          campaign_objective: string
          completed_at?: string | null
          coordination_strategy?: string | null
          created_at?: string | null
          cross_target_effects?: Json | null
          current_phase?: string | null
          id?: string
          is_active?: boolean | null
          overall_progress?: number | null
          per_target_tactics?: Json | null
          started_at?: string | null
          synergy_score?: number | null
          target_profiles?: string[] | null
          target_statuses?: Json | null
          timing_config?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_name?: string
          campaign_objective?: string
          completed_at?: string | null
          coordination_strategy?: string | null
          created_at?: string | null
          cross_target_effects?: Json | null
          current_phase?: string | null
          id?: string
          is_active?: boolean | null
          overall_progress?: number | null
          per_target_tactics?: Json | null
          started_at?: string | null
          synergy_score?: number | null
          target_profiles?: string[] | null
          target_statuses?: Json | null
          timing_config?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      narrative_campaigns: {
        Row: {
          amplification_config: Json | null
          campaign_name: string
          campaign_type: string
          completed_at: string | null
          content_strategy: Json | null
          counter_narratives: Json | null
          created_at: string
          current_reach: number | null
          deployment_channels: Json | null
          id: string
          sentiment_shift: number | null
          started_at: string | null
          status: string | null
          success_metrics: Json | null
          target_narrative: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amplification_config?: Json | null
          campaign_name: string
          campaign_type: string
          completed_at?: string | null
          content_strategy?: Json | null
          counter_narratives?: Json | null
          created_at?: string
          current_reach?: number | null
          deployment_channels?: Json | null
          id?: string
          sentiment_shift?: number | null
          started_at?: string | null
          status?: string | null
          success_metrics?: Json | null
          target_narrative?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amplification_config?: Json | null
          campaign_name?: string
          campaign_type?: string
          completed_at?: string | null
          content_strategy?: Json | null
          counter_narratives?: Json | null
          created_at?: string
          current_reach?: number | null
          deployment_channels?: Json | null
          id?: string
          sentiment_shift?: number | null
          started_at?: string | null
          status?: string | null
          success_metrics?: Json | null
          target_narrative?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      narrative_crystallization: {
        Row: {
          adherent_count: number | null
          counter_narrative_effectiveness: Json | null
          created_at: string | null
          crystallization_stage: string | null
          id: string
          mass_formation_id: string | null
          narrative: string
          totalitarian_potential: number | null
          user_id: string
          zealot_percentage: number | null
        }
        Insert: {
          adherent_count?: number | null
          counter_narrative_effectiveness?: Json | null
          created_at?: string | null
          crystallization_stage?: string | null
          id?: string
          mass_formation_id?: string | null
          narrative: string
          totalitarian_potential?: number | null
          user_id: string
          zealot_percentage?: number | null
        }
        Update: {
          adherent_count?: number | null
          counter_narrative_effectiveness?: Json | null
          created_at?: string | null
          crystallization_stage?: string | null
          id?: string
          mass_formation_id?: string | null
          narrative?: string
          totalitarian_potential?: number | null
          user_id?: string
          zealot_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "narrative_crystallization_mass_formation_id_fkey"
            columns: ["mass_formation_id"]
            isOneToOne: false
            referencedRelation: "mass_formation_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_identities: {
        Row: {
          created_at: string
          id: string
          life_narrative: Json | null
          narrative_gaps: Json | null
          narrative_momentum: number | null
          narrative_themes: Json | null
          profile_id: string | null
          protagonist_archetype: string | null
          reframe_opportunities: Json | null
          story_phase: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          life_narrative?: Json | null
          narrative_gaps?: Json | null
          narrative_momentum?: number | null
          narrative_themes?: Json | null
          profile_id?: string | null
          protagonist_archetype?: string | null
          reframe_opportunities?: Json | null
          story_phase?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          life_narrative?: Json | null
          narrative_gaps?: Json | null
          narrative_momentum?: number | null
          narrative_themes?: Json | null
          profile_id?: string | null
          protagonist_archetype?: string | null
          reframe_opportunities?: Json | null
          story_phase?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_identities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "narrative_identities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "narrative_identities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_nodes: {
        Row: {
          amplification_score: number | null
          authenticity_rating: number | null
          campaign_id: string | null
          connections: Json | null
          content: string | null
          created_at: string
          engagement_metrics: Json | null
          id: string
          is_active: boolean | null
          node_type: string
          persona_config: Json | null
          platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amplification_score?: number | null
          authenticity_rating?: number | null
          campaign_id?: string | null
          connections?: Json | null
          content?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          is_active?: boolean | null
          node_type: string
          persona_config?: Json | null
          platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amplification_score?: number | null
          authenticity_rating?: number | null
          campaign_id?: string | null
          connections?: Json | null
          content?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          is_active?: boolean | null
          node_type?: string
          persona_config?: Json | null
          platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_nodes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "narrative_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_simulations: {
        Row: {
          audience_segments: Json | null
          completed_at: string | null
          created_at: string
          dominant_narrative: string | null
          id: string
          iterations_run: number | null
          narratives: Json
          simulation_config: Json | null
          simulation_name: string
          simulation_results: Json | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          audience_segments?: Json | null
          completed_at?: string | null
          created_at?: string
          dominant_narrative?: string | null
          id?: string
          iterations_run?: number | null
          narratives?: Json
          simulation_config?: Json | null
          simulation_name: string
          simulation_results?: Json | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          audience_segments?: Json | null
          completed_at?: string | null
          created_at?: string
          dominant_narrative?: string | null
          id?: string
          iterations_run?: number | null
          narratives?: Json
          simulation_config?: Json | null
          simulation_name?: string
          simulation_results?: Json | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nudge_campaigns: {
        Row: {
          campaign_name: string
          conversion_rate: number | null
          created_at: string | null
          dark_patterns: Json | null
          id: string
          is_active: boolean | null
          nudge_config: Json | null
          nudge_type: string | null
          profile_id: string | null
          success_metrics: Json | null
          target_behavior: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_name: string
          conversion_rate?: number | null
          created_at?: string | null
          dark_patterns?: Json | null
          id?: string
          is_active?: boolean | null
          nudge_config?: Json | null
          nudge_type?: string | null
          profile_id?: string | null
          success_metrics?: Json | null
          target_behavior?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_name?: string
          conversion_rate?: number | null
          created_at?: string | null
          dark_patterns?: Json | null
          id?: string
          is_active?: boolean | null
          nudge_config?: Json | null
          nudge_type?: string | null
          profile_id?: string | null
          success_metrics?: Json | null
          target_behavior?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudge_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "nudge_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "nudge_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stockholm_syndrome_tracking: {
        Row: {
          bonding_score: number | null
          captor_identification_level: number | null
          created_at: string
          defender_behavior_instances: Json | null
          gratitude_for_kindness_events: Json | null
          id: string
          isolation_from_others: number | null
          kindness_cruelty_ratio: Json | null
          optimal_ratio_calculation: Json | null
          perceived_threat_level: number | null
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bonding_score?: number | null
          captor_identification_level?: number | null
          created_at?: string
          defender_behavior_instances?: Json | null
          gratitude_for_kindness_events?: Json | null
          id?: string
          isolation_from_others?: number | null
          kindness_cruelty_ratio?: Json | null
          optimal_ratio_calculation?: Json | null
          perceived_threat_level?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bonding_score?: number | null
          captor_identification_level?: number | null
          created_at?: string
          defender_behavior_instances?: Json | null
          gratitude_for_kindness_events?: Json | null
          id?: string
          isolation_from_others?: number | null
          kindness_cruelty_ratio?: Json | null
          optimal_ratio_calculation?: Json | null
          perceived_threat_level?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stockholm_syndrome_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stockholm_syndrome_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stockholm_syndrome_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
}
