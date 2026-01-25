
# Data Collection Guide Page Implementation

## Overview

Create a comprehensive new page (`/data-guide`) that provides users with a complete walkthrough of all data types the HPICS intelligence platform can ingest, including step-by-step instructions for each, and how each data type contributes to the overall intelligence analysis coverage.

---

## Data Categories & Coverage Mapping

Based on system analysis, the platform processes **15 primary data categories** that feed into **40+ intelligence analysis types**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTELLIGENCE COMPLETENESS FORMULA                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Current formula checks 10 sources (each ~10% weight):                       │
│ • Psychological Profile    • MICE Assessment    • Influence Data            │
│ • Media (photos/videos)    • Voice Sessions     • Observations              │
│ • Trust Assessments        • Relationships      • AI Analyses               │
│ • Email Intelligence                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Page Structure & Components

### 1. Hero Section
- Title: "Intelligence Collection Guide"
- Subtitle: "Maximize your target intelligence coverage with comprehensive data collection"
- Overall system completeness meter showing what percentage of analysis types can run with current data

### 2. Data Categories Grid
Interactive cards for each of the 15 data categories showing:
- Category icon and name
- Current status (collected / not collected) for selected profile
- Weight contribution percentage
- Click to expand for detailed instructions

### 3. Per-Category Detail Sections

Each category will include:
- **What it provides**: Description of intelligence value
- **How to collect**: Step-by-step instructions with screenshots
- **Analysis unlock**: Which of the 40 analysis types this enables
- **Coverage weight**: Percentage contribution to overall completeness

---

## Data Categories Implementation

### Category 1: Profile Basics (10% weight)
| Field | Required | How to Collect |
|-------|----------|----------------|
| First Name | ✓ | Create contact form |
| Photo/Avatar | ○ | Upload from device or sync from social |
| Organization | ○ | Manual entry or LinkedIn scrape |
| Job Title | ○ | Manual entry or LinkedIn scrape |
| Location | ○ | Add via Location Manager |

**Unlocks**: Basic identification, network positioning

---

### Category 2: Contact Methods (10% weight)
| Type | Priority | How to Collect |
|------|----------|----------------|
| Email | High | Manual entry or Gmail/Outlook sync |
| Phone | High | Manual entry |
| LinkedIn | Medium | Social Profile Scraper |
| Twitter/X | Medium | Social Profile Scraper |
| WhatsApp | Medium | WhatsApp import |

**Unlocks**: Email intelligence, communication tracking, social graph analysis

**Collection Path**: 
1. Navigate to Contact → Contact Methods tab
2. Click "Add Contact Method"
3. Select type (email, phone, social)
4. Enter value and set as primary if applicable

---

### Category 3: Communications (15% weight)
| Source | How to Sync |
|--------|-------------|
| Email (Gmail) | Settings → Integrations → Connect Gmail |
| Email (Outlook) | Settings → Integrations → Connect Outlook |
| WhatsApp | Import → WhatsApp → Upload export file |
| Manual Logs | Contact → Communication → Add Communication |
| Calendar Events | Settings → Calendar Sync → Connect |

**Unlocks**: Communication frequency analysis, relationship trajectory, sentiment analysis, pattern-of-life

**Collection Instructions**:
1. **Gmail Sync**: Go to Settings → Integrations → Click "Connect Gmail" → Authorize access → Select calendars
2. **WhatsApp Import**: Go to Import page → Select WhatsApp tab → Upload .zip export → Map to contact

---

### Category 4: Media (Photos/Videos) (12% weight)
| Type | Collection Method |
|------|-------------------|
| Photos | Upload via Media page or Contact Media tab |
| Videos | Upload via Media page |
| Screenshots | Device Intel Capture → Screenshot |
| Social Media Posts | Social Profile Scraper |

**Unlocks**: Facial analysis, behavioral patterns, lifestyle inference, wealth indicators, mosaic intelligence

**Collection Instructions**:
1. Navigate to Contact → Media tab
2. Click "Upload Media"
3. Select photos/videos from device
4. For bulk: Use Media page → Bulk Upload

---

### Category 5: Voice Recordings (12% weight)
| Type | Collection Method |
|------|-------------------|
| Voice Notes | Quick Voice Recorder |
| Meeting Recordings | Voice Recorder → Meeting mode |
| Call Recordings | Voice Recorder → Call mode |
| Voice Signature | Biometric Enrollment |

**Unlocks**: Vocal analysis, deception detection, stress patterns, voice biometrics, transcription intelligence

**Collection Instructions**:
1. Navigate to Command Center → Voice Recorder
2. Select recording type (voice note, meeting, call)
3. Start recording and speak clearly
4. Save and link to contact

---

### Category 6: Documents (8% weight)
| Type | Collection Method |
|------|-------------------|
| Financial Documents | Upload via Documents tab |
| Legal Documents | Upload via Documents tab |
| Contracts | Upload via Documents tab |
| Identity Documents | Upload via Identity Documents Manager |

