
# Audio Language Detection, Smart Skipping & Tagging System

## Executive Summary

Add intelligent language detection and tagging for voice/audio files with automatic skipping when the selected Whisper model doesn't support the detected language. Users will see language badges (Arabic, English, etc.) on each audio file and receive clear reports when files are skipped due to language incompatibility.

---

## Current System Status

### Models Properly Configured
All 4 Whisper models are correctly defined and wired:

| Model | ONNX ID | Language Support | Status |
|-------|---------|------------------|--------|
| `tiny` | `whisper-tiny.en` | English-only | Correctly flagged |
| `small` | `whisper-small` | Multilingual (incl. Arabic) | Working |
| `distil` | `distil-large-v3` | Multilingual (incl. Arabic) | Working |
| `turbo` | `whisper-large-v3-turbo` | Multilingual (incl. Arabic) | Working |

### What's Missing
1. **Language Detection Storage**: Transcription returns `language` but it's not saved to DB
2. **Language Tags on Files**: `VoiceRecording` interface lacks language field
3. **Smart Skipping Logic**: No check for model compatibility before processing
4. **Skip Reporting**: No mechanism to inform users about skipped files
5. **Media Table Column**: No `detected_language` column for filtering

---

## Implementation Plan

### Phase 1: Database Schema Update

**Add `detected_language` column to `media` table:**
```sql
ALTER TABLE public.media ADD COLUMN detected_language TEXT;
CREATE INDEX idx_media_detected_language ON public.media(detected_language);
```

The `voice_insights` table already has `language_detected` column - we'll use it.

### Phase 2: Model Language Support Registry

**File:** `src/lib/ml/localWhisperTranscriber.ts`

Extend `MODEL_MAP` with language support metadata:

```typescript
const MODEL_MAP: Record<WhisperModel, { 
  id: string; 
  name: string; 
  size: string; 
  speed: string;
  supportedLanguages: 'english-only' | 'multilingual';
  languageCodes?: string[]; // For english-only, specify ['en']
}> = {
  turbo: { ..., supportedLanguages: 'multilingual' },
  distil: { ..., supportedLanguages: 'multilingual' },
  small: { ..., supportedLanguages: 'multilingual' },
  tiny: { ..., supportedLanguages: 'english-only', languageCodes: ['en'] }
};
```

Add helper function:
```typescript
isLanguageSupported(model: WhisperModel, langCode: string): boolean
```

### Phase 3: Pre-Processing Language Detection (Sample-Based)

**File:** `src/lib/ml/localAudioAnalyzer.ts`

Add a fast language detection method that:
1. Transcribes first 10-15 seconds of audio
2. Returns detected language code
3. Caches result to avoid re-detection

```typescript
async detectLanguage(audioSource: string | Blob): Promise<{
  languageCode: string;
  languageName: string;
  confidence: number;
}>
```

### Phase 4: Enhanced VoiceRecording Interface

**File:** `src/hooks/useVoiceBulkAnalysis.ts`

```typescript
export interface VoiceRecording {
  // ... existing fields
  detectedLanguage?: string;         // ISO language code (ar, en, es, etc.)
  detectedLanguageName?: string;     // Display name (Arabic, English, etc.)
  languageSource?: 'detected' | 'manual' | 'unknown';
}

// New skip tracking interfaces
export interface SkippedRecording {
  recording: VoiceRecording;
  reason: 'unsupported_language' | 'detection_failed';
  detectedLanguage?: string;
  modelUsed: WhisperModel;
}

export interface VoiceBulkSession {
  // ... existing fields
  skippedItems: number;
  skippedRecordings?: SkippedRecording[];
}
```

### Phase 5: Smart Processing with Skip Logic

**File:** `src/hooks/useVoiceBulkAnalysis.ts`

Update `startBulkAnalysis` to:

1. **Pre-scan Phase** (for `tiny` model only):
   - Loop through selected recordings
   - Quick-detect language using 10-second sample
   - Build lists: `toProcess[]` and `toSkip[]`
   - Report skip count immediately

2. **Processing Phase**:
   - Process only compatible files
   - Store `language_detected` in `voice_insights` table
   - Update `media.detected_language` for audio files

3. **Skip Tracking**:
```typescript
const skippedRecordings: SkippedRecording[] = [];

// Pre-check for english-only model
if (whisperModel === 'tiny') {
  const langResult = await localAudioAnalyzer.detectLanguage(recording.audio_url);
  if (langResult.languageCode !== 'en') {
    skippedRecordings.push({
      recording,
      reason: 'unsupported_language',
      detectedLanguage: langResult.languageName,
      modelUsed: whisperModel
    });
    continue; // Skip this file
  }
}
```

### Phase 6: Language Badge Display in UI

**File:** `src/components/analysis/VoiceBulkAnalysisPanel.tsx`

Add language badges to recording rows:

