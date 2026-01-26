/**
 * Digital Twin Library Index
 * 
 * Centralized exports for cognitive digital twin simulation.
 */

export {
  // Core Digital Twin Types
  type DigitalTwin,
  type TwinType,
  type CognitiveModel,
  type ProcessingStyle,
  type CognitiveBias,
  type BiasType,
  type MentalModel,
  type BeliefNetwork,
  type Belief,
  type Contradiction,
  type BeliefUpdate,
  
  // Behavioral Patterns
  type BehavioralPattern,
  type PatternType,
  type PatternTrigger,
  type PatternResponse,
  
  // Emotional System
  type EmotionalBaseline,
  type EmotionalTrigger,
  type EmotionType,
  type RegulationStrategy,
  type RegulationType,
  type EmotionalState,
  
  // Decision Framework
  type DecisionFramework,
  type DecisionStyle,
  type Value,
  type DecisionHeuristic,
  type DecisionBias,
  
  // Social Model
  type SocialModel,
  type AttachmentStyle,
  type SocialNeed,
  type RelationshipPattern,
  type InfluenceProfile,
  type SocialIdentity,
  type GroupBehavior,
  
  // Physical Model
  type PhysicalModel,
  type CircadianPattern,
  type StressProfile,
  type HealthFactor,
  type PhysicalState,
  
  // Memory System
  type MemorySystem,
  type WorkingMemory,
  type MemoryItem,
  type EpisodicMemory,
  type SemanticKnowledge,
  type ProceduralSkill,
  type AutobiographicalMemory,
  type LifePeriod,
  type FormativeExperience,
  
  // Simulation
  type SimulationState,
  type SimulationScenario,
  type ScenarioCondition,
  type SimulationStep,
  type SimulatedResponse,
  type StateChange,
  type SimulationPrediction,
  type ValidationResult,
  type TwinAccuracy,
  
  // HDTwin Simulator
  HDTwinSimulator,
  
  // DeepPersona Generator
  type DeepPersona,
  type PersonaAttribute,
  type BackstoryElement,
  type PersonalityProfile,
  type SocialPresence,
  type PlatformPresence,
  type ConsistencyMetrics,
  generateDeepPersona
} from './hdtwinSimulator';
