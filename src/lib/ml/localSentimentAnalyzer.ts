/**
 * Local Sentiment Analyzer
 * 
 * Lightweight on-device sentiment analysis using rule-based and
 * lexicon approaches for zero-latency, privacy-preserving analysis.
 */

// Sentiment lexicons
const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
  'love', 'happy', 'joy', 'pleased', 'delighted', 'thrilled', 'excited',
  'beautiful', 'brilliant', 'perfect', 'best', 'better', 'nice', 'superb',
  'outstanding', 'incredible', 'remarkable', 'impressive', 'exceptional',
  'thanks', 'thank', 'appreciate', 'grateful', 'blessed', 'fortunate',
  'success', 'successful', 'win', 'winning', 'winner', 'triumph', 'achieve',
  'friendly', 'kind', 'helpful', 'supportive', 'caring', 'thoughtful',
  'confident', 'optimistic', 'hopeful', 'positive', 'enthusiastic',
  'agree', 'yes', 'absolutely', 'definitely', 'certainly', 'sure',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'worse',
  'hate', 'angry', 'sad', 'upset', 'disappointed', 'frustrated', 'annoyed',
  'ugly', 'stupid', 'dumb', 'idiotic', 'fail', 'failure', 'failed',
  'wrong', 'error', 'mistake', 'problem', 'issue', 'trouble', 'difficult',
  'sorry', 'regret', 'unfortunately', 'sadly', 'unhappy', 'miserable',
  'afraid', 'scared', 'worried', 'anxious', 'nervous', 'stressed',
  'disagree', 'no', 'never', 'nothing', 'nobody', 'nowhere', 'neither',
  'rude', 'mean', 'cruel', 'selfish', 'arrogant', 'aggressive', 'hostile',
  'boring', 'tedious', 'annoying', 'irritating', 'frustrating',
  'lie', 'lying', 'liar', 'fake', 'false', 'deceive', 'cheat',
]);

const INTENSIFIERS = new Set([
  'very', 'really', 'extremely', 'incredibly', 'absolutely', 'completely',
  'totally', 'utterly', 'highly', 'deeply', 'strongly', 'particularly',
  'especially', 'exceptionally', 'remarkably', 'surprisingly',
]);

const NEGATORS = new Set([
  'not', "n't", 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere',
  'hardly', 'barely', 'scarcely', 'rarely', 'seldom',
]);

const EMOTION_LEXICON: Record<string, string[]> = {
  joy: ['happy', 'joy', 'delighted', 'pleased', 'glad', 'cheerful', 'ecstatic', 'elated', 'thrilled'],
  sadness: ['sad', 'unhappy', 'depressed', 'down', 'blue', 'melancholy', 'gloomy', 'miserable', 'sorrowful'],
  anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'enraged', 'outraged', 'hostile', 'resentful'],
  fear: ['afraid', 'scared', 'frightened', 'terrified', 'anxious', 'worried', 'nervous', 'panicked'],
  surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned', 'startled', 'bewildered'],
  disgust: ['disgusted', 'repulsed', 'revolted', 'sick', 'nauseated', 'appalled'],
  trust: ['trust', 'confident', 'secure', 'reliable', 'faithful', 'loyal', 'dependable'],
  anticipation: ['excited', 'eager', 'hopeful', 'expectant', 'looking forward', 'anticipating'],
};

export interface SentimentResult {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1 (strength)
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: Record<string, number>;
  keywords: { word: string; sentiment: number }[];
}

export interface TextAnalysis {
  sentiment: SentimentResult;
  readability: {
    gradeLevel: number;
    fleschScore: number;
    avgSentenceLength: number;
    avgWordLength: number;
  };
  toxicity: {
    score: number;
    categories: string[];
  };
  topics: string[];
  entities: { text: string; type: string }[];
}

