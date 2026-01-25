/**
 * useDataCollectionStatus Hook (v4.0)
 * Fetches comprehensive data collection status for a profile
 * Calculates completeness per category for the Data Collection Guide
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DataCategory {
  id: string;
  name: string;
  description: string;
  weight: number;
  isComplete: boolean;
  itemCount: number;
  requiredCount: number;
  icon: string;
  unlocks: string[];
  collectionPath: string;
  instructions: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DataCollectionStatus {
  categories: DataCategory[];
  overallScore: number;
  analysesUnlocked: number;
  totalAnalyses: number;
  categoryBreakdown: {
    complete: number;
    partial: number;
    empty: number;
  };
}

const ANALYSIS_REQUIREMENTS: Record<string, string[]> = {
  'MICE Assessment': ['profile', 'communications', 'observations'],
  'Behavioral DNA': ['communications', 'media', 'voice'],
  'Deception Detection': ['voice', 'media', 'communications'],
  'Network Graph': ['relationships', 'communications'],
  'Influence Profile': ['communications', 'observations', 'media'],
  'Psychological Profile': ['observations', 'communications', 'profile'],
  'Trust Assessment': ['communications', 'observations', 'relationships'],
  'Temporal Fusion': ['communications', 'events', 'observations'],
  'Mosaic Intelligence': ['media', 'profile'],
  'Email Intelligence': ['email', 'communications'],
  'Voice Biometrics': ['voice'],
  'Facial Analysis': ['media'],
  'Document Intelligence': ['documents'],
  'Financial Intelligence': ['documents', 'profile'],
  'Vulnerability Assessment': ['observations', 'communications', 'profile'],
  'Sacred Values Mapping': ['observations', 'communications'],
  'Relationship Dynamics': ['relationships', 'communications'],
  'Pattern of Life': ['communications', 'events', 'observations'],
  'Cognitive Profile': ['communications', 'observations', 'media'],
  'Exploitation Vectors': ['profile', 'observations', 'communications', 'relationships'],
};

export function useDataCollectionStatus(profileId: string | null) {
  return useQuery({
    queryKey: ['data-collection-status', profileId],
    queryFn: async (): Promise<DataCollectionStatus> => {
      if (!profileId) {
        return getEmptyStatus();
      }

      const [
        { data: profile },
        { data: contactMethods },
        { data: relationships },
        { data: communications },
        { data: media },
        { data: documents },
        { data: interests },
        { data: milestones },
        { data: observations },
        { data: analyses },
        { data: events },
        { data: trustAssessments },
        { data: emailThreads },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('contact_methods').select('id, contact_type, value').eq('profile_id', profileId),
        supabase.from('contact_relationships').select('id, relationship_type').or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`),
        supabase.from('communications').select('id, communication_type').eq('profile_id', profileId),
        supabase.from('media').select('id, media_type').eq('profile_id', profileId),
        supabase.from('documents').select('id, document_type').eq('profile_id', profileId),
        supabase.from('contact_interests').select('id').eq('profile_id', profileId),
        supabase.from('contact_life_milestones').select('id, milestone_type').eq('profile_id', profileId),
        supabase.from('contact_observations').select('id, observation_type').eq('profile_id', profileId),
        supabase.from('ai_analyses').select('id, analysis_type').eq('profile_id', profileId),
        supabase.from('events').select('id').eq('profile_id', profileId),
        supabase.from('trust_assessments').select('id').eq('profile_id', profileId),
        supabase.from('email_threads').select('id').eq('profile_id', profileId),
      ]);

      // Voice sessions from ai_analyses with voice type
      const voiceSessions = analyses?.filter(a => a.analysis_type?.includes('voice')) || [];

      const hasEmail = contactMethods?.some(m => m.contact_type === 'email') || false;
      const hasPhone = contactMethods?.some(m => m.contact_type === 'phone') || false;
      const hasSocial = contactMethods?.some(m => ['linkedin', 'twitter', 'facebook', 'instagram'].includes(m.contact_type || '')) || false;

      const categories: DataCategory[] = [
        {
          id: 'profile',
          name: 'Profile Basics',
          description: 'Core identity information including name, photo, organization, and job title',
          weight: 10,
          isComplete: !!(profile?.first_name && (profile?.avatar_url || profile?.organization)),
          itemCount: [profile?.first_name, profile?.last_name, profile?.avatar_url, profile?.organization, profile?.job_title, profile?.country].filter(Boolean).length,
          requiredCount: 6,
          icon: 'User',
          unlocks: ['Basic Identification', 'Network Positioning', 'Profile Search'],
          collectionPath: '/contacts/:id',
          instructions: [
            'Navigate to the contact detail page',
            'Fill in First Name and Last Name',
            'Upload a profile photo for visual recognition',
            'Add Organization and Job Title for professional context',
            'Set Location (City/Country) for geo-intelligence'
          ],
          priority: 'critical',
        },
        {
          id: 'email',
          name: 'Email Addresses',
          description: 'Email contact methods for communication tracking and email intelligence',
          weight: 10,
          isComplete: hasEmail,
          itemCount: contactMethods?.filter(m => m.contact_type === 'email').length || 0,
          requiredCount: 1,
          icon: 'Mail',
          unlocks: ['Email Intelligence', 'Communication Tracking', 'Sentiment Analysis'],
          collectionPath: '/contacts/:id?tab=methods',
          instructions: [
            'Go to Contact → Contact Methods tab',
            'Click "Add Contact Method"',
            'Select "Email" as type',
            'Enter the email address',
            'Mark as Primary if it\'s their main email'
          ],
          priority: 'critical',
        },
        {
          id: 'phone',
          name: 'Phone Numbers',
          description: 'Phone contact methods for call tracking and pattern analysis',
          weight: 8,
          isComplete: hasPhone,
          itemCount: contactMethods?.filter(m => m.contact_type === 'phone').length || 0,
          requiredCount: 1,
          icon: 'Phone',
          unlocks: ['Call Pattern Analysis', 'Contact Reachability'],
          collectionPath: '/contacts/:id?tab=methods',
          instructions: [
            'Go to Contact → Contact Methods tab',
            'Click "Add Contact Method"',
            'Select "Phone" as type',
            'Enter phone number with country code',
            'Mark as Primary if it\'s their main number'
          ],
          priority: 'high',
        },
        {
          id: 'social',
          name: 'Social Profiles',
          description: 'LinkedIn, Twitter, and other social media profiles for OSINT',
          weight: 8,
          isComplete: hasSocial,
          itemCount: contactMethods?.filter(m => ['linkedin', 'twitter', 'facebook', 'instagram'].includes(m.contact_type || '')).length || 0,
          requiredCount: 2,
          icon: 'Globe',
          unlocks: ['Social Graph Analysis', 'OSINT Collection', 'Network Mapping'],
          collectionPath: '/contacts/:id?tab=methods',
          instructions: [
            'Navigate to Contact → Contact Methods',
            'Add LinkedIn URL (highest priority)',
            'Add Twitter/X handle if available',
            'Add other social profiles (Facebook, Instagram)',
            'Use Social Profile Scraper for bulk import'
          ],
          priority: 'high',
        },
        {
          id: 'communications',
          name: 'Communications',
          description: 'Emails, messages, calls, and meeting logs for behavioral analysis',
          weight: 15,
          isComplete: (communications?.length || 0) >= 10,
          itemCount: communications?.length || 0,
          requiredCount: 50,
          icon: 'MessageSquare',
          unlocks: ['Communication Frequency', 'Relationship Trajectory', 'Sentiment Analysis', 'Pattern of Life'],
          collectionPath: '/import',
          instructions: [
            'Gmail Sync: Settings → Integrations → Connect Gmail',
            'Outlook Sync: Settings → Integrations → Connect Outlook',
            'WhatsApp: Import → WhatsApp → Upload .zip export',
            'Manual: Contact → Communications → Add Communication',
            'Calendar: Settings → Calendar Sync → Connect'
          ],
          priority: 'critical',
        },
        {
          id: 'media',
          name: 'Photos & Videos',
          description: 'Visual media for facial analysis, behavioral patterns, and lifestyle inference',
          weight: 12,
          isComplete: (media?.length || 0) >= 5,
          itemCount: media?.length || 0,
          requiredCount: 20,
          icon: 'Camera',
          unlocks: ['Facial Analysis', 'Behavioral Patterns', 'Lifestyle Inference', 'Wealth Indicators', 'Mosaic Intelligence'],
          collectionPath: '/media',
          instructions: [
            'Navigate to Contact → Media tab',
            'Click "Upload Media"',
            'Select photos/videos from device',
            'For bulk: Use Media page → Bulk Upload',
            'Social Scraper: Automatically pulls public photos'
          ],
          priority: 'high',
        },
        {
          id: 'voice',
          name: 'Voice Recordings',
          description: 'Voice samples for biometrics, deception detection, and stress analysis',
          weight: 12,
          isComplete: (voiceSessions?.length || 0) >= 1,
          itemCount: voiceSessions?.length || 0,
          requiredCount: 5,
          icon: 'Mic',
          unlocks: ['Voice Biometrics', 'Deception Detection', 'Stress Patterns', 'Transcription Intelligence'],
          collectionPath: '/command-center',
          instructions: [
            'Navigate to Command Center → Voice Recorder',
            'Select recording type (voice note, meeting, call)',
            'Start recording and speak clearly',
            'Minimum 30 seconds for biometric enrollment',
            'Save and link to contact'
          ],
          priority: 'high',
        },
        {
          id: 'documents',
          name: 'Documents',
          description: 'Financial, legal, and identity documents for deep analysis',
          weight: 8,
          isComplete: (documents?.length || 0) >= 1,
          itemCount: documents?.length || 0,
          requiredCount: 5,
          icon: 'FileText',
          unlocks: ['Document Intelligence', 'Financial Analysis', 'Identity Verification'],
          collectionPath: '/documents',
          instructions: [
            'Navigate to Contact → Documents tab',
            'Click "Upload Document"',
            'Select PDF, Word, or image files',
            'Categorize by type (Financial, Legal, Identity)',
            'OCR automatically extracts text content'
          ],
          priority: 'medium',
        },
        {
          id: 'observations',
          name: 'Observations',
          description: 'Behavioral notes, personality traits, and sacred values mapping',
          weight: 10,
          isComplete: (observations?.length || 0) >= 3,
          itemCount: observations?.length || 0,
          requiredCount: 10,
          icon: 'Eye',
          unlocks: ['Behavioral Baseline', 'Personality Profiling', 'Sacred Values Mapping', 'Ground Truth Validation'],
          collectionPath: '/contacts/:id?tab=observations',
          instructions: [
            'Navigate to Contact → Observations tab',
            'Click "Add Observation"',
            'Enter observation with date and context',
            'Set validation status (validated, challenged, inconclusive)',
            'Add personality trait observations'
          ],
          priority: 'high',
        },
        {
          id: 'relationships',
          name: 'Relationships',
          description: 'Family, professional, and social network connections',
          weight: 10,
          isComplete: (relationships?.length || 0) >= 2,
          itemCount: relationships?.length || 0,
          requiredCount: 10,
          icon: 'Users',
          unlocks: ['Network Graph', 'Power Network Mapping', 'Relationship Trajectory', 'Exploitation Vectors'],
          collectionPath: '/contacts/:id?tab=relationships',
          instructions: [
            'Navigate to Contact → Relationships tab',
            'Click "Add Relationship"',
            'Select relationship type (Family, Professional, Social)',
            'Link to existing contact or create new',
            'Describe relationship strength and context'
          ],
          priority: 'high',
        },
        {
          id: 'events',
          name: 'Events & Milestones',
          description: 'Life events, career changes, and temporal data points',
          weight: 5,
          isComplete: ((events?.length || 0) + (milestones?.length || 0)) >= 2,
          itemCount: (events?.length || 0) + (milestones?.length || 0),
          requiredCount: 10,
          icon: 'Calendar',
          unlocks: ['Pattern of Life', 'Temporal Predictions', 'Vulnerability Windows'],
          collectionPath: '/contacts/:id?tab=milestones',
          instructions: [
            'Add Birthday in Profile → Personal Info',
            'Navigate to Life Milestones Manager',
            'Record career changes and job transitions',
            'Track relocations in Location History',
            'Add significant life events'
          ],
          priority: 'medium',
        },
        {
          id: 'trust',
          name: 'Trust Assessments',
          description: 'Manual and AI-generated trust evaluations',
          weight: 5,
          isComplete: (trustAssessments?.length || 0) >= 1,
          itemCount: trustAssessments?.length || 0,
          requiredCount: 3,
          icon: 'Shield',
          unlocks: ['Trust Trajectory', 'Betrayal Prediction', 'Reliability Scoring'],
          collectionPath: '/contacts/:id?tab=trust',
          instructions: [
            'Navigate to Contact → Trust tab',
            'Complete Trust Assessment form',
            'Rate across multiple dimensions',
            'Run AI Trust Analysis for automated scoring',
            'Update periodically as relationship evolves'
          ],
          priority: 'medium',
        },
        {
          id: 'interests',
          name: 'Interests & Hobbies',
          description: 'Personal interests for rapport building and influence mapping',
          weight: 3,
          isComplete: (interests?.length || 0) >= 2,
          itemCount: interests?.length || 0,
          requiredCount: 5,
          icon: 'Heart',
          unlocks: ['Influence Mapping', 'Rapport Strategies', 'Gift Intelligence'],
          collectionPath: '/contacts/:id?tab=interests',
          instructions: [
            'Navigate to Contact → Interests tab',
            'Add hobbies and pastimes',
            'Record favorite topics',
            'Note sports teams, music, etc.',
            'Use for conversation starters'
          ],
          priority: 'low',
        },
        {
          id: 'analyses',
          name: 'AI Analyses',
          description: 'Completed AI analysis results stored in the system',
          weight: 4,
          isComplete: (analyses?.length || 0) >= 5,
          itemCount: analyses?.length || 0,
          requiredCount: 20,
          icon: 'Brain',
          unlocks: ['Full Intelligence Package', 'Cross-Modal Fusion', 'Predictive Intelligence'],
          collectionPath: '/dossier-intelligence/:id',
          instructions: [
            'Navigate to Dossier Intelligence page',
            'Select analyses to run',
            'Run Full Intelligence Package for complete coverage',
            'Results stored automatically',
            'Re-run periodically for fresh insights'
          ],
          priority: 'medium',
        },
      ];

      // Calculate overall score
      const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
      const earnedWeight = categories.reduce((sum, cat) => sum + (cat.isComplete ? cat.weight : 0), 0);
      const overallScore = Math.round((earnedWeight / totalWeight) * 100);

      // Calculate analyses unlocked
      const completeCategoryIds = new Set(categories.filter(c => c.isComplete).map(c => c.id));
      let analysesUnlocked = 0;
      Object.entries(ANALYSIS_REQUIREMENTS).forEach(([_, requirements]) => {
        if (requirements.every(req => completeCategoryIds.has(req))) {
          analysesUnlocked++;
        }
      });

      // Category breakdown
      const breakdown = {
        complete: categories.filter(c => c.itemCount >= c.requiredCount).length,
        partial: categories.filter(c => c.isComplete && c.itemCount < c.requiredCount).length,
        empty: categories.filter(c => !c.isComplete).length,
      };

      return {
        categories,
        overallScore,
        analysesUnlocked,
        totalAnalyses: Object.keys(ANALYSIS_REQUIREMENTS).length,
        categoryBreakdown: breakdown,
      };
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

function getEmptyStatus(): DataCollectionStatus {
  return {
    categories: [],
    overallScore: 0,
    analysesUnlocked: 0,
    totalAnalyses: Object.keys(ANALYSIS_REQUIREMENTS).length,
    categoryBreakdown: { complete: 0, partial: 0, empty: 0 },
  };
}

export { ANALYSIS_REQUIREMENTS };
