import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Family Systems Analyzer
 * Analyzes family dynamics for exploitation opportunities:
 * - Triangulation patterns
 * - Enmeshment vs Disengagement
 * - Scapegoat/Golden Child roles
 * - Parentification detection
 * - Loyalty conflicts
 * - Intergenerational patterns
 */

interface FamilyMember {
  role: string; // mother, father, sibling, child, etc.
  relationship_quality: number; // 0-1
  influence_level: number; // 0-1
  conflict_history: boolean;
  emotional_dependency: number; // 0-1
  notes?: string;
}

interface FamilyStructure {
  members: FamilyMember[];
  target_role_in_family: string;
  family_type: 'nuclear' | 'extended' | 'blended' | 'single_parent';
  known_conflicts: string[];
  known_alliances: string[];
}

interface TriangulationPattern {
  triangle_members: string[];
  triangle_type: 'coalition' | 'detouring' | 'scapegoating';
  target_position: 'insider' | 'outsider' | 'mediator';
  exploitation_angle: string;
  destabilization_approach: string;
}

interface FamilyRole {
  role: string;
  description: string;
  psychological_impact: string;
  vulnerabilities: string[];
  exploitation_strategies: string[];
}

interface FamilySystemAnalysis {
  enmeshment_score: number;
  disengagement_score: number;
  triangulation_patterns: TriangulationPattern[];
  identified_roles: {
    scapegoat: FamilyRole | null;
    golden_child: FamilyRole | null;
    parentified_child: FamilyRole | null;
    lost_child: FamilyRole | null;
    mascot: FamilyRole | null;
  };
  loyalty_conflicts: string[];
  boundary_issues: string[];
  intergenerational_patterns: string[];
  exploitation_opportunities: {
    opportunity: string;
    approach: string;
    risk: 'low' | 'medium' | 'high';
  }[];
  recommended_approach: string;
}

function detectTriangulation(structure: FamilyStructure): TriangulationPattern[] {
  const patterns: TriangulationPattern[] = [];
  
  // Look for coalition patterns
  structure.known_alliances.forEach(alliance => {
    const members = alliance.split('-');
    if (members.length >= 2) {
      patterns.push({
        triangle_members: [...members, 'excluded_party'],
        triangle_type: 'coalition',
        target_position: members.includes(structure.target_role_in_family) ? 'insider' : 'outsider',
        exploitation_angle: 'Use existing alliance to reinforce your position or become included',
        destabilization_approach: 'Introduce information that creates doubt between alliance members'
      });
    }
  });
  
  // Look for scapegoating patterns
  const lowQualityMembers = structure.members.filter(m => m.relationship_quality < 0.3);
  if (lowQualityMembers.length > 0) {
    patterns.push({
      triangle_members: lowQualityMembers.map(m => m.role),
      triangle_type: 'scapegoating',
      target_position: lowQualityMembers.some(m => m.role === structure.target_role_in_family) ? 'insider' : 'outsider',
      exploitation_angle: 'Validate their experience of being scapegoated to build alliance',
      destabilization_approach: 'Highlight family injustices to increase their isolation'
    });
  }
  
  // Look for detouring (using conflict with child to avoid marital issues)
  const highConflictChild = structure.members.find(m => 
    (m.role.includes('child') || m.role.includes('sibling')) && m.conflict_history
  );
  if (highConflictChild) {
    patterns.push({
      triangle_members: ['parent1', 'parent2', highConflictChild.role],
      triangle_type: 'detouring',
      target_position: 'outsider',
      exploitation_angle: 'Child is distraction from parental issues - use this knowledge strategically',
      destabilization_approach: 'Draw attention to underlying parental conflict'
    });
  }
  
  return patterns;
}