class LocalSentimentAnalyzer {
  /**
   * Analyze sentiment of text
   */
  analyzeSentiment(text: string): SentimentResult {
    const words = this.tokenize(text.toLowerCase());
    const keywords: { word: string; sentiment: number }[] = [];
    
    let positiveScore = 0;
    let negativeScore = 0;
    let isNegated = false;
    let intensifier = 1;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Check for negators
      if (NEGATORS.has(word)) {
        isNegated = true;
        continue;
      }

      // Check for intensifiers
      if (INTENSIFIERS.has(word)) {
        intensifier = 1.5;
        continue;
      }

      // Score the word
      let wordScore = 0;
      if (POSITIVE_WORDS.has(word)) {
        wordScore = 1 * intensifier;
        if (isNegated) wordScore = -wordScore * 0.5;
        positiveScore += Math.max(0, wordScore);
        negativeScore += Math.max(0, -wordScore);
        keywords.push({ word, sentiment: wordScore });
      } else if (NEGATIVE_WORDS.has(word)) {
        wordScore = -1 * intensifier;
        if (isNegated) wordScore = -wordScore * 0.5;
        positiveScore += Math.max(0, wordScore);
        negativeScore += Math.max(0, -wordScore);
        keywords.push({ word, sentiment: wordScore });
      }

      // Reset modifiers after applying
      isNegated = false;
      intensifier = 1;
    }

    // Calculate overall score
    const totalSentiment = positiveScore - negativeScore;
    const totalMagnitude = positiveScore + negativeScore;
    const wordCount = words.length || 1;

    const score = Math.max(-1, Math.min(1, totalSentiment / Math.sqrt(wordCount)));
    const magnitude = Math.min(1, totalMagnitude / wordCount);

    // Detect emotions
    const emotions = this.detectEmotions(words);