**Unlocks**: Financial intelligence, document insights, identity verification

---

### Category 7: Observations (10% weight)
| Type | Collection Method |
|------|-------------------|
| Behavioral Notes | Observations Manager |
| Sacred Values | Sacred Values tracker |
| Personality Traits | Manual observation entry |
| Validation Status | Mark as validated/challenged |

**Unlocks**: Behavioral baseline, personality profiling, sacred values mapping, ground truth validation

**Collection Instructions**:
1. Navigate to Contact → Observations tab
2. Click "Add Observation"
3. Enter observation with date and context
4. Set validation status (validated, challenged, inconclusive)

---

### Category 8: Relationships (10% weight)
| Type | Collection Method |
|------|-------------------|
| Family | Relationship Manager → Add relationship |
| Professional | Relationship Manager |
| Social Network | Auto-inferred from communications |

**Unlocks**: Network graph analysis, power network mapping, relationship trajectory, network exploitation vectors

---

### Category 9: Trust Assessments (5% weight)
| Type | Collection Method |
|------|-------------------|
| Manual Assessment | Trust Assessment form |
| AI-Generated | Run Trust Analysis |

**Unlocks**: Trust trajectory, betrayal prediction, reliability scoring

---

### Category 10: Life Events & Milestones (3% weight)
| Type | Collection Method |
|------|-------------------|
| Birthday | Profile → Personal Info |
| Anniversary | Life Milestones Manager |
| Career Changes | Life Milestones Manager |
| Relocations | Location History |

**Unlocks**: Pattern-of-life analysis, temporal predictions, vulnerability windows

---

## Analysis Enablement Matrix

Show which data sources unlock which analysis types:

```text
┌────────────────────────┬───────────────────────────────────────────────────┐
│ Analysis Type          │ Required Data Sources                            │
├────────────────────────┼───────────────────────────────────────────────────┤
│ MICE Assessment        │ Profile + Communications + Observations          │
│ Behavioral DNA         │ Communications + Media + Voice                   │
│ Deception Detection    │ Voice + Facial + Communications                  │
│ Network Graph          │ Relationships + Communications                   │
│ Influence Profile      │ Communications + Observations + Media            │
│ Cognitive Warfare      │ Full data (all sources)                          │
│ Temporal Fusion        │ Communications + Events + Observations           │
│ Mosaic Intelligence    │ Media (10+ images) + Profile                     │
└────────────────────────┴───────────────────────────────────────────────────┘
```

---

## Technical Implementation

### New Files to Create

1. **`src/pages/DataCollectionGuide.tsx`**
   - Main page component with all sections
   - Profile selector to show completeness for specific contact
   - Interactive expansion panels for each category

2. **`src/components/data-guide/DataCategoryCard.tsx`**
   - Reusable card component for each data category
   - Shows status, weight, and expandable instructions

3. **`src/components/data-guide/AnalysisEnablementMatrix.tsx`**
   - Visual matrix showing data → analysis mapping
   - Highlights which analyses are unlocked

4. **`src/components/data-guide/CollectionProgress.tsx`**
   - Overall progress ring/bar
   - Per-category breakdown

5. **`src/hooks/useDataCollectionStatus.ts`**
   - Hook to fetch current data status for a profile
   - Calculates completeness per category

### Route Addition
Add to router: `/data-guide` or `/intelligence-guide`

### Database Queries
Leverage existing queries from:
- `ProfileCompletenessWidget.tsx` - category checks
- `useDossierData.ts` - comprehensive data fetch
- `computeExtendedData.ts` - completeness calculation

---

## UI/UX Design

### Visual Elements
- Progress rings for each category (green/yellow/red based on completeness)
- Expandable accordion sections for detailed instructions
- Quick action buttons linking directly to collection interfaces
- Profile selector dropdown to check any contact's status

### Color Coding
- Green (80%+): Category well-covered
- Yellow (50-79%): Partial coverage
- Red (<50%): Missing critical data

### Mobile Responsive
- Cards stack vertically on mobile
- Expandable sections work with touch
- Quick actions remain accessible

---

## Integration Points

### Link From
- Profile detail page (next to ProfileCompletenessWidget)
- Empty states when analysis fails due to missing data
- Dashboard recommendations

### Link To
- Direct links to each data collection interface
- Import wizards (Gmail, WhatsApp)
- Device Intel Capture
- Contact detail tabs

---

## Summary

This implementation creates a comprehensive onboarding and reference guide that:

1. **Educates users** on what data the system can process
2. **Shows impact** of each data type on analysis coverage
3. **Provides actionable steps** to collect each data type
4. **Tracks progress** per profile to motivate complete collection
5. **Links directly** to collection interfaces for seamless workflow

The page will serve as both a training tool for new users and a reference for maximizing intelligence package quality for specific targets.