function identifyFamilyRoles(structure: FamilyStructure): FamilySystemAnalysis['identified_roles'] {
  const roles: FamilySystemAnalysis['identified_roles'] = {
    scapegoat: null,
    golden_child: null,
    parentified_child: null,
    lost_child: null,
    mascot: null
  };
  
  structure.members.forEach(member => {
    // Scapegoat: low relationship quality, high conflict, blamed
    if (member.relationship_quality < 0.3 && member.conflict_history) {
      roles.scapegoat = {
        role: member.role,
        description: 'Bears family blame and dysfunction',
        psychological_impact: 'Shame, rebellion, or internalized worthlessness',
        vulnerabilities: [
          'Deep need for validation',
          'Anger at family injustice',
          'Identity built on being "the problem"',
          'May sabotage success to maintain role'
        ],
        exploitation_strategies: [
          'Validate their perception of unfair treatment',
          'Offer alternative identity as valued person',
          'Use their resentment toward family strategically',
          'Become their advocate against family'
        ]
      };
    }
    
    // Golden child: high relationship quality, high influence
    if (member.relationship_quality > 0.8 && member.influence_level > 0.7) {
      roles.golden_child = {
        role: member.role,
        description: 'Family\'s source of pride and validation',
        psychological_impact: 'Performance anxiety, fear of failure, conditional self-worth',
        vulnerabilities: [
          'Terror of disappointing family',
          'Identity fragility',
          'Hidden resentment of pressure',
          'Difficulty with authentic self-expression'
        ],
        exploitation_strategies: [
          'Offer unconditional acceptance (rare for them)',
          'Create space where they can fail safely',
          'Validate their hidden doubts and fears',
          'Become refuge from family expectations'
        ]
      };
    }
    
    // Parentified child: high emotional dependency from others
    if ((member.role.includes('child') || member.role.includes('sibling')) && 
        member.emotional_dependency < 0.3 && member.influence_level > 0.5) {
      roles.parentified_child = {
        role: member.role,
        description: 'Took on parental responsibilities too young',
        psychological_impact: 'Hyper-responsibility, caretaking at expense of self',
        vulnerabilities: [
          'Difficulty receiving care',
          'Guilt when prioritizing self',
          'Attraction to people who need saving',
          'Burnout and resentment'
        ],
        exploitation_strategies: [
          'Offer to take care of them for once',
          'Trigger their caretaking instinct',
          'Present yourself as someone who needs them',
          'Give them permission to be selfish'
        ]
      };
    }
  });
  
  return roles;
}

function calculateEnmeshmentDisengagement(structure: FamilyStructure): {
  enmeshment: number;
  disengagement: number;
} {
  let enmeshmentScore = 0;
  let disengagementScore = 0;
  
  structure.members.forEach(member => {
    // High emotional dependency = enmeshment
    enmeshmentScore += member.emotional_dependency * 0.3;
    
    // Low relationship quality with high conflict = disengagement
    if (member.relationship_quality < 0.3) {
      disengagementScore += 0.2;
    }
    
    // Very high relationship quality might indicate enmeshment
    if (member.relationship_quality > 0.9) {
      enmeshmentScore += 0.1;
    }
  });
  
  // Normalize
  const memberCount = structure.members.length || 1;
  
  return {
    enmeshment: Math.min(1, enmeshmentScore / memberCount),
    disengagement: Math.min(1, disengagementScore / memberCount)
  };
}

