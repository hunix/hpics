/**
 * Edge Function Router Adapter (v4.0.0)
 * 
 * Transparent adapter that maps legacy function names to consolidated domain routers.
 * This enables zero-downtime migration from 407 standalone functions to ~12 routers.
 * 
 * @module lib/api/edgeFunctionRouter
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Route definition mapping a legacy function name to a domain router.
 */
interface RouterRoute {
  /** The consolidated router function name */
  router: string;
  /** The path within the router */
  path: string;
}

/**
 * Complete mapping of legacy function names to new router endpoints.
 * Functions not listed here will fall back to direct invocation.
 */
const ROUTE_MAP: Record<string, RouterRoute> = {
  // ═══════════════════════════════════════════
  // ANALYSIS ROUTER (~50 functions)
  // ═══════════════════════════════════════════
  'mice-recruitment-analyzer': { router: 'analysis-router', path: '/mice' },
  'behavioral-dna-sequencer': { router: 'analysis-router', path: '/behavioral-dna' },
  'attachment-vulnerability-analyzer': { router: 'analysis-router', path: '/attachment' },
  'enhanced-deception-detector': { router: 'analysis-router', path: '/deception' },
  'dark-tetrad-profiler': { router: 'analysis-router', path: '/dark-tetrad' },
  'analyze-influence-profile': { router: 'analysis-router', path: '/influence-profile' },
  'coercion-resistance-assessor': { router: 'analysis-router', path: '/coercion' },
  'existential-leverage-calculator': { router: 'analysis-router', path: '/existential' },
  'manipulation-vulnerability-assessment': { router: 'analysis-router', path: '/manipulation' },
  'phobia-exploitation-engine': { router: 'analysis-router', path: '/phobia' },
  'analyze-behavioral': { router: 'analysis-router', path: '/behavioral' },
  'analyze-communication-patterns': { router: 'analysis-router', path: '/communication-patterns' },
  'analyze-conversation-deep': { router: 'analysis-router', path: '/conversation-deep' },
  'analyze-conversation': { router: 'analysis-router', path: '/conversation' },
  'analyze-profile': { router: 'analysis-router', path: '/profile' },
  'deep-psychological-analysis': { router: 'analysis-router', path: '/deep-psychological' },
  'analyze-linguistic-patterns': { router: 'analysis-router', path: '/linguistic-patterns' },
  'analyze-email-insights': { router: 'analysis-router', path: '/email-insights' },
  'analyze-romantic-intelligence': { router: 'analysis-router', path: '/romantic' },
  'analyze-methodology-effectiveness': { router: 'analysis-router', path: '/methodology' },
  'personality-dna-extractor': { router: 'analysis-router', path: '/personality-dna' },
  'behavioral-economics-engine': { router: 'analysis-router', path: '/behavioral-economics' },
  'behavioral-fingerprint-engine': { router: 'analysis-router', path: '/behavioral-fingerprint' },
  'behavioral-future-modeler': { router: 'analysis-router', path: '/behavioral-future' },
  'behavioral-baseline-monitor': { router: 'analysis-router', path: '/behavioral-baseline' },
  'betrayal-likelihood-scorer': { router: 'analysis-router', path: '/betrayal-likelihood' },
  'breaking-point-calculator': { router: 'analysis-router', path: '/breaking-point' },
  'choice-architecture-optimizer': { router: 'analysis-router', path: '/choice-architecture' },
  'chronotype-analyzer': { router: 'analysis-router', path: '/chronotype' },
  'conditioning-orchestrator': { router: 'analysis-router', path: '/conditioning' },
  'elicitation-engine': { router: 'analysis-router', path: '/elicitation' },
  'emotional-contagion-modeler': { router: 'analysis-router', path: '/emotional-contagion' },
  'emotional-trajectory-analyzer': { router: 'analysis-router', path: '/emotional-trajectory' },
  'epistemic-vulnerability-scanner': { router: 'analysis-router', path: '/epistemic' },
  'forensic-statement-analyzer': { router: 'analysis-router', path: '/forensic-statement' },
  'gottman-relationship-analyzer': { router: 'analysis-router', path: '/gottman' },
  'family-systems-analyzer': { router: 'analysis-router', path: '/family-systems' },
  'family-protection-analyzer': { router: 'analysis-router', path: '/family-protection' },
  'hyperpersonalization-engine': { router: 'analysis-router', path: '/hyperpersonalization' },
  'insider-threat-matrix-engine': { router: 'analysis-router', path: '/insider-threat' },
  'kallisti-theory-of-mind': { router: 'analysis-router', path: '/theory-of-mind' },
  'karmic-pattern-calculator': { router: 'analysis-router', path: '/karmic-pattern' },
  'nlp-hypnotic-patterns': { router: 'analysis-router', path: '/nlp-hypnotic' },
  'pattern-of-life-engine': { router: 'analysis-router', path: '/pattern-of-life' },
  'relationship-half-life-calculator': { router: 'analysis-router', path: '/relationship-half-life' },
  'sacred-values-mapper': { router: 'analysis-router', path: '/sacred-values' },
  'sacred-value-predictor': { router: 'analysis-router', path: '/sacred-value-predictor' },
  'social-engineering-detector': { router: 'analysis-router', path: '/social-engineering' },

  // ═══════════════════════════════════════════
  // INTELLIGENCE ROUTER (~45 functions)
  // ═══════════════════════════════════════════
  'generate-dossier': { router: 'intelligence-router', path: '/dossier' },
  'generate-intelligence-dossier': { router: 'intelligence-router', path: '/intelligence-dossier' },
  'generate-executive-summary': { router: 'intelligence-router', path: '/executive-summary' },
  'aggregate-media-intelligence': { router: 'intelligence-router', path: '/aggregate-media' },
  'aggregate-voice-intelligence': { router: 'intelligence-router', path: '/aggregate-voice' },
  'aggregate-contact-intelligence': { router: 'intelligence-router', path: '/aggregate-contact' },
  'aggregate-social-intelligence': { router: 'intelligence-router', path: '/aggregate-social' },
  'aggregate-bulk-results': { router: 'intelligence-router', path: '/aggregate-bulk' },
  'deep-intelligence-engine': { router: 'intelligence-router', path: '/deep-engine' },
  'intelligence-session-runner': { router: 'intelligence-router', path: '/session-runner' },
  'mosaic-intelligence-fuser': { router: 'intelligence-router', path: '/mosaic-fuser' },
  'cross-modal-synthesis': { router: 'intelligence-router', path: '/cross-modal' },
  'cross-modal-synthesis-v2': { router: 'intelligence-router', path: '/cross-modal-v2' },
  'cross-reference-analysis': { router: 'intelligence-router', path: '/cross-reference' },
  'cross-contact-correlation': { router: 'intelligence-router', path: '/cross-contact' },
  'cross-domain-correlator': { router: 'intelligence-router', path: '/cross-domain' },
  'deep-correlation-mapper': { router: 'intelligence-router', path: '/deep-correlation' },
  'detect-cross-patterns': { router: 'intelligence-router', path: '/cross-patterns' },
  'detect-cross-contact-patterns': { router: 'intelligence-router', path: '/cross-contact-patterns' },
  'detect-anomalies': { router: 'intelligence-router', path: '/anomalies' },
  'detect-communication-anomalies': { router: 'intelligence-router', path: '/communication-anomalies' },
  'detect-interests': { router: 'intelligence-router', path: '/interests' },
  'detect-life-milestones': { router: 'intelligence-router', path: '/life-milestones' },
  'detect-relationship-lifecycle': { router: 'intelligence-router', path: '/relationship-lifecycle' },
  'detect-influence-opportunities': { router: 'intelligence-router', path: '/influence-opportunities' },
  'generate-proactive-insights': { router: 'intelligence-router', path: '/proactive-insights' },
  'insight-prioritizer': { router: 'intelligence-router', path: '/insight-prioritizer' },
  'save-ai-insight': { router: 'intelligence-router', path: '/save-insight' },
  'comprehensive-contact-scan': { router: 'intelligence-router', path: '/comprehensive-scan' },
  'analysis-orchestrator': { router: 'intelligence-router', path: '/orchestrator' },
  'action-intelligence-engine': { router: 'intelligence-router', path: '/action-intelligence' },
  'action-recommendation-engine': { router: 'intelligence-router', path: '/action-recommendation' },
  'contact-ai-agent': { router: 'intelligence-router', path: '/ai-agent' },
  'contact-ai-agent-v2': { router: 'intelligence-router', path: '/ai-agent-v2' },
  'contact-news-correlator': { router: 'intelligence-router', path: '/news-correlator' },
  'infer-relationships': { router: 'intelligence-router', path: '/infer-relationships' },
  'infer-social-context': { router: 'intelligence-router', path: '/infer-social-context' },
  'suggest-followups': { router: 'intelligence-router', path: '/suggest-followups' },
  'suggest-gifts': { router: 'intelligence-router', path: '/suggest-gifts' },
  'suggest-introductions': { router: 'intelligence-router', path: '/suggest-introductions' },
  'suggest-meeting-time': { router: 'intelligence-router', path: '/suggest-meeting-time' },
  'suggest-missing-data': { router: 'intelligence-router', path: '/suggest-missing-data' },
  'suggest-network-growth': { router: 'intelligence-router', path: '/suggest-network-growth' },
  'suggest-outreach-timing': { router: 'intelligence-router', path: '/suggest-outreach-timing' },
  'suggest-contact-groups': { router: 'intelligence-router', path: '/suggest-groups' },

  // ═══════════════════════════════════════════
  // PREDICTION ROUTER (~25 functions)
  // ═══════════════════════════════════════════
  'churn-prediction-engine': { router: 'prediction-router', path: '/churn' },
  'predict-churn': { router: 'prediction-router', path: '/predict-churn' },
  'predict-churn-enhanced': { router: 'prediction-router', path: '/predict-churn-enhanced' },
  'predict-behavioral-scenarios': { router: 'prediction-router', path: '/behavioral-scenarios' },
  'predict-relationship-trajectory': { router: 'prediction-router', path: '/relationship-trajectory' },
  'predict-contact-needs': { router: 'prediction-router', path: '/contact-needs' },
  'predict-contact-preferences': { router: 'prediction-router', path: '/contact-preferences' },
  'predict-context': { router: 'prediction-router', path: '/context' },
  'predict-risks': { router: 'prediction-router', path: '/risks' },
  'life-sequence-predictor': { router: 'prediction-router', path: '/life-sequence' },
  'fortune-trajectory-engine': { router: 'prediction-router', path: '/fortune-trajectory' },
  'cascade-predictor': { router: 'prediction-router', path: '/cascade' },
  'cascade-virality-predictor': { router: 'prediction-router', path: '/cascade-virality' },
  'collective-behavior-predictor': { router: 'prediction-router', path: '/collective-behavior' },
  'bayesian-intent-network': { router: 'prediction-router', path: '/bayesian-intent' },
  'bayesian-intention-predictor': { router: 'prediction-router', path: '/bayesian-intention' },
  'mdp-behavior-predictor': { router: 'prediction-router', path: '/mdp-behavior' },
  'precognitive-pattern-engine': { router: 'prediction-router', path: '/precognitive' },
  'prediction-calibration-engine': { router: 'prediction-router', path: '/calibration' },
  'predictive-doctrine-engine': { router: 'prediction-router', path: '/doctrine' },
  'predictive-opportunity-scanner': { router: 'prediction-router', path: '/opportunity' },
  'predictive-trajectory-engine': { router: 'prediction-router', path: '/trajectory' },
  'psychoagent-cascade-predictor': { router: 'prediction-router', path: '/psychoagent-cascade' },
  'investment-opportunity-predictor': { router: 'prediction-router', path: '/investment' },
  'future-timeline-engine': { router: 'prediction-router', path: '/future-timeline' },

  // ═══════════════════════════════════════════
  // WARFARE ROUTER (~25 functions)
  // ═══════════════════════════════════════════
  'cognitive-warfare-engine': { router: 'warfare-router', path: '/cognitive' },
  'cognitive-warfare-planner': { router: 'warfare-router', path: '/cognitive-planner' },
  'cognitive-iw-detector': { router: 'warfare-router', path: '/cognitive-iw' },
  'cognitive-effect-orchestrator': { router: 'warfare-router', path: '/cognitive-effect' },
  'cognitive-defense-simulator': { router: 'warfare-router', path: '/cognitive-defense' },
  'memetic-propagation-engine': { router: 'warfare-router', path: '/memetic' },
  'narrative-control-engine': { router: 'warfare-router', path: '/narrative' },
  'semantic-warfare-engine': { router: 'warfare-router', path: '/semantic' },
  'identity-destabilization-engine': { router: 'warfare-router', path: '/identity-destabilization' },
  'cult-tactics-engine': { router: 'warfare-router', path: '/cult-tactics' },
  'draco-deception-orchestrator': { router: 'warfare-router', path: '/draco-deception' },
  'reflexive-control-detector': { router: 'warfare-router', path: '/reflexive-control' },
  'influence-campaign-optimizer': { router: 'warfare-router', path: '/influence-campaign' },
  'influence-orchestrator-v2': { router: 'warfare-router', path: '/influence-orchestrator' },
  'influence-propagation-engine': { router: 'warfare-router', path: '/influence-propagation' },
  'computational-persuasion-engine': { router: 'warfare-router', path: '/computational-persuasion' },
  'counter-narrative-generator': { router: 'warfare-router', path: '/counter-narrative' },
  'counter-intelligence-monitor': { router: 'warfare-router', path: '/counter-intelligence' },
  'subliminal-messaging-engine': { router: 'warfare-router', path: '/subliminal' },
  'mass-formation-analyzer': { router: 'warfare-router', path: '/mass-formation' },
  'memory-reconsolidation-engine': { router: 'warfare-router', path: '/memory-reconsolidation' },
  'memory-anchor-generator': { router: 'warfare-router', path: '/memory-anchor' },
  'premem-belief-modifier': { router: 'warfare-router', path: '/premem-belief' },
  'proportional-response-engine': { router: 'warfare-router', path: '/proportional-response' },
  'reputation-defense-engine': { router: 'warfare-router', path: '/reputation-defense' },

  // ═══════════════════════════════════════════
  // BIOMETRIC ROUTER (~30 functions)
  // ═══════════════════════════════════════════
  'extract-facial-biometrics': { router: 'biometric-router', path: '/face-extract' },
  'extract-facial-multiview': { router: 'biometric-router', path: '/face-multiview' },
  'extract-voice-biometrics': { router: 'biometric-router', path: '/voice-extract' },
  'extract-voice-advanced': { router: 'biometric-router', path: '/voice-advanced' },
  'extract-body-biometrics': { router: 'biometric-router', path: '/body-extract' },
  'extract-handwriting-biometrics': { router: 'biometric-router', path: '/handwriting' },
  'extract-signature-biometrics': { router: 'biometric-router', path: '/signature' },
  'analyze-facial': { router: 'biometric-router', path: '/analyze-facial' },
  'analyze-vocal': { router: 'biometric-router', path: '/analyze-vocal' },
  'analyze-body-language': { router: 'biometric-router', path: '/body-language' },
  'analyze-gait-pattern': { router: 'biometric-router', path: '/gait' },
  'keystroke-dynamics-analyzer': { router: 'biometric-router', path: '/keystroke' },
  'match-biometrics': { router: 'biometric-router', path: '/match' },
  'mosaic-biometric-match': { router: 'biometric-router', path: '/mosaic-match' },
  'cross-identify-biometrics': { router: 'biometric-router', path: '/cross-identify' },
  'local-biometric-match': { router: 'biometric-router', path: '/local-match' },
  'biometric-behavioral-fusion': { router: 'biometric-router', path: '/behavioral-fusion' },
  'gated-biological-fusion': { router: 'biometric-router', path: '/gated-fusion' },
  'gaze-pattern-analyzer': { router: 'biometric-router', path: '/gaze' },
  'pupillometry-analyzer': { router: 'biometric-router', path: '/pupillometry' },
  'microexpression-analyzer': { router: 'biometric-router', path: '/microexpression' },
  'micro-expression-timeline': { router: 'biometric-router', path: '/microexpression-timeline' },
  'generate-facial-embedding': { router: 'biometric-router', path: '/facial-embedding' },
  'enroll-from-tagged-faces': { router: 'biometric-router', path: '/enroll-faces' },
  'execute-face-scan-job': { router: 'biometric-router', path: '/face-scan-job' },
  'process-face-regions': { router: 'biometric-router', path: '/face-regions' },
  'realtime-face-recognition': { router: 'biometric-router', path: '/realtime-face' },
  'learn-biometric-patterns': { router: 'biometric-router', path: '/learn-patterns' },
  'deepfake-analyzer': { router: 'biometric-router', path: '/deepfake' },
  'subvocalization-detector': { router: 'biometric-router', path: '/subvocalization' },

  // ═══════════════════════════════════════════
  // NETWORK ROUTER (~20 functions)
  // ═══════════════════════════════════════════
  'analyze-network-graph': { router: 'network-router', path: '/graph' },
  'analyze-network-deep': { router: 'network-router', path: '/deep' },
  'analyze-network-intelligence': { router: 'network-router', path: '/intelligence' },
  'analyze-community-class': { router: 'network-router', path: '/community' },
  'power-network-analyzer': { router: 'network-router', path: '/power' },
  'network-exploitation-mapper': { router: 'network-router', path: '/exploitation' },
  'network-resilience-analyzer': { router: 'network-router', path: '/resilience' },
  'network-brokerage-analyzer': { router: 'network-router', path: '/brokerage' },
  'network-cascade-modeler': { router: 'network-router', path: '/cascade' },
  'network-influence-propagation': { router: 'network-router', path: '/influence-propagation' },
  'social-graph-predictor': { router: 'network-router', path: '/social-graph' },
  'detect-shadow-networks': { router: 'network-router', path: '/shadow-networks' },
  'shadow-network-analyzer': { router: 'network-router', path: '/shadow-analyzer' },
  'ctdg-link-predictor': { router: 'network-router', path: '/link-predictor' },
  'sheaf-neural-influence-mapper': { router: 'network-router', path: '/sheaf-influence' },
  'calculate-relationship-scores': { router: 'network-router', path: '/relationship-scores' },
  'link-social-identities': { router: 'network-router', path: '/link-identities' },

  // ═══════════════════════════════════════════
  // ENRICHMENT ROUTER (~15 functions)
  // ═══════════════════════════════════════════
  'auto-enrich-contact': { router: 'enrichment-router', path: '/auto-enrich' },
  'enrich-contact': { router: 'enrichment-router', path: '/enrich' },
  'enrich-hunter': { router: 'enrichment-router', path: '/hunter' },
  'enrich-pdl': { router: 'enrichment-router', path: '/pdl' },
  'enrichment-orchestrator': { router: 'enrichment-router', path: '/orchestrator' },
  'osint-scan': { router: 'enrichment-router', path: '/osint' },
  'deep-osint-scan': { router: 'enrichment-router', path: '/deep-osint' },
  'digital-footprint-scanner': { router: 'enrichment-router', path: '/digital-footprint' },
  'scrape-comprehensive-social': { router: 'enrichment-router', path: '/social-comprehensive' },
  'scrape-social-profile': { router: 'enrichment-router', path: '/social-profile' },
  'scrape-social-rapidapi': { router: 'enrichment-router', path: '/social-rapidapi' },
  'scrape-linkedin-proxycurl': { router: 'enrichment-router', path: '/linkedin' },
  'scrape-instagram-deep': { router: 'enrichment-router', path: '/instagram' },
  'scrape-threads-deep': { router: 'enrichment-router', path: '/threads' },
  'monitor-web-mentions': { router: 'enrichment-router', path: '/web-mentions' },
  'extract-company-branding': { router: 'enrichment-router', path: '/company-branding' },
  'extract-diffbot': { router: 'enrichment-router', path: '/diffbot' },

  // ═══════════════════════════════════════════
  // FUSION ROUTER (~20 functions)
  // ═══════════════════════════════════════════
  'dempster-shafer-fusion': { router: 'fusion-router', path: '/dempster-shafer' },
  'entity-resolution-engine': { router: 'fusion-router', path: '/entity-resolution' },
  'sentiment-cascade-predictor': { router: 'fusion-router', path: '/sentiment-cascade' },
  'graph-rag-engine': { router: 'fusion-router', path: '/graph-rag' },
  'digital-twin-generator': { router: 'fusion-router', path: '/digital-twin' },
  'behavioral-digital-twin': { router: 'fusion-router', path: '/behavioral-twin' },
  'counterfactual-engine': { router: 'fusion-router', path: '/counterfactual' },
  'attention-multimodal-fuser': { router: 'fusion-router', path: '/multimodal-fuser' },
  'cross-modal-fusion-realtime': { router: 'fusion-router', path: '/cross-modal-realtime' },
  'cross-modal-deception-engine': { router: 'fusion-router', path: '/cross-modal-deception' },
  'cross-modal-deception-v2': { router: 'fusion-router', path: '/cross-modal-deception-v2' },
  'cross-modal-correlator': { router: 'fusion-router', path: '/cross-modal-correlator' },
  'geospatial-communication-fusion': { router: 'fusion-router', path: '/geospatial' },
  'hardware-intelligence-fusion': { router: 'fusion-router', path: '/hardware-fusion' },
  'financial-document-synthesis': { router: 'fusion-router', path: '/financial-synthesis' },
  'sop-distillation-engine': { router: 'fusion-router', path: '/sop-distillation' },

  // ═══════════════════════════════════════════
  // AGIS ROUTER (~30 functions)
  // ═══════════════════════════════════════════
  'agis-api': { router: 'agis-router', path: '/api' },
  'agis-cascade-orchestrator': { router: 'agis-router', path: '/cascade' },
  'genesis-engine': { router: 'agis-router', path: '/genesis' },
  'omniscient-orchestrator': { router: 'agis-router', path: '/omniscient' },
  'cosmic-supremacy-engine': { router: 'agis-router', path: '/cosmic' },
  'quantum-cognition-engine': { router: 'agis-router', path: '/quantum-cognition' },
  'quantum-decision-modeler': { router: 'agis-router', path: '/quantum-decision' },
  'morphic-resonance-detector': { router: 'agis-router', path: '/morphic-resonance' },
  'omega-point-tracker': { router: 'agis-router', path: '/omega-point' },
  'akashic-query-engine': { router: 'agis-router', path: '/akashic' },
  'autonomous-intelligence-orchestrator': { router: 'agis-router', path: '/autonomous-orchestrator' },
  'autonomous-campaign-executor': { router: 'agis-router', path: '/campaign-executor' },
  'campaign-evolution-engine': { router: 'agis-router', path: '/campaign-evolution' },
  'dependency-orchestrator': { router: 'agis-router', path: '/dependency' },
  'reality-consensus-engine': { router: 'agis-router', path: '/reality-consensus' },
  'collective-unconscious-miner': { router: 'agis-router', path: '/collective-unconscious' },
  'egregore-cultivation-engine': { router: 'agis-router', path: '/egregore' },
  'psychic-resonance-mapper': { router: 'agis-router', path: '/psychic-resonance' },
  'memory-crystallization-engine': { router: 'agis-router', path: '/memory-crystallization' },
  'sentient-intent-analyzer': { router: 'agis-router', path: '/sentient-intent' },
  'geospatial-supremacy-engine': { router: 'agis-router', path: '/geospatial-supremacy' },
  'hypergame-solver': { router: 'agis-router', path: '/hypergame-solver' },
  'hypergame-theory-engine': { router: 'agis-router', path: '/hypergame-theory' },
  'iio-attribution-engine': { router: 'agis-router', path: '/iio-attribution' },

  // ═══════════════════════════════════════════
  // UTILITY ROUTER (~20 functions)
  // ═══════════════════════════════════════════
  'health-check': { router: 'utility-router', path: '/health' },
  'encrypt-field': { router: 'utility-router', path: '/encrypt' },
  'decrypt-field': { router: 'utility-router', path: '/decrypt' },
  'rotate-encryption-keys': { router: 'utility-router', path: '/rotate-keys' },
  'crypto-shred': { router: 'utility-router', path: '/crypto-shred' },
  'log-audit-event': { router: 'utility-router', path: '/audit-log' },
  'send-intelligence-alert': { router: 'utility-router', path: '/alert' },
  'alert-service': { router: 'utility-router', path: '/alert-service' },
  'process-alert-rules': { router: 'utility-router', path: '/alert-rules' },
  'send-reminders': { router: 'utility-router', path: '/reminders' },
  'process-influence-reminders': { router: 'utility-router', path: '/influence-reminders' },
  'send-push-notification': { router: 'utility-router', path: '/push-notification' },
  'generate-scheduled-reports': { router: 'utility-router', path: '/scheduled-reports' },
  'generate-weekly-summary': { router: 'utility-router', path: '/weekly-summary' },
  'generate-briefing': { router: 'utility-router', path: '/briefing' },
  'generate-meeting-prep': { router: 'utility-router', path: '/meeting-prep' },
  'generate-meeting-followup': { router: 'utility-router', path: '/meeting-followup' },
  'generate-message-templates': { router: 'utility-router', path: '/message-templates' },
  'generate-outreach-draft': { router: 'utility-router', path: '/outreach-draft' },
  'generate-gift-suggestions': { router: 'utility-router', path: '/gift-suggestions' },
  'generate-playbook': { router: 'utility-router', path: '/playbook' },
  'generate-influence-strategy': { router: 'utility-router', path: '/influence-strategy' },
  'check-budget-alerts': { router: 'utility-router', path: '/budget-alerts' },
  'detect-cost-anomalies': { router: 'utility-router', path: '/cost-anomalies' },
  'execute-data-retention': { router: 'utility-router', path: '/data-retention' },
  'notify-analysis': { router: 'utility-router', path: '/notify-analysis' },
  'save-integration-secret': { router: 'utility-router', path: '/save-secret' },
  'check-secrets': { router: 'utility-router', path: '/check-secrets' },
  'summarize-conversation': { router: 'utility-router', path: '/summarize' },
  'send-email': { router: 'utility-router', path: '/send-email' },

  // ═══════════════════════════════════════════
  // HARDWARE ROUTER (~15 functions)
  // ═══════════════════════════════════════════
  'hardware-gateway': { router: 'hardware-router', path: '/gateway' },
  'aerial-intelligence': { router: 'hardware-router', path: '/aerial' },
  'sdr-intelligence': { router: 'hardware-router', path: '/sdr' },
  'gopro-intelligence': { router: 'hardware-router', path: '/gopro' },
  'sensor-network': { router: 'hardware-router', path: '/sensor' },
  'rf-signal-intelligence': { router: 'hardware-router', path: '/rf-signal' },
  'mobile-sensor-intelligence': { router: 'hardware-router', path: '/mobile-sensor' },
  'process-device-capture': { router: 'hardware-router', path: '/device-capture' },
  'device-sync-orchestrator': { router: 'hardware-router', path: '/device-sync' },
  'generate-hardware-report': { router: 'hardware-router', path: '/report' },
  'process-nfc-tap': { router: 'hardware-router', path: '/nfc-tap' },
  'correlate-location-contacts': { router: 'hardware-router', path: '/location-correlate' },

  // ═══════════════════════════════════════════
  // VOICE ROUTER (~12 functions)
  // ═══════════════════════════════════════════
  'process-voice-recording': { router: 'voice-router', path: '/recording' },
  'process-voice-analysis-runner': { router: 'voice-router', path: '/analysis-runner' },
  'process-voice-batch': { router: 'voice-router', path: '/batch' },
  'analyze-voice-comprehensive': { router: 'voice-router', path: '/comprehensive' },
  'linguistic-deception-analyzer': { router: 'voice-router', path: '/deception' },
  'linguistic-stress-detector': { router: 'voice-router', path: '/stress' },
  'stylometric-analyzer': { router: 'voice-router', path: '/stylometric' },
  'stylometric-fingerprinter': { router: 'voice-router', path: '/fingerprinter' },
  'audio-burst-analyzer': { router: 'voice-router', path: '/audio-burst' },
  'multi-party-deception-detector': { router: 'voice-router', path: '/multi-party-deception' },
  'multimodal-deception-analyzer': { router: 'voice-router', path: '/multimodal-deception' },

  // ═══════════════════════════════════════════
  // DOCUMENT ROUTER (~10 functions)
  // ═══════════════════════════════════════════
  'analyze-document-comprehensive': { router: 'document-router', path: '/comprehensive' },
  'process-document-batch': { router: 'document-router', path: '/batch' },
  'process-document-embeddings': { router: 'document-router', path: '/embeddings' },
  'search-documents': { router: 'document-router', path: '/search' },
  'parse-identity-document': { router: 'document-router', path: '/identity' },
  'parse-screenshot-profile': { router: 'document-router', path: '/screenshot' },
  'entity-extraction': { router: 'document-router', path: '/entity-extraction' },
  'generate-embeddings': { router: 'document-router', path: '/generate-embeddings' },
  'generate-embeddings-v2': { router: 'document-router', path: '/generate-embeddings-v2' },
  'auto-embed-content': { router: 'document-router', path: '/auto-embed' },
  'rag-query': { router: 'document-router', path: '/rag-query' },
  'rag-query-v2': { router: 'document-router', path: '/rag-query-v2' },
  'rag-query-v3': { router: 'document-router', path: '/rag-query-v3' },

  // ═══════════════════════════════════════════
  // SECURITY ROUTER (~10 functions)
  // ═══════════════════════════════════════════
  'assess-threat': { router: 'security-router', path: '/threat' },
  'assess-trust': { router: 'security-router', path: '/trust' },
  'security-monitor': { router: 'security-router', path: '/monitor' },
  'security-threat-analyzer': { router: 'security-router', path: '/threat-analyzer' },
  'opsec-vulnerability-analyzer': { router: 'security-router', path: '/opsec' },
  'active-defense-orchestrator': { router: 'security-router', path: '/active-defense' },
  'adversary-profiler': { router: 'security-router', path: '/adversary' },
  'automated-red-team-engine': { router: 'security-router', path: '/red-team' },
  'red-team-adversary-simulator': { router: 'security-router', path: '/adversary-simulator' },
  'lawfare-defense-analyzer': { router: 'security-router', path: '/lawfare' },
  'semafor-forgery-detector': { router: 'security-router', path: '/forgery' },
  'dark-web-monitor': { router: 'security-router', path: '/dark-web' },
  'dark2clear-deanonymization': { router: 'security-router', path: '/deanonymization' },
  'crisis-response-orchestrator': { router: 'security-router', path: '/crisis-response' },
};

