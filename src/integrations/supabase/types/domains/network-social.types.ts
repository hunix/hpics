/**
 * Network Social Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json } from '../base';

/**
 * Tables in this domain: cross_references, entity_links, entity_mentions, hidden_connections, influence_actions, influence_campaigns, influence_cascades, influence_paths, influence_simulations, influence_strategies, knowledge_graph_edges, knowledge_graph_nodes, network_brokerage, network_operations, network_predictions, network_snapshots, relationship_goals, relationship_inferences, relationship_opportunities, relationship_scores, relationship_trends, resonance_connections, resonance_events, social_comments, social_connections, social_identity_links, social_likers, social_posts, social_scrape_jobs
 */
export interface NetworkSocialTables {
      cross_references: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          normalized_value: string | null
          profile_id: string | null
          reference_type: string
          reference_value: string
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          normalized_value?: string | null
          profile_id?: string | null
          reference_type: string
          reference_value: string
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          normalized_value?: string | null
          profile_id?: string | null
          reference_type?: string
          reference_value?: string
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_references_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_references_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_references_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_links: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          discovered_at: string | null
          evidence: Json | null
          id: string
          is_confirmed: boolean | null
          link_type: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          discovered_at?: string | null
          evidence?: Json | null
          id?: string
          is_confirmed?: boolean | null
          link_type: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          discovered_at?: string | null
          evidence?: Json | null
          id?: string
          is_confirmed?: boolean | null
          link_type?: string
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      entity_mentions: {
        Row: {
          confidence: number | null
          context: string | null
          created_at: string | null
          entity_name: string
          entity_type: string
          id: string
          mentioned_in_profile_id: string | null
          metadata: Json | null
          normalized_name: string | null
          sentiment: number | null
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          context?: string | null
          created_at?: string | null
          entity_name: string
          entity_type: string
          id?: string
          mentioned_in_profile_id?: string | null
          metadata?: Json | null
          normalized_name?: string | null
          sentiment?: number | null
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          context?: string | null
          created_at?: string | null
          entity_name?: string
          entity_type?: string
          id?: string
          mentioned_in_profile_id?: string | null
          metadata?: Json | null
          normalized_name?: string | null
          sentiment?: number | null
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_mentions_mentioned_in_profile_id_fkey"
            columns: ["mentioned_in_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "entity_mentions_mentioned_in_profile_id_fkey"
            columns: ["mentioned_in_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "entity_mentions_mentioned_in_profile_id_fkey"
            columns: ["mentioned_in_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_connections: {
        Row: {
          causal_link: boolean | null
          connection_type: string
          created_at: string | null
          discovery_method: string | null
          entity_a_id: string
          entity_a_type: string
          entity_b_id: string
          entity_b_type: string
          id: string
          significance_score: number | null
          user_id: string
          visibility_level: string | null
        }
        Insert: {
          causal_link?: boolean | null
          connection_type: string
          created_at?: string | null
          discovery_method?: string | null
          entity_a_id: string
          entity_a_type: string
          entity_b_id: string
          entity_b_type: string
          id?: string
          significance_score?: number | null
          user_id: string
          visibility_level?: string | null
        }
        Update: {
          causal_link?: boolean | null
          connection_type?: string
          created_at?: string | null
          discovery_method?: string | null
          entity_a_id?: string
          entity_a_type?: string
          entity_b_id?: string
          entity_b_type?: string
          id?: string
          significance_score?: number | null
          user_id?: string
          visibility_level?: string | null
        }
        Relationships: []
      }
      influence_actions: {
        Row: {
          action_description: string | null
          action_title: string
          action_type: string
          actual_channel: string | null
          completed_at: string | null
          created_at: string
          effectiveness_rating: number | null
          id: string
          notes: string | null
          optimal_window_end: string | null
          optimal_window_start: string | null
          outcome: string | null
          priority: string | null
          profile_id: string
          reminder_before_minutes: number | null
          response_received: string | null
          scheduled_for: string | null
          status: string | null
          strategy_id: string | null
          suggested_channel: string | null
          suggested_message: string | null
          talking_points: string[] | null
          things_to_avoid: string[] | null
          things_to_mention: string[] | null
          trigger_context: Json | null
          trigger_event: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_description?: string | null
          action_title: string
          action_type: string
          actual_channel?: string | null
          completed_at?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          optimal_window_end?: string | null
          optimal_window_start?: string | null
          outcome?: string | null
          priority?: string | null
          profile_id: string
          reminder_before_minutes?: number | null
          response_received?: string | null
          scheduled_for?: string | null
          status?: string | null
          strategy_id?: string | null
          suggested_channel?: string | null
          suggested_message?: string | null
          talking_points?: string[] | null
          things_to_avoid?: string[] | null
          things_to_mention?: string[] | null
          trigger_context?: Json | null
          trigger_event?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_description?: string | null
          action_title?: string
          action_type?: string
          actual_channel?: string | null
          completed_at?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          optimal_window_end?: string | null
          optimal_window_start?: string | null
          outcome?: string | null
          priority?: string | null
          profile_id?: string
          reminder_before_minutes?: number | null
          response_received?: string | null
          scheduled_for?: string | null
          status?: string | null
          strategy_id?: string | null
          suggested_channel?: string | null
          suggested_message?: string | null
          talking_points?: string[] | null
          things_to_avoid?: string[] | null
          things_to_mention?: string[] | null
          trigger_context?: Json | null
          trigger_event?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influence_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influence_actions_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "influence_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      influence_campaigns: {
        Row: {
          adaptation_history: Json | null
          completed_at: string | null
          compliance_achieved: boolean | null
          control_group: boolean | null
          created_at: string
          description: string | null
          executed_touches: Json | null
          id: string
          lessons_learned: string[] | null
          name: string
          next_touch_at: string | null
          objective: string
          optimal_windows: Json | null
          outcome_value: Json | null
          planned_touches: Json | null
          primary_principle: string | null
          principles_applied: string[] | null
          priority: number | null
          profile_id: string
          resistance_patterns: Json | null
          started_at: string | null
          status: string | null
          updated_at: string
          urgency_level: string | null
          user_id: string
          variant_id: string | null
        }
        Insert: {
          adaptation_history?: Json | null
          completed_at?: string | null
          compliance_achieved?: boolean | null
          control_group?: boolean | null
          created_at?: string
          description?: string | null
          executed_touches?: Json | null
          id?: string
          lessons_learned?: string[] | null
          name: string
          next_touch_at?: string | null
          objective: string
          optimal_windows?: Json | null
          outcome_value?: Json | null
          planned_touches?: Json | null
          primary_principle?: string | null
          principles_applied?: string[] | null
          priority?: number | null
          profile_id: string
          resistance_patterns?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          urgency_level?: string | null
          user_id: string
          variant_id?: string | null
        }
        Update: {
          adaptation_history?: Json | null
          completed_at?: string | null
          compliance_achieved?: boolean | null
          control_group?: boolean | null
          created_at?: string
          description?: string | null
          executed_touches?: Json | null
          id?: string
          lessons_learned?: string[] | null
          name?: string
          next_touch_at?: string | null
          objective?: string
          optimal_windows?: Json | null
          outcome_value?: Json | null
          planned_touches?: Json | null
          primary_principle?: string | null
          principles_applied?: string[] | null
          priority?: number | null
          profile_id?: string
          resistance_patterns?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          urgency_level?: string | null
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influence_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influence_cascades: {
        Row: {
          cascade_name: string
          cascade_type: string
          cascade_velocity: number | null
          completed_at: string | null
          created_at: string | null
          current_phase: string | null
          current_reach: number | null
          id: string
          infection_rate: number | null
          max_reach: number | null
          origin_profile_id: string | null
          predicted_peak_at: string | null
          propagation_model: string | null
          propagation_params: Json | null
          recovery_rate: number | null
          started_at: string | null
          target_profiles: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cascade_name: string
          cascade_type: string
          cascade_velocity?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          current_reach?: number | null
          id?: string
          infection_rate?: number | null
          max_reach?: number | null
          origin_profile_id?: string | null
          predicted_peak_at?: string | null
          propagation_model?: string | null
          propagation_params?: Json | null
          recovery_rate?: number | null
          started_at?: string | null
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cascade_name?: string
          cascade_type?: string
          cascade_velocity?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          current_reach?: number | null
          id?: string
          infection_rate?: number | null
          max_reach?: number | null
          origin_profile_id?: string | null
          predicted_peak_at?: string | null
          propagation_model?: string | null
          propagation_params?: Json | null
          recovery_rate?: number | null
          started_at?: string | null
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influence_cascades_origin_profile_id_fkey"
            columns: ["origin_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_cascades_origin_profile_id_fkey"
            columns: ["origin_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_cascades_origin_profile_id_fkey"
            columns: ["origin_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influence_paths: {
        Row: {
          bottleneck_nodes: Json | null
          calculated_at: string
          created_at: string
          id: string
          influence_strength: number | null
          path_nodes: Json
          path_type: string | null
          source_profile_id: string | null
          target_profile_id: string | null
          user_id: string
        }
        Insert: {
          bottleneck_nodes?: Json | null
          calculated_at?: string
          created_at?: string
          id?: string
          influence_strength?: number | null
          path_nodes?: Json
          path_type?: string | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          user_id: string
        }
        Update: {
          bottleneck_nodes?: Json | null
          calculated_at?: string
          created_at?: string
          id?: string
          influence_strength?: number | null
          path_nodes?: Json
          path_type?: string | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influence_paths_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_paths_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_paths_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influence_paths_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_paths_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_paths_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influence_simulations: {
        Row: {
          created_at: string | null
          id: string
          max_reach_achieved: number | null
          optimal_seeds_suggested: string[] | null
          parameters: Json | null
          propagation_model: string | null
          results: Json
          seed_profile_ids: string[]
          simulation_name: string | null
          simulation_steps: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_reach_achieved?: number | null
          optimal_seeds_suggested?: string[] | null
          parameters?: Json | null
          propagation_model?: string | null
          results?: Json
          seed_profile_ids: string[]
          simulation_name?: string | null
          simulation_steps?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_reach_achieved?: number | null
          optimal_seeds_suggested?: string[] | null
          parameters?: Json | null
          propagation_model?: string | null
          results?: Json
          seed_profile_ids?: string[]
          simulation_name?: string | null
          simulation_steps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      influence_strategies: {
        Row: {
          abort_signals: string[] | null
          ai_model_used: string | null
          closing_scripts: string[] | null
          context: string | null
          created_at: string
          duration_estimate: string | null
          emotional_hooks: string[] | null
          executed_at: string | null
          execution_steps: Json | null
          fallback_strategy: string | null
          follow_up_steps: Json | null
          goal_description: string | null
          goal_type: string
          id: string
          lessons_learned: Json | null
          methodologies_applied: string[] | null
          objection_handlers: Json | null
          opening_scripts: string[] | null
          optimal_timing: Json | null
          outcome: string | null
          outcome_rating: number | null
          preparation_steps: Json | null
          profile_id: string
          recovery_phrases: string[] | null
          risks: Json | null
          status: string | null
          strategy_name: string
          strategy_summary: string | null
          success_probability: number | null
          things_to_avoid: string[] | null
          things_to_mention: string[] | null
          transition_phrases: string[] | null
          updated_at: string
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          abort_signals?: string[] | null
          ai_model_used?: string | null
          closing_scripts?: string[] | null
          context?: string | null
          created_at?: string
          duration_estimate?: string | null
          emotional_hooks?: string[] | null
          executed_at?: string | null
          execution_steps?: Json | null
          fallback_strategy?: string | null
          follow_up_steps?: Json | null
          goal_description?: string | null
          goal_type: string
          id?: string
          lessons_learned?: Json | null
          methodologies_applied?: string[] | null
          objection_handlers?: Json | null
          opening_scripts?: string[] | null
          optimal_timing?: Json | null
          outcome?: string | null
          outcome_rating?: number | null
          preparation_steps?: Json | null
          profile_id: string
          recovery_phrases?: string[] | null
          risks?: Json | null
          status?: string | null
          strategy_name: string
          strategy_summary?: string | null
          success_probability?: number | null
          things_to_avoid?: string[] | null
          things_to_mention?: string[] | null
          transition_phrases?: string[] | null
          updated_at?: string
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          abort_signals?: string[] | null
          ai_model_used?: string | null
          closing_scripts?: string[] | null
          context?: string | null
          created_at?: string
          duration_estimate?: string | null
          emotional_hooks?: string[] | null
          executed_at?: string | null
          execution_steps?: Json | null
          fallback_strategy?: string | null
          follow_up_steps?: Json | null
          goal_description?: string | null
          goal_type?: string
          id?: string
          lessons_learned?: Json | null
          methodologies_applied?: string[] | null
          objection_handlers?: Json | null
          opening_scripts?: string[] | null
          optimal_timing?: Json | null
          outcome?: string | null
          outcome_rating?: number | null
          preparation_steps?: Json | null
          profile_id?: string
          recovery_phrases?: string[] | null
          risks?: Json | null
          status?: string | null
          strategy_name?: string
          strategy_summary?: string | null
          success_probability?: number | null
          things_to_avoid?: string[] | null
          things_to_mention?: string[] | null
          transition_phrases?: string[] | null
          updated_at?: string
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influence_strategies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_strategies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_strategies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph_edges: {
        Row: {
          created_at: string
          id: string
          properties: Json | null
          relationship_type: string
          semantic_similarity: number | null
          source_node_id: string | null
          target_node_id: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          properties?: Json | null
          relationship_type: string
          semantic_similarity?: number | null
          source_node_id?: string | null
          target_node_id?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          properties?: Json | null
          relationship_type?: string
          semantic_similarity?: number | null
          source_node_id?: string | null
          target_node_id?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_graph_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_graph_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph_nodes: {
        Row: {
          betweenness_score: number | null
          centrality_score: number | null
          community_id: number | null
          created_at: string
          embedding_vector: Json | null
          id: string
          node_label: string
          node_type: string
          pagerank_score: number | null
          properties: Json | null
          source_entity_id: string | null
          source_entity_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          betweenness_score?: number | null
          centrality_score?: number | null
          community_id?: number | null
          created_at?: string
          embedding_vector?: Json | null
          id?: string
          node_label: string
          node_type: string
          pagerank_score?: number | null
          properties?: Json | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          betweenness_score?: number | null
          centrality_score?: number | null
          community_id?: number | null
          created_at?: string
          embedding_vector?: Json | null
          id?: string
          node_label?: string
          node_type?: string
          pagerank_score?: number | null
          properties?: Json | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_brokerage: {
        Row: {
          betweenness_centrality: number | null
          bridge_opportunities: Json | null
          brokerage_score: number | null
          constraint_score: number | null
          created_at: string | null
          disconnected_clusters: Json | null
          id: string
          network_control_coefficient: number | null
          profile_id: string | null
          structural_holes_bridged: number | null
          tertius_gaudens_positions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          betweenness_centrality?: number | null
          bridge_opportunities?: Json | null
          brokerage_score?: number | null
          constraint_score?: number | null
          created_at?: string | null
          disconnected_clusters?: Json | null
          id?: string
          network_control_coefficient?: number | null
          profile_id?: string | null
          structural_holes_bridged?: number | null
          tertius_gaudens_positions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          betweenness_centrality?: number | null
          bridge_opportunities?: Json | null
          brokerage_score?: number | null
          constraint_score?: number | null
          created_at?: string | null
          disconnected_clusters?: Json | null
          id?: string
          network_control_coefficient?: number | null
          profile_id?: string | null
          structural_holes_bridged?: number | null
          tertius_gaudens_positions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_brokerage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "network_brokerage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "network_brokerage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      network_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_phase: string | null
          effectiveness_score: number | null
          id: string
          is_active: boolean | null
          network_after: Json | null
          network_before: Json | null
          objective: string
          operation_name: string
          operation_type: string
          phase_details: Json | null
          progress_metrics: Json | null
          started_at: string | null
          target_network: Json | null
          target_nodes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          network_after?: Json | null
          network_before?: Json | null
          objective: string
          operation_name: string
          operation_type: string
          phase_details?: Json | null
          progress_metrics?: Json | null
          started_at?: string | null
          target_network?: Json | null
          target_nodes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          network_after?: Json | null
          network_before?: Json | null
          objective?: string
          operation_name?: string
          operation_type?: string
          phase_details?: Json | null
          progress_metrics?: Json | null
          started_at?: string | null
          target_network?: Json | null
          target_nodes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      network_predictions: {
        Row: {
          accuracy_score: number | null
          actual_outcome: string | null
          confidence_score: number | null
          contributing_factors: Json | null
          created_at: string
          id: string
          model_version: string | null
          outcome_date: string | null
          predicted_date: string | null
          predicted_outcome: string | null
          prediction_type: string
          profile_id: string
          recommendations: Json | null
          risk_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          confidence_score?: number | null
          contributing_factors?: Json | null
          created_at?: string
          id?: string
          model_version?: string | null
          outcome_date?: string | null
          predicted_date?: string | null
          predicted_outcome?: string | null
          prediction_type: string
          profile_id: string
          recommendations?: Json | null
          risk_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          confidence_score?: number | null
          contributing_factors?: Json | null
          created_at?: string
          id?: string
          model_version?: string | null
          outcome_date?: string | null
          predicted_date?: string | null
          predicted_outcome?: string | null
          prediction_type?: string
          profile_id?: string
          recommendations?: Json | null
          risk_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_snapshots: {
        Row: {
          change_summary: Json | null
          community_structure: Json | null
          created_at: string | null
          graph_data: Json | null
          id: string
          metrics: Json
          snapshot_date: string
          snapshot_type: string | null
          user_id: string
        }
        Insert: {
          change_summary?: Json | null
          community_structure?: Json | null
          created_at?: string | null
          graph_data?: Json | null
          id?: string
          metrics?: Json
          snapshot_date: string
          snapshot_type?: string | null
          user_id: string
        }
        Update: {
          change_summary?: Json | null
          community_structure?: Json | null
          created_at?: string | null
          graph_data?: Json | null
          id?: string
          metrics?: Json
          snapshot_date?: string
          snapshot_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      relationship_goals: {
        Row: {
          created_at: string
          current_streak: number | null
          description: string | null
          frequency: string
          goal_type: string
          id: string
          is_active: boolean | null
          last_completed_at: string | null
          longest_streak: number | null
          next_due_at: string | null
          profile_id: string | null
          target_count: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          description?: string | null
          frequency: string
          goal_type: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          longest_streak?: number | null
          next_due_at?: string | null
          profile_id?: string | null
          target_count?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          description?: string | null
          frequency?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          longest_streak?: number | null
          next_due_at?: string | null
          profile_id?: string | null
          target_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_inferences: {
        Row: {
          confidence_score: number | null
          created_at: string
          evidence: Json | null
          id: string
          inference_type: string
          is_verified: boolean | null
          opportunity_score: number | null
          opportunity_type: string | null
          path_distance: number | null
          path_profiles: string[] | null
          relationship_strength: number | null
          source_profile_id: string
          target_profile_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          evidence?: Json | null
          id?: string
          inference_type: string
          is_verified?: boolean | null
          opportunity_score?: number | null
          opportunity_type?: string | null
          path_distance?: number | null
          path_profiles?: string[] | null
          relationship_strength?: number | null
          source_profile_id: string
          target_profile_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          evidence?: Json | null
          id?: string
          inference_type?: string
          is_verified?: boolean | null
          opportunity_score?: number | null
          opportunity_type?: string | null
          path_distance?: number | null
          path_profiles?: string[] | null
          relationship_strength?: number | null
          source_profile_id?: string
          target_profile_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationship_inferences_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_inferences_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_inferences_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_inferences_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_inferences_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_inferences_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_opportunities: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          opportunity_type: string
          optimal_timing: string | null
          priority: number | null
          profile_id: string
          status: string | null
          suggested_action: string | null
          suggested_methodology_id: string | null
          trigger_event: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          opportunity_type: string
          optimal_timing?: string | null
          priority?: number | null
          profile_id: string
          status?: string | null
          suggested_action?: string | null
          suggested_methodology_id?: string | null
          trigger_event?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          opportunity_type?: string
          optimal_timing?: string | null
          priority?: number | null
          profile_id?: string
          status?: string | null
          suggested_action?: string | null
          suggested_methodology_id?: string | null
          trigger_event?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_opportunities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_opportunities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_opportunities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_opportunities_suggested_methodology_id_fkey"
            columns: ["suggested_methodology_id"]
            isOneToOne: false
            referencedRelation: "intelligence_methodologies"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_scores: {
        Row: {
          created_at: string
          decay_rate: number | null
          diversity_score: number
          frequency_score: number
          id: string
          last_calculated_at: string
          overall_score: number
          profile_id: string
          recency_score: number
          sentiment_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decay_rate?: number | null
          diversity_score?: number
          frequency_score?: number
          id?: string
          last_calculated_at?: string
          overall_score?: number
          profile_id: string
          recency_score?: number
          sentiment_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decay_rate?: number | null
          diversity_score?: number
          frequency_score?: number
          id?: string
          last_calculated_at?: string
          overall_score?: number
          profile_id?: string
          recency_score?: number
          sentiment_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_trends: {
        Row: {
          communication_count: number | null
          created_at: string
          health_score: number
          id: string
          profile_id: string
          recorded_at: string
          sentiment_avg: number | null
          user_id: string
        }
        Insert: {
          communication_count?: number | null
          created_at?: string
          health_score: number
          id?: string
          profile_id: string
          recorded_at?: string
          sentiment_avg?: number | null
          user_id: string
        }
        Update: {
          communication_count?: number | null
          created_at?: string
          health_score?: number
          id?: string
          profile_id?: string
          recorded_at?: string
          sentiment_avg?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_trends_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_trends_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_trends_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resonance_connections: {
        Row: {
          activation_triggers: Json | null
          bidirectional: boolean | null
          connection_strength: number | null
          created_at: string | null
          id: string
          last_activation_at: string | null
          resonance_type: string | null
          source_profile_id: string | null
          target_profile_id: string | null
          user_id: string
          without_communication: boolean | null
        }
        Insert: {
          activation_triggers?: Json | null
          bidirectional?: boolean | null
          connection_strength?: number | null
          created_at?: string | null
          id?: string
          last_activation_at?: string | null
          resonance_type?: string | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          user_id: string
          without_communication?: boolean | null
        }
        Update: {
          activation_triggers?: Json | null
          bidirectional?: boolean | null
          connection_strength?: number | null
          created_at?: string | null
          id?: string
          last_activation_at?: string | null
          resonance_type?: string | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          user_id?: string
          without_communication?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "resonance_connections_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "resonance_connections_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "resonance_connections_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resonance_connections_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "resonance_connections_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "resonance_connections_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resonance_events: {
        Row: {
          detected_at: string | null
          event_type: string
          id: string
          morphic_field_id: string | null
          source_profile_id: string | null
          target_profile_id: string | null
          transmission_strength: number | null
          user_id: string
          without_direct_contact: boolean | null
        }
        Insert: {
          detected_at?: string | null
          event_type: string
          id?: string
          morphic_field_id?: string | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          transmission_strength?: number | null
          user_id: string
          without_direct_contact?: boolean | null
        }
        Update: {
          detected_at?: string | null
          event_type?: string
          id?: string
          morphic_field_id?: string | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          transmission_strength?: number | null
          user_id?: string
          without_direct_contact?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "resonance_events_morphic_field_id_fkey"
            columns: ["morphic_field_id"]
            isOneToOne: false
            referencedRelation: "morphic_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resonance_events_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "resonance_events_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "resonance_events_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resonance_events_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "resonance_events_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "resonance_events_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_comments: {
        Row: {
          author_avatar_url: string | null
          author_display_name: string | null
          author_profile_url: string | null
          author_username: string | null
          comment_id: string | null
          commented_at: string | null
          content: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          likes_count: number | null
          platform: string
          post_id: string | null
          replied_to_id: string | null
          replies_count: number | null
          scraped_at: string | null
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_display_name?: string | null
          author_profile_url?: string | null
          author_username?: string | null
          comment_id?: string | null
          commented_at?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          likes_count?: number | null
          platform: string
          post_id?: string | null
          replied_to_id?: string | null
          replies_count?: number | null
          scraped_at?: string | null
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          author_avatar_url?: string | null
          author_display_name?: string | null
          author_profile_url?: string | null
          author_username?: string | null
          comment_id?: string | null
          commented_at?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          likes_count?: number | null
          platform?: string
          post_id?: string | null
          replied_to_id?: string | null
          replies_count?: number | null
          scraped_at?: string | null
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_replied_to_id_fkey"
            columns: ["replied_to_id"]
            isOneToOne: false
            referencedRelation: "social_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          connected_avatar_url: string | null
          connected_bio: string | null
          connected_display_name: string | null
          connected_followers_count: number | null
          connected_profile_url: string | null
          connected_user_id: string | null
          connected_username: string
          connected_verified: boolean | null
          connection_type: string
          created_at: string | null
          first_seen_at: string | null
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          platform: string
          profile_id: string | null
          relationship_strength: number | null
          scraped_at: string | null
          user_id: string
        }
        Insert: {
          connected_avatar_url?: string | null
          connected_bio?: string | null
          connected_display_name?: string | null
          connected_followers_count?: number | null
          connected_profile_url?: string | null
          connected_user_id?: string | null
          connected_username: string
          connected_verified?: boolean | null
          connection_type: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          platform: string
          profile_id?: string | null
          relationship_strength?: number | null
          scraped_at?: string | null
          user_id: string
        }
        Update: {
          connected_avatar_url?: string | null
          connected_bio?: string | null
          connected_display_name?: string | null
          connected_followers_count?: number | null
          connected_profile_url?: string | null
          connected_user_id?: string | null
          connected_username?: string
          connected_verified?: boolean | null
          connection_type?: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          platform?: string
          profile_id?: string | null
          relationship_strength?: number | null
          scraped_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_identity_links: {
        Row: {
          capture_ids: string[]
          confidence_score: number | null
          confirmed_at: string | null
          created_at: string | null
          id: string
          is_confirmed: boolean | null
          match_reasons: Json | null
          platforms: string[]
          primary_profile_id: string | null
          updated_at: string | null
          user_id: string
          usernames: Json | null
        }
        Insert: {
          capture_ids: string[]
          confidence_score?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          match_reasons?: Json | null
          platforms: string[]
          primary_profile_id?: string | null
          updated_at?: string | null
          user_id: string
          usernames?: Json | null
        }
        Update: {
          capture_ids?: string[]
          confidence_score?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          match_reasons?: Json | null
          platforms?: string[]
          primary_profile_id?: string | null
          updated_at?: string | null
          user_id?: string
          usernames?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "social_identity_links_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_identity_links_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_identity_links_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_likers: {
        Row: {
          created_at: string | null
          id: string
          liked_at: string | null
          liker_avatar_url: string | null
          liker_display_name: string | null
          liker_profile_url: string | null
          liker_user_id: string | null
          liker_username: string
          liker_verified: boolean | null
          post_id: string | null
          scraped_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          liked_at?: string | null
          liker_avatar_url?: string | null
          liker_display_name?: string | null
          liker_profile_url?: string | null
          liker_user_id?: string | null
          liker_username: string
          liker_verified?: boolean | null
          post_id?: string | null
          scraped_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          liked_at?: string | null
          liker_avatar_url?: string | null
          liker_display_name?: string | null
          liker_profile_url?: string | null
          liker_user_id?: string | null
          liker_username?: string
          liker_verified?: boolean | null
          post_id?: string | null
          scraped_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_likers_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          caption: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          engagement_rate: number | null
          hashtags: string[] | null
          id: string
          is_pinned: boolean | null
          is_sponsored: boolean | null
          likes_count: number | null
          location: string | null
          media_type: string | null
          media_urls: Json | null
          mentions: string[] | null
          platform: string
          post_id: string
          post_url: string | null
          posted_at: string | null
          profile_id: string | null
          raw_data: Json | null
          saves_count: number | null
          scraped_at: string | null
          sentiment_score: number | null
          shares_count: number | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_type?: string | null
          media_urls?: Json | null
          mentions?: string[] | null
          platform: string
          post_id: string
          post_url?: string | null
          posted_at?: string | null
          profile_id?: string | null
          raw_data?: Json | null
          saves_count?: number | null
          scraped_at?: string | null
          sentiment_score?: number | null
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_type?: string | null
          media_urls?: Json | null
          mentions?: string[] | null
          platform?: string
          post_id?: string
          post_url?: string | null
          posted_at?: string | null
          profile_id?: string | null
          raw_data?: Json | null
          saves_count?: number | null
          scraped_at?: string | null
          sentiment_score?: number | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_scrape_jobs: {
        Row: {
          completed_at: string | null
          cost_cents: number | null
          created_at: string | null
          error_message: string | null
          id: string
          is_recurring: boolean | null
          items_scraped: number | null
          items_total: number | null
          last_cursor: string | null
          platform: string
          profile_id: string | null
          provider: string | null
          raw_response: Json | null
          recurrence_interval: string | null
          scheduled_for: string | null
          scrape_type: string
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_recurring?: boolean | null
          items_scraped?: number | null
          items_total?: number | null
          last_cursor?: string | null
          platform: string
          profile_id?: string | null
          provider?: string | null
          raw_response?: Json | null
          recurrence_interval?: string | null
          scheduled_for?: string | null
          scrape_type: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_recurring?: boolean | null
          items_scraped?: number | null
          items_total?: number | null
          last_cursor?: string | null
          platform?: string
          profile_id?: string | null
          provider?: string | null
          raw_response?: Json | null
          recurrence_interval?: string | null
          scheduled_for?: string | null
          scrape_type?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_scrape_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_scrape_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_scrape_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
}