function identifyExploitationOpportunities(
  analysis: Partial<FamilySystemAnalysis>,
  structure: FamilyStructure
): FamilySystemAnalysis['exploitation_opportunities'] {
  const opportunities: FamilySystemAnalysis['exploitation_opportunities'] = [];
  
  // Enmeshment opportunities
  if ((analysis.enmeshment_score || 0) > 0.6) {
    opportunities.push({
      opportunity: 'Enmeshed family - use family approval as leverage',
      approach: 'Win over key family members to gain automatic trust',
      risk: 'medium'
    });
    opportunities.push({
      opportunity: 'Target seeks differentiation',
      approach: 'Offer escape from family expectations, become source of independence',
      risk: 'low'
    });
  }
  
  // Disengagement opportunities
  if ((analysis.disengagement_score || 0) > 0.6) {
    opportunities.push({
      opportunity: 'Family void to fill',
      approach: 'Become surrogate family - fill emotional needs family doesn\'t meet',
      risk: 'low'
    });
  }
  
  // Role-based opportunities
  if (analysis.identified_roles?.scapegoat) {
    opportunities.push({
      opportunity: 'Scapegoat rescue fantasy',
      approach: 'Position yourself as someone who truly sees and values them',
      risk: 'low'
    });
  }
  
  if (analysis.identified_roles?.golden_child) {
    opportunities.push({
      opportunity: 'Golden child pressure relief',
      approach: 'Be the one person with no expectations - pure acceptance',
      risk: 'low'
    });
  }
  
  if (analysis.identified_roles?.parentified_child) {
    opportunities.push({
      opportunity: 'Parentified child needs care',
      approach: 'Take care of them - they\'re not used to it and will bond strongly',
      risk: 'low'
    });
  }
  
  // Triangulation opportunities
  analysis.triangulation_patterns?.forEach(pattern => {
    if (pattern.target_position === 'outsider') {
      opportunities.push({
        opportunity: `Insert into ${pattern.triangle_type} triangle`,
        approach: pattern.exploitation_angle,
        risk: 'medium'
      });
    }
  });
  
  // Loyalty conflict opportunities
  if (structure.known_conflicts.length > 0) {
    opportunities.push({
      opportunity: 'Loyalty conflict exploitation',
      approach: 'Ally with one side of family conflict, use their rivalry to your advantage',
      risk: 'high'
    });
  }
  
  return opportunities;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { profile_id, family_structure } = await req.json();

    if (!family_structure) {
      throw new Error('Family structure data required');
    }

    const structure: FamilyStructure = family_structure;
    
    // Run analysis
    const scores = calculateEnmeshmentDisengagement(structure);
    const triangulation = detectTriangulation(structure);
    const roles = identifyFamilyRoles(structure);
    
    const partialAnalysis: Partial<FamilySystemAnalysis> = {
      enmeshment_score: scores.enmeshment,
      disengagement_score: scores.disengagement,
      triangulation_patterns: triangulation,
      identified_roles: roles
    };
    
    const exploitationOpportunities = identifyExploitationOpportunities(partialAnalysis, structure);
    
    // Identify loyalty conflicts
    const loyaltyConflicts: string[] = [];
    if (structure.known_conflicts.length > 1) {
      loyaltyConflicts.push('Multiple family conflicts create loyalty binds');
    }
    if (roles.scapegoat && roles.golden_child) {
      loyaltyConflicts.push('Scapegoat/Golden child dynamic creates sibling loyalty conflict');
    }
    
    // Identify boundary issues
    const boundaryIssues: string[] = [];
    if (scores.enmeshment > 0.7) {
      boundaryIssues.push('Poor individual boundaries - family members overly involved in each other\'s lives');
    }
    structure.members.forEach(m => {
      if (m.emotional_dependency > 0.8) {
        boundaryIssues.push(`${m.role} has excessive emotional dependency`);
      }
    });
    
    // Compile full analysis
    const analysis: FamilySystemAnalysis = {
      enmeshment_score: scores.enmeshment,
      disengagement_score: scores.disengagement,
      triangulation_patterns: triangulation,
      identified_roles: roles,
      loyalty_conflicts: loyaltyConflicts,
      boundary_issues: boundaryIssues,
      intergenerational_patterns: [
        'Look for patterns repeating from grandparents generation',
        'Check for family "curses" or repeated traumas',
        'Identify unresolved family grief or loss'
      ],
      exploitation_opportunities: exploitationOpportunities,
      recommended_approach: scores.enmeshment > scores.disengagement
        ? 'Family is enmeshed: Offer independence and differentiation. Become escape from family pressure.'
        : 'Family is disengaged: Fill the void. Become the family connection they\'re missing.'
    };

    // Store analysis
    if (profile_id) {
      await supabaseClient.from('family_system_analyses').upsert({
        user_id: user.id,
        profile_id,
        family_structure: structure,
        triangulation_patterns: triangulation,
        enmeshment_score: scores.enmeshment,
        disengagement_score: scores.disengagement,
        scapegoat_indicators: roles.scapegoat,
        golden_child_indicators: roles.golden_child,
        parentification_score: roles.parentified_child ? 0.8 : 0.2,
        loyalty_conflicts: loyaltyConflicts,
        boundary_violations: boundaryIssues,
        exploitation_opportunities: exploitationOpportunities,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id'
      });

      // Also persist to ai_analyses for section availability detection
      await supabaseClient.from('ai_analyses').upsert({
        user_id: user.id,
        profile_id,
        analysis_type: 'family_systems',
        result: analysis,
        generated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Family systems analyzer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