```typescript
// Language code to display name mapping
const LANGUAGE_DISPLAY: Record<string, { name: string; flag?: string; className: string }> = {
  ar: { name: 'Arabic', flag: '🇸🇦', className: 'bg-emerald-500/20 text-emerald-600' },
  en: { name: 'English', flag: '🇺🇸', className: 'bg-blue-500/20 text-blue-600' },
  es: { name: 'Spanish', flag: '🇪🇸', className: 'bg-orange-500/20 text-orange-600' },
  fr: { name: 'French', flag: '🇫🇷', className: 'bg-indigo-500/20 text-indigo-600' },
  // ... more languages
  unknown: { name: 'Unknown', className: 'bg-gray-500/20 text-gray-600' }
};
```

Display in recording row:
```text
┌─────────────────────────────────────────────────────────────┐
│ ☑ Voice Note 2025-01-15  [WhatsApp] [Arabic 🇸🇦] [✓ Analyzed] │
│   ⏱ 2:34  •  3 days ago                                     │
└─────────────────────────────────────────────────────────────┘
```

### Phase 7: Skip Report UI

**File:** `src/components/analysis/VoiceBulkAnalysisPanel.tsx`

Add skip report section to the progress/completion UI:

```text
┌────────────────────────────────────────────────────────────────┐
│ ⚠ 12 files skipped - Language not supported                   │
│                                                                 │
│ The selected model (Whisper Tiny) only supports English.       │
│ These files were detected as non-English:                      │
│                                                                 │
│   • voice_note_2024.opus  [Arabic]                             │
│   • meeting_recording.mp3 [Arabic]                             │
│   • call_jan_15.m4a       [French]                             │
│   +9 more...                                                   │
│                                                                 │
│ [Switch to Multilingual Model] [Analyze Anyway]                │
└────────────────────────────────────────────────────────────────┘
```

### Phase 8: Language Filter Toggle

**File:** `src/components/analysis/VoiceBulkAnalysisPanel.tsx`

Add filter controls above the recording list:

```typescript
const [languageFilter, setLanguageFilter] = useState<string | 'all'>('all');

// Filter options derived from recordings with detected languages
const availableLanguages = useMemo(() => {
  const langs = new Set(recordings.map(r => r.detectedLanguage).filter(Boolean));
  return Array.from(langs);
}, [recordings]);
```

UI:
```text
┌─────────────────────────────────────────────────────────────────┐
│ Filter by Language: [All ▾] [Arabic (24)] [English (156)] [?]  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 9: Persist Language to Database

**File:** `src/hooks/useVoiceBulkAnalysis.ts`

Update `processLocalRecording`:

```typescript
// After transcription
const detectedLang = result.transcription?.language || 'unknown';

// Store in voice_insights
await supabase.from('voice_insights').upsert({
  // ... existing fields
  language_detected: detectedLang,  // NEW
});

// Update media table for filtering
if (recording.source === 'media') {
  await supabase.from('media')
    .update({ detected_language: detectedLang })
    .eq('id', recording.id);
}
```

### Phase 10: Fetch Language Tags on Load

**File:** `src/hooks/useVoiceBulkAnalysis.ts`

Update `fetchRecordings` to join language data:

```typescript
// For media files - select detected_language
let mediaQuery = supabase
  .from('media')
  .select('id, caption, file_url, ..., detected_language')
  .like('mime_type', 'audio/%');

// For voice sessions - join voice_insights for language
// Or add language field to voice_recording_sessions table
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/ml/localWhisperTranscriber.ts` | Add language support metadata to MODEL_MAP, add helper function |
| `src/lib/ml/localAudioAnalyzer.ts` | Add `detectLanguage()` method for quick language sampling |
| `src/hooks/useVoiceBulkAnalysis.ts` | Add skip logic, language storage, enhanced interfaces |
| `src/components/analysis/VoiceBulkAnalysisPanel.tsx` | Add language badges, skip report UI, language filter |

**Database Migration:**
- Add `detected_language` column to `media` table

---

## User Experience Flow

1. **Before Analysis**: Files without language tags show "?" or no badge
2. **Model Selection**: If user selects Tiny model, show warning about English-only
3. **Analysis Start**: Pre-scan detects languages for Tiny model selection
4. **Skip Notification**: Toast showing "12 Arabic files will be skipped (Tiny model is English-only)"
5. **During Analysis**: Language badges appear as files are processed
6. **Completion**: Summary shows processed + skipped counts with reasons
7. **Post-Analysis**: Language filter allows users to view files by language

---

## Technical Notes

- Language detection uses Whisper's built-in language identification (first 30 seconds)
- For `tiny` model, pre-scan uses the same model for consistency
- Arabic ISO code: `ar`, English: `en`, French: `fr`, Spanish: `es`
- Whisper returns ISO 639-1 codes which we map to display names
- Multilingual models (small/distil/turbo) can process 99+ languages including Arabic
