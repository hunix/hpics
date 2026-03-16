/**
 * HoC Gateway (v1.0.0)
 * 
 * External API gateway for HoC Republic (OpenClaw) agents.
 * Exposes all 400+ HPICS capabilities as a single authenticated endpoint.
 * 
 * Auth: Bearer token = HOC_API_KEY (shared secret, not JWT)
 * 
 * Endpoints:
 *   POST { "tool": "<name>", "params": {...} }       → execute tool
 *   POST { "action": "list-tools" }                   → tool catalog
 *   POST { "action": "list-categories" }              → category list
 *   POST { "action": "health" }                       → gateway health
 *   GET  ?healthCheck=1                               → quick health
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ───────────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Rate Limiter (in-memory, per edge-function instance) ───────────────────
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_RPM = 60;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_RPM) return false;
    entry.count++;
    return true;
  }
  rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
  return true;
}

// ─── ROUTE MAP (server-side mirror of edgeFunctionRouter.ts) ────────────────
interface Route { router: string; path: string; }

const ROUTE_MAP: Record<string, Route> = {
  // ANALYSIS (~50+)
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
  'trauma-exploitation-engine': { router: 'analysis-router', path: '/trauma' },
  'thermal-stress-detector': { router: 'analysis-router', path: '/thermal-stress' },
  'vulnerability-window-detector': { router: 'analysis-router', path: '/vulnerability-window' },
  'coercive-control-detector': { router: 'analysis-router', path: '/coercive-control' },
  'deep-analyze-capture': { router: 'analysis-router', path: '/deep-capture' },
  'train-behavior-model': { router: 'analysis-router', path: '/train-behavior' },

  // INTELLIGENCE (~45+)
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
  'intelligence-tribunal-engine': { router: 'intelligence-router', path: '/tribunal' },
  'calendar-pattern-analyzer': { router: 'intelligence-router', path: '/calendar-pattern' },
  'deep-research-agent': { router: 'intelligence-router', path: '/deep-research' },
  'historical-analytics': { router: 'intelligence-router', path: '/historical-analytics' },
  'validate-observation': { router: 'intelligence-router', path: '/validate-observation' },
  'batch-intelligence-init': { router: 'intelligence-router', path: '/batch-init' },
  'process-bulk-queue': { router: 'intelligence-router', path: '/bulk-queue' },
  'process-bulk-session-runner': { router: 'intelligence-router', path: '/bulk-session-runner' },
  'process-bulk-upload': { router: 'intelligence-router', path: '/bulk-upload' },
  'process-scheduled-intelligence': { router: 'intelligence-router', path: '/scheduled-intelligence' },
  'economic-intelligence-engine': { router: 'intelligence-router', path: '/economic-intelligence' },
  'financial-intelligence-scan': { router: 'intelligence-router', path: '/financial-scan' },
  'ai-chat-query': { router: 'intelligence-router', path: '/ai-chat' },

  // PREDICTION (~25+)
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
  'trajectory-intercept-engine': { router: 'prediction-router', path: '/trajectory-intercept' },
  'generate-churn-intervention': { router: 'prediction-router', path: '/churn-intervention' },

  // WARFARE (~25+)
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
  'synthetic-consensus-generator': { router: 'warfare-router', path: '/synthetic-consensus' },
  'synthetic-memory-generator': { router: 'warfare-router', path: '/synthetic-memory' },
  'tactical-negotiation-engine': { router: 'warfare-router', path: '/tactical-negotiation' },
  'warfare-verification-chamber': { router: 'warfare-router', path: '/verification-chamber' },
  'economic-warfare-detector': { router: 'warfare-router', path: '/economic-warfare' },

  // BIOMETRIC (~30)
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
  'migration5-biometric-tracker': { router: 'biometric-router', path: '/migration5' },

  // NETWORK (~20)
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
  'tas-com-community-detector': { router: 'network-router', path: '/community-detector' },
  'track-community-evolution': { router: 'network-router', path: '/community-evolution' },

  // ENRICHMENT (~15+)
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
  'perplexity-search': { router: 'enrichment-router', path: '/perplexity' },
  'search-news': { router: 'enrichment-router', path: '/search-news' },
  'search-tavily': { router: 'enrichment-router', path: '/search-tavily' },
  'process-enrichment-queue': { router: 'enrichment-router', path: '/enrichment-queue' },
  'chrome-extension-deep-scrape': { router: 'enrichment-router', path: '/chrome-deep-scrape' },

  // FUSION (~20)
  'dempster-shafer-fusion': { router: 'fusion-router', path: '/dempster-shafer' },
  'entity-resolution-engine': { router: 'fusion-router', path: '/entity-resolution' },
  'sentiment-cascade-predictor': { router: 'fusion-router', path: '/sentiment-cascade' },
  'graph-rag-engine': { router: 'fusion-router', path: '/graph-rag' },
  'digital-twin-generator': { router: 'fusion-router', path: '/digital-twin' },
  'digital-twin-simulator': { router: 'fusion-router', path: '/digital-twin-simulator' },
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
  'temporal-fusion-transformer': { router: 'fusion-router', path: '/temporal-fusion' },
  'unified-data-fusion': { router: 'fusion-router', path: '/unified-data' },

  // AGIS (~30)
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
  'synchronicity-engine': { router: 'agis-router', path: '/synchronicity' },
  'transcendent-analysis': { router: 'agis-router', path: '/transcendent' },

  // UTILITY (~40+)
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
  'differential-sync-engine': { router: 'utility-router', path: '/differential-sync' },
  'trigger-escalation': { router: 'utility-router', path: '/escalation' },
  'trigger-push-notifications': { router: 'utility-router', path: '/trigger-push' },
  'trigger-webhook': { router: 'utility-router', path: '/trigger-webhook' },
  'update-app-version': { router: 'utility-router', path: '/app-version' },
  'process-whatsapp-zip': { router: 'utility-router', path: '/whatsapp-zip' },
  'relink-email-threads': { router: 'utility-router', path: '/relink-emails' },
  'match-emails-to-contacts': { router: 'utility-router', path: '/match-emails' },
  'sync-gmail-emails': { router: 'utility-router', path: '/sync-gmail' },
  'sync-google-calendar': { router: 'utility-router', path: '/sync-google-calendar' },
  'sync-outlook-calendar': { router: 'utility-router', path: '/sync-outlook-calendar' },
  'sync-outlook-emails': { router: 'utility-router', path: '/sync-outlook-emails' },
  'sync-location-history': { router: 'utility-router', path: '/sync-location' },
  'sync-wearable-data': { router: 'utility-router', path: '/sync-wearable' },
  'import-gmail-contacts': { router: 'utility-router', path: '/import-gmail-contacts' },
  'import-mbox-emails': { router: 'utility-router', path: '/import-mbox' },
  'import-outlook-contacts': { router: 'utility-router', path: '/import-outlook-contacts' },
  'import-pst-emails': { router: 'utility-router', path: '/import-pst' },
  'auto-sync-calendars': { router: 'utility-router', path: '/auto-sync-calendars' },
  'gmail-oauth': { router: 'utility-router', path: '/gmail-oauth' },
  'google-calendar-oauth': { router: 'utility-router', path: '/google-calendar-oauth' },
  'outlook-oauth': { router: 'utility-router', path: '/outlook-oauth' },
  'whatsapp-send': { router: 'utility-router', path: '/whatsapp-send' },
  'whatsapp-webhook': { router: 'utility-router', path: '/whatsapp-webhook' },
  'chrome-extension-bridge': { router: 'utility-router', path: '/chrome-bridge' },

  // HARDWARE (~15)
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
  'thermal-intelligence': { router: 'hardware-router', path: '/thermal' },
  'tscm-intelligence': { router: 'hardware-router', path: '/tscm' },
  'tscm-sweep-analyzer': { router: 'hardware-router', path: '/tscm-sweep' },

  // VOICE (~12)
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
  'voice-stress-correlator': { router: 'voice-router', path: '/stress-correlator' },
  'transcribe-audio': { router: 'voice-router', path: '/transcribe-audio' },
  'transcribe-voice-note': { router: 'voice-router', path: '/transcribe-voice-note' },

  // DOCUMENT (~12)
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
  'universal-embedding-processor': { router: 'document-router', path: '/universal-embedding' },

  // SECURITY (~14)
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
  'threat-actor-profiler': { router: 'security-router', path: '/threat-actor' },
  'zero-day-anomaly-detector': { router: 'security-router', path: '/zero-day-anomaly' },

  // MEDIA (~6)
  'generate-media-metadata-mosaic': { router: 'media-router', path: '/metadata-mosaic' },
  'generate-media-metadata': { router: 'media-router', path: '/metadata' },
  'analyze-media-deep': { router: 'media-router', path: '/deep' },
  'analyze-communication-triangulation': { router: 'media-router', path: '/triangulation' },
  'detect-shared-experiences': { router: 'media-router', path: '/shared-experiences' },
  'affective-manipulation-detector': { router: 'media-router', path: '/affective-manipulation' },

  // WORKFLOWS (autonomous multi-step)
  'agent-workflow': { router: 'agent-workflow', path: '/' },
  'workflow-full-intelligence': { router: 'agent-workflow', path: '/' },
  'workflow-generate-dossier': { router: 'agent-workflow', path: '/' },
  'workflow-track-contact': { router: 'agent-workflow', path: '/' },
  'workflow-counter-intel': { router: 'agent-workflow', path: '/' },
  'workflow-quick-profile': { router: 'agent-workflow', path: '/' },

  // TIER 2: ADVANCED REASONING (2026 research-based)
  'agentic-rag': { router: 'agentic-rag', path: '/' },
  'graph-reasoning': { router: 'graph-reasoning', path: '/' },
  'intelligence-verification': { router: 'intelligence-verification', path: '/' },
  'workflow-verified-dossier': { router: 'agent-workflow', path: '/' },
  'workflow-deep-research': { router: 'agent-workflow', path: '/' },
  'workflow-adversarial-assessment': { router: 'agent-workflow', path: '/' },
};

// ─── Category Catalog ───────────────────────────────────────────────────────
const CATEGORIES: Record<string, { description: string; router: string }> = {
  analysis: { description: '50+ behavioral, psychological, and pattern analysis engines', router: 'analysis-router' },
  intelligence: { description: '55+ intelligence gathering, aggregation, correlation, and recommendation engines', router: 'intelligence-router' },
  prediction: { description: '27+ predictive modeling, trajectory forecasting, and scenario simulation engines', router: 'prediction-router' },
  warfare: { description: '30+ cognitive warfare, influence operations, and narrative control engines', router: 'warfare-router' },
  biometric: { description: '31+ facial, voice, gait, keystroke, and multimodal biometric processors', router: 'biometric-router' },
  network: { description: '19+ social graph, community detection, and network topology analyzers', router: 'network-router' },
  enrichment: { description: '22+ OSINT, social scraping, and data enrichment pipelines', router: 'enrichment-router' },
  fusion: { description: '19+ multi-source data fusion, digital twin, and cross-modal correlation engines', router: 'fusion-router' },
  agis: { description: '26+ autonomous general intelligence, quantum cognition, and orchestration engines', router: 'agis-router' },
  utility: { description: '53+ encryption, alerting, reporting, sync, import/export, and communication tools', router: 'utility-router' },
  hardware: { description: '15+ drone, SDR, sensor, NFC, thermal, and TSCM hardware integration tools', router: 'hardware-router' },
  voice: { description: '14+ voice recording, transcription, deception detection, and stylometric analysis tools', router: 'voice-router' },
  document: { description: '14+ document analysis, embedding, RAG query, and entity extraction tools', router: 'document-router' },
  security: { description: '16+ threat assessment, red teaming, OPSEC, and crisis response tools', router: 'security-router' },
  media: { description: '6+ media metadata, triangulation, and affective analysis tools', router: 'media-router' },
  workflows: { description: '8 autonomous multi-step workflow commands (full-intelligence, dossier, track, counter-intel, quick-profile, verified-dossier, deep-research, adversarial-assessment)', router: 'agent-workflow' },
  reasoning: { description: '3 advanced reasoning engines: agentic RAG (iterative retrieval), graph-of-thought (parallel hypothesis exploration), intelligence verification (constitutional AI + red team)', router: 'graph-reasoning' },
};

function buildToolCatalog() {
  const result: Record<string, { description: string; tools: string[] }> = {};
  for (const [cat, meta] of Object.entries(CATEGORIES)) {
    const tools = Object.entries(ROUTE_MAP)
      .filter(([, r]) => r.router === meta.router)
      .map(([name]) => name);
    result[cat] = { description: meta.description, tools };
  }
  return result;
}

// ─── Supabase Client ────────────────────────────────────────────────────────
function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, serviceKey);
}

// ─── Audit Logger ───────────────────────────────────────────────────────────
async function logAudit(
  supabase: ReturnType<typeof createClient>,
  tool: string,
  userId: string | null,
  durationMs: number,
  success: boolean,
  error?: string
) {
  try {
    await supabase.from('audit_logs').insert({
      event_type: 'hoc_gateway_call',
      event_source: 'hoc-gateway',
      details: { tool, userId, durationMs, success, error },
      user_id: userId,
    });
  } catch (e) {
    console.error('[hoc-gateway] audit log failed:', e);
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Quick health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return json({ ok: true, function: 'hoc-gateway', timestamp: Date.now() });
  }

  // ── Auth: validate API key (legacy HOC_API_KEY or hpics_api_clients) ──
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  let authenticatedClientId: string | null = null;
  let authenticatedUserId: string | null = null;
  let clientRateLimit = RATE_LIMIT_RPM;

  const HOC_API_KEY = Deno.env.get('HOC_API_KEY');
  
  if (token && token === HOC_API_KEY) {
    // Legacy single-key auth
    authenticatedClientId = 'legacy-hoc';
  } else if (token) {
    // Check against hpics_api_clients table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Hash the incoming token and look it up
    const hashData = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
    const tokenHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const { data: client } = await adminClient
      .from('hpics_api_clients')
      .select('id, user_id, rate_limit_rpm, is_active')
      .eq('api_key_hash', tokenHash)
      .eq('is_active', true)
      .single();

    if (client) {
      authenticatedClientId = client.id;
      authenticatedUserId = client.user_id;
      clientRateLimit = client.rate_limit_rpm || RATE_LIMIT_RPM;

      // Update last_used_at and total_requests (fire-and-forget)
      adminClient
        .from('hpics_api_clients')
        .update({ last_used_at: new Date().toISOString(), total_requests: (client as any).total_requests + 1 })
        .eq('id', client.id)
        .then(() => {});
    }
  }

  if (!authenticatedClientId) {
    return json({ success: false, error: 'Invalid or missing API key' }, 401);
  }

  // ── Rate limit ──
  const rateLimitKey = authenticatedClientId;
  if (!checkRateLimit(rateLimitKey)) {
    return json({ success: false, error: `Rate limit exceeded (${clientRateLimit} req/min)` }, 429);
  }

  // ── Parse body ──
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const action = body.action as string | undefined;
  const tool = body.tool as string | undefined;
  const params = (body.params || {}) as Record<string, unknown>;
  const supabase = getSupabaseClient();

  // ── Action: list-tools ──
  if (action === 'list-tools') {
    const catalog = buildToolCatalog();
    const totalTools = Object.values(catalog).reduce((sum, cat) => sum + cat.tools.length, 0);
    return json({
      success: true,
      data: { categories: catalog, totalTools },
      meta: { gateway: 'hoc-gateway', version: '1.0.0' },
    });
  }

  // ── Action: list-categories ──
  if (action === 'list-categories') {
    const summary = Object.fromEntries(
      Object.entries(CATEGORIES).map(([cat, meta]) => [
        cat,
        {
          description: meta.description,
          toolCount: Object.values(ROUTE_MAP).filter(r => r.router === meta.router).length,
        },
      ])
    );
    return json({ success: true, data: summary });
  }

  // ── Action: health ──
  if (action === 'health') {
    const routerNames = [...new Set(Object.values(CATEGORIES).map(c => c.router))];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const checks = await Promise.allSettled(
      routerNames.map(async (router) => {
        const resp = await fetch(`${supabaseUrl}/functions/v1/${router}?healthCheck=1`, {
          headers: { Authorization: `Bearer ${serviceKey}` },
        });
        return { router, ok: resp.ok, status: resp.status };
      })
    );

    const results = checks.map((c, i) => {
      if (c.status === 'fulfilled') return c.value;
      return { router: routerNames[i], ok: false, error: 'unreachable' };
    });

    return json({
      success: true,
      data: {
        gateway: { ok: true, timestamp: Date.now() },
        routers: results,
      },
    });
  }

  // ── Action: resolve-contact ──
  if (action === 'resolve-contact') {
    const query = params.query as string || body.query as string;
    const userId = (params.userId || params.user_id || body.userId || body.user_id) as string;
    if (!query || !userId) return json({ success: false, error: 'Missing query or userId' }, 400);

    // Forward to agent-workflow function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/agent-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ action: 'resolve-contact', query, userId }),
    });
    const data = await resp.json();
    return json(data, resp.status);
  }

  // ── Action: list-workflows ──
  if (action === 'list-workflows') {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/agent-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ action: 'list-workflows' }),
    });
    const data = await resp.json();
    return json(data, resp.status);
  }

  // ── Action: run-workflow ──
  if (action === 'run-workflow') {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/agent-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    return json(data, resp.status);
  }

  // ── Tool execution ──
  if (!tool) {
    return json({
      success: false,
      error: 'Missing "tool" or "action" field. Use { "tool": "<name>", "params": {...} } or { "action": "list-tools" }',
    }, 400);
  }

  const route = ROUTE_MAP[tool];
  if (!route) {
    return json({
      success: false,
      error: `Unknown tool: "${tool}". Use { "action": "list-tools" } to see available tools.`,
    }, 404);
  }

  const start = performance.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const timeoutMs = (params.timeout_ms as number) || 120_000;

    // Prepare body for domain router
    const routerBody = {
      ...params,
      _route: route.path,
      userId: params.userId || params.user_id || null,
      profileId: params.profileId || params.profile_id || null,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const resp = await fetch(`${supabaseUrl}/functions/v1/${route.router}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(routerBody),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const durationMs = Math.round(performance.now() - start);

    let data: unknown;
    try {
      data = await resp.json();
    } catch {
      data = await resp.text();
    }

    const success = resp.ok;

    // Fire-and-forget audit log
    logAudit(supabase, tool, routerBody.userId as string, durationMs, success);

    // Fire-and-forget usage log for tracked clients
    if (authenticatedClientId && authenticatedClientId !== 'legacy-hoc' && authenticatedUserId) {
      const adminUrl = Deno.env.get('SUPABASE_URL')!;
      const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(adminUrl, adminKey);
      adminClient.from('api_usage_logs').insert({
        client_id: authenticatedClientId,
        user_id: authenticatedUserId,
        tool_called: tool,
        status_code: resp.status,
        response_time_ms: durationMs,
      }).then(() => {});
    }

    return json({
      success,
      data: success ? data : undefined,
      error: !success ? (typeof data === 'object' && data !== null && 'error' in (data as Record<string, unknown>)) ? (data as Record<string, unknown>).error : data : undefined,
      meta: {
        tool,
        router: route.router,
        path: route.path,
        duration_ms: durationMs,
        status: resp.status,
      },
    }, success ? 200 : resp.status);
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isTimeout = message.includes('abort');

    logAudit(supabase, tool, params.userId as string || null, durationMs, false, message);

    return json({
      success: false,
      error: isTimeout ? `Tool execution timed out after ${(params.timeout_ms || 120000)}ms` : message,
      meta: { tool, router: route.router, path: route.path, duration_ms: durationMs },
    }, isTimeout ? 504 : 500);
  }
});
