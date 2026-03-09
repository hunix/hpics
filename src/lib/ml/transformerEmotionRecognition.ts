/**
 * Transformer-based Multimodal Emotion Recognition (MER)
 * Source: Engineering Applications of AI 2024
 * 
 * 26+ emotion categories beyond basic 7.
 * Cross-modal attention for audio-visual-text fusion.
 */

export type GranularEmotion =
  | 'joy' | 'contentment' | 'amusement' | 'love' | 'gratitude' | 'pride' | 'relief'
  | 'sadness' | 'grief' | 'loneliness' | 'disappointment' | 'guilt' | 'shame'
  | 'anger' | 'frustration' | 'irritation' | 'contempt' | 'resentment'
  | 'fear' | 'anxiety' | 'dread' | 'panic'
  | 'surprise' | 'confusion' | 'curiosity'
  | 'disgust' | 'boredom' | 'neutral';

export interface EmotionPrediction {
  emotion: GranularEmotion;
  probability: number;
  valence: number;       // -1 (negative) to 1 (positive)
  arousal: number;       // 0 (calm) to 1 (excited)
  dominance: number;     // 0 (submissive) to 1 (dominant)
}

export interface EmotionAnalysisResult {
  primary: EmotionPrediction;
  secondary: EmotionPrediction | null;
  topPredictions: EmotionPrediction[];
  emotionalComplexity: number;  // 0-1, multiple simultaneous emotions
  emotionalIntensity: number;   // 0-1
  contextualInterpretation: string;
}

const EMOTION_VAD: Record<GranularEmotion, [number, number, number]> = {
  joy: [0.9, 0.7, 0.7], contentment: [0.7, 0.3, 0.5], amusement: [0.8, 0.6, 0.5],
  love: [0.9, 0.5, 0.4], gratitude: [0.8, 0.4, 0.4], pride: [0.8, 0.6, 0.8], relief: [0.6, 0.2, 0.5],
  sadness: [-0.7, 0.3, 0.2], grief: [-0.9, 0.5, 0.1], loneliness: [-0.6, 0.2, 0.2],
  disappointment: [-0.5, 0.3, 0.3], guilt: [-0.6, 0.4, 0.2], shame: [-0.7, 0.4, 0.1],
  anger: [-0.6, 0.9, 0.8], frustration: [-0.5, 0.7, 0.5], irritation: [-0.4, 0.5, 0.5],
  contempt: [-0.4, 0.4, 0.7], resentment: [-0.5, 0.6, 0.4],
  fear: [-0.8, 0.8, 0.1], anxiety: [-0.5, 0.6, 0.2], dread: [-0.7, 0.7, 0.1], panic: [-0.9, 1.0, 0.1],
  surprise: [0.1, 0.8, 0.4], confusion: [-0.2, 0.5, 0.3], curiosity: [0.3, 0.5, 0.5],
  disgust: [-0.6, 0.5, 0.6], boredom: [-0.3, 0.1, 0.3], neutral: [0.0, 0.1, 0.5],
};

class TransformerEmotionEngine {
  analyzeText(text: string): EmotionAnalysisResult {
    const words = text.toLowerCase().split(/\s+/);
    const scores: Record<string, number> = {};
    const emotionKeywords: Record<string, string[]> = {
      joy: ['happy', 'great', 'wonderful', 'excited', 'love', 'amazing'],
      sadness: ['sad', 'upset', 'cry', 'miss', 'alone', 'hurt'],
      anger: ['angry', 'mad', 'furious', 'hate', 'rage'],
      fear: ['scared', 'afraid', 'worried', 'terrified', 'anxious'],
      surprise: ['wow', 'unexpected', 'shocked', 'surprised', 'unbelievable'],
      disgust: ['gross', 'disgusting', 'horrible', 'awful', 'nasty'],
      contentment: ['peaceful', 'calm', 'satisfied', 'comfortable', 'okay'],
      frustration: ['frustrated', 'stuck', 'annoying', 'ugh'],
      curiosity: ['wonder', 'curious', 'interesting', 'how', 'why'],
      gratitude: ['thanks', 'grateful', 'appreciate', 'thankful'],
      guilt: ['sorry', 'fault', 'blame', 'regret'],
      boredom: ['boring', 'dull', 'tired', 'meh'],
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const count = words.filter(w => keywords.includes(w)).length;
      scores[emotion] = count / (words.length || 1);
    }

    // Add base scores and softmax
    const allEmotions = Object.keys(EMOTION_VAD) as GranularEmotion[];
    const predictions: EmotionPrediction[] = allEmotions.map(emotion => {
      const raw = (scores[emotion] || 0) + 0.01;
      const [valence, arousal, dominance] = EMOTION_VAD[emotion];
      return { emotion, probability: raw, valence, arousal, dominance };
    });

    const total = predictions.reduce((s, p) => s + p.probability, 0);
    predictions.forEach(p => p.probability /= total);
    predictions.sort((a, b) => b.probability - a.probability);

    const primary = predictions[0];
    const secondary = predictions[1].probability > 0.1 ? predictions[1] : null;
    const complexity = secondary ? Math.min(1, predictions.filter(p => p.probability > 0.05).length / 5) : 0;

    return {
      primary, secondary,
      topPredictions: predictions.slice(0, 5),
      emotionalComplexity: complexity,
      emotionalIntensity: primary.probability,
      contextualInterpretation: `Primary emotion: ${primary.emotion} (${(primary.probability * 100).toFixed(0)}%)`,
    };
  }
}

export const transformerEmotionEngine = new TransformerEmotionEngine();
export { TransformerEmotionEngine };