/**
 * Invoke an edge function by its legacy name.
 * Automatically routes to the correct domain router if migrated,
 * or falls back to direct invocation for unmigrated functions.
 * 
 * @param functionName - Legacy function name (e.g. 'mice-recruitment-analyzer')
 * @param body - Request body
 * @param options - Additional options
 * @returns Function response
 */
export async function invokeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown> = {},
  options: { signal?: AbortSignal } = {}
): Promise<{ data: T | null; error: Error | null }> {
  const route = ROUTE_MAP[functionName];

  if (route) {
    // Route through consolidated domain router
    try {
      const { data, error } = await supabase.functions.invoke(route.router, {
        body: {
          ...body,
          _route: route.path,
        },
        ...(options.signal ? {} : {}),
      });

      if (error) {
        return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
      }

      return { data: data as T, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // Fallback: direct invocation for unmigrated functions (legacy cleanup complete)
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });

    if (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }

    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Check if a function has been migrated to a domain router.
 */
export function isMigratedFunction(functionName: string): boolean {
  return functionName in ROUTE_MAP;
}

/**
 * Get the router name for a given legacy function name.
 */
export function getRouterName(functionName: string): string | null {
  return ROUTE_MAP[functionName]?.router ?? null;
}

/**
 * Get all function names mapped to a specific router.
 */
export function getFunctionsByRouter(routerName: string): string[] {
  return Object.entries(ROUTE_MAP)
    .filter(([, route]) => route.router === routerName)
    .map(([name]) => name);
}

/**
 * Get all unique router names.
 */
export function getRouterNames(): string[] {
  return [...new Set(Object.values(ROUTE_MAP).map(r => r.router))];
}