    // Determine label
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 0.1) label = 'positive';
    else if (score < -0.1) label = 'negative';

    // Confidence based on keyword density
    const confidence = Math.min(1, keywords.length / Math.max(5, wordCount / 10));

    return {
      score,
      magnitude,
      label,
      confidence,
      emotions,
      keywords: keywords.slice(0, 10),
    };
  }

  /**
   * Full text analysis
   */
  analyzeText(text: string): TextAnalysis {
    const sentiment = this.analyzeSentiment(text);
    const readability = this.analyzeReadability(text);
    const toxicity = this.analyzeToxicity(text);
    const topics = this.extractTopics(text);
    const entities = this.extractEntities(text);

    return {
      sentiment,
      readability,
      toxicity,
      topics,
      entities,
    };
  }

  /**
   * Detect emotions in text
   */
  private detectEmotions(words: string[]): Record<string, number> {
    const emotions: Record<string, number> = {};

    for (const [emotion, lexicon] of Object.entries(EMOTION_LEXICON)) {
      let count = 0;
      for (const word of words) {
        if (lexicon.includes(word)) count++;
      }
      if (count > 0) {
        emotions[emotion] = Math.min(1, count / Math.max(1, words.length / 20));
      }
    }

    return emotions;
  }

  /**
   * Analyze text readability
   */
  private analyzeReadability(text: string): {
    gradeLevel: number;
    fleschScore: number;
    avgSentenceLength: number;
    avgWordLength: number;
  } {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenize(text);
    const syllables = words.reduce((sum, w) => sum + this.countSyllables(w), 0);

    const sentenceCount = sentences.length || 1;
    const wordCount = words.length || 1;
    const avgSentenceLength = wordCount / sentenceCount;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;
    const avgSyllables = syllables / wordCount;

    // Flesch Reading Ease
    const fleschScore = Math.max(0, Math.min(100,
      206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllables)
    ));

    // Flesch-Kincaid Grade Level
    const gradeLevel = Math.max(0,
      (0.39 * avgSentenceLength) + (11.8 * avgSyllables) - 15.59
    );

    return {
      gradeLevel: Math.round(gradeLevel * 10) / 10,
      fleschScore: Math.round(fleschScore),
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
    };
  }

  /**
   * Analyze potential toxicity
   */
  private analyzeToxicity(text: string): { score: number; categories: string[] } {
    const lowerText = text.toLowerCase();
    const categories: string[] = [];
    let score = 0;

    // Check for various toxic patterns
    const toxicPatterns = {
      profanity: /\b(damn|hell|crap|ass)\b/gi,
      insults: /\b(idiot|stupid|dumb|moron|loser|pathetic)\b/gi,
      threats: /\b(kill|hurt|destroy|attack|fight)\b/gi,
      harassment: /\b(stalker|creep|freak|weirdo)\b/gi,
    };

    for (const [category, pattern] of Object.entries(toxicPatterns)) {
      const matches = lowerText.match(pattern);
      if (matches && matches.length > 0) {
        categories.push(category);
        score += matches.length * 0.2;
      }
    }

    return {
      score: Math.min(1, score),
      categories,
    };
  }

  /**
   * Extract main topics
   */
  private extractTopics(text: string): string[] {
    const words = this.tokenize(text.toLowerCase());
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with',
      'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
      'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
      'their', 'this', 'that', 'these', 'those', 'and', 'but', 'if', 'or', 'because', 'while', 'although']);

    const wordFreq: Record<string, number> = {};
    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Extract named entities (simplified)
   */
  private extractEntities(text: string): { text: string; type: string }[] {
    const entities: { text: string; type: string }[] = [];

    // Email pattern
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emails) {
      emails.forEach(e => entities.push({ text: e, type: 'email' }));
    }

    // Phone pattern
    const phones = text.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
    if (phones) {
      phones.forEach(p => entities.push({ text: p, type: 'phone' }));
    }

    // URL pattern
    const urls = text.match(/https?:\/\/[^\s]+/g);
    if (urls) {
      urls.forEach(u => entities.push({ text: u, type: 'url' }));
    }

    // Money pattern
    const money = text.match(/\$[\d,]+(?:\.\d{2})?/g);
    if (money) {
      money.forEach(m => entities.push({ text: m, type: 'money' }));
    }

    // Date patterns
    const dates = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g);
    if (dates) {
      dates.forEach(d => entities.push({ text: d, type: 'date' }));
    }

    // Capitalized words (potential names/places)
    const words = text.split(/\s+/);
    const capitalWords: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^\w]/g, '');
      if (word.length > 2 && /^[A-Z][a-z]+$/.test(word) && i > 0) {
        capitalWords.push(word);
      }
    }
    
    // Group consecutive capital words
    const uniqueCapital = [...new Set(capitalWords)];
    uniqueCapital.slice(0, 5).forEach(w => 
      entities.push({ text: w, type: 'proper_noun' })
    );

    return entities;
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * Count syllables in a word
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  /**
   * Compare sentiment between two texts
   */
  compareSentiments(text1: string, text2: string): {
    scoreDifference: number;
    emotionAlignment: number;
    interpretation: string;
  } {
    const s1 = this.analyzeSentiment(text1);
    const s2 = this.analyzeSentiment(text2);

    const scoreDifference = Math.abs(s1.score - s2.score);

    // Calculate emotion alignment
    const allEmotions = new Set([...Object.keys(s1.emotions), ...Object.keys(s2.emotions)]);
    let emotionSum = 0;
    let emotionCount = 0;
    
    for (const emotion of allEmotions) {
      const v1 = s1.emotions[emotion] || 0;
      const v2 = s2.emotions[emotion] || 0;
      emotionSum += 1 - Math.abs(v1 - v2);
      emotionCount++;
    }
    
    const emotionAlignment = emotionCount > 0 ? emotionSum / emotionCount : 1;

    // Interpretation
    let interpretation = '';
    if (scoreDifference < 0.2 && emotionAlignment > 0.7) {
      interpretation = 'Very similar emotional tone';
    } else if (scoreDifference < 0.4) {
      interpretation = 'Moderately similar sentiment';
    } else if ((s1.score > 0 && s2.score < 0) || (s1.score < 0 && s2.score > 0)) {
      interpretation = 'Opposing sentiment - potential conflict or contrast';
    } else {
      interpretation = 'Different emotional expressions';
    }

    return { scoreDifference, emotionAlignment, interpretation };
  }
}

export const localSentimentAnalyzer = new LocalSentimentAnalyzer();
