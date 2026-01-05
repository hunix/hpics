/**
 * Family Tree Engine
 * 
 * This module builds a proper family graph with relationship inference.
 * It automatically computes transitive relationships like:
 * - Siblings from shared parents
 * - Grandparent/grandchild chains
 * - Uncle/aunt from parent's siblings
 * - Cousins from uncle/aunt's children
 * 
 * Generation calculation is anchor-based:
 * - Anchor person (YOU) = Gen 0
 * - Parents = Gen -1, Grandparents = Gen -2
 * - Children = Gen +1, Grandchildren = Gen +2
 * - Siblings/Spouses share the same generation
 */

export interface FamilyMember {
  id: string;
  name: string;
  avatar?: string | null;
  generation: number; // 0 = anchor (YOU), negative = ancestors, positive = descendants
  isSelf?: boolean;
}

export interface FamilyLink {
  source: string;
  target: string;
  label: string;
  inverseLabel: string;
  isInferred: boolean;
  linkType: 'parent-child' | 'spouse' | 'sibling';
}

export interface RawRelationship {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  relationship_label: string;
  inverse_label: string | null;
  is_inferred?: boolean;
}

export interface FamilyGraph {
  members: Map<string, FamilyMember>;
  links: FamilyLink[];
  generations: Map<number, string[]>; // generation level -> member ids
}

// Maps relationship labels to their semantic type
const PARENT_LABELS = new Set(['father', 'mother', 'parent', 'stepfather', 'stepmother']);
const CHILD_LABELS = new Set(['son', 'daughter', 'child', 'stepson', 'stepdaughter']);
const SPOUSE_LABELS = new Set(['spouse', 'husband', 'wife']);
const SIBLING_LABELS = new Set(['brother', 'sister', 'sibling', 'stepsibling']);
const GRANDPARENT_LABELS = new Set(['grandfather', 'grandmother', 'grandparent']);
const GRANDCHILD_LABELS = new Set(['grandson', 'granddaughter', 'grandchild']);

function isParentLabel(label: string): boolean {
  return PARENT_LABELS.has(label.toLowerCase());
}

function isChildLabel(label: string): boolean {
  return CHILD_LABELS.has(label.toLowerCase());
}

function isSpouseLabel(label: string): boolean {
  return SPOUSE_LABELS.has(label.toLowerCase());
}

function isSiblingLabel(label: string): boolean {
  return SIBLING_LABELS.has(label.toLowerCase());
}

function isGrandparentLabel(label: string): boolean {
  return GRANDPARENT_LABELS.has(label.toLowerCase());
}

function isGrandchildLabel(label: string): boolean {
  return GRANDCHILD_LABELS.has(label.toLowerCase());
}

interface ProfileInfo {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  is_self_profile?: boolean;
}

export function buildFamilyGraph(
  relationships: RawRelationship[],
  profiles: Map<string, ProfileInfo>,
  anchorProfileId?: string | null
): FamilyGraph {
  const members = new Map<string, FamilyMember>();
  const linksMap = new Map<string, FamilyLink>(); // key: "source-target-type" to prevent duplicates
  
  // Data structures for inference
  const parents = new Map<string, Set<string>>(); // child -> parents
  const children = new Map<string, Set<string>>(); // parent -> children
  const spouses = new Map<string, Set<string>>(); // person -> spouses
  const siblings = new Map<string, Set<string>>(); // person -> siblings

  // Helper to add to set map
  const addToSetMap = (map: Map<string, Set<string>>, key: string, value: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(value);
  };

  // Helper to create member
  const ensureMember = (id: string) => {
    if (!members.has(id)) {
      const profile = profiles.get(id);
      members.set(id, {
        id,
        name: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Unknown',
        avatar: profile?.avatar_url,
        generation: 0, // Will be computed later
        isSelf: profile?.is_self_profile || false,
      });
    }
  };

  // Helper to add link without duplicates
  const addLink = (
    source: string, 
    target: string, 
    label: string, 
    inverseLabel: string,
    linkType: 'parent-child' | 'spouse' | 'sibling',
    isInferred: boolean
  ) => {
    // Normalize key for spouse/sibling (undirected)
    let key: string;
    if (linkType === 'spouse' || linkType === 'sibling') {
      const [a, b] = [source, target].sort();
      key = `${a}-${b}-${linkType}`;
    } else {
      key = `${source}-${target}-${linkType}`;
    }
    
    if (!linksMap.has(key)) {
      linksMap.set(key, {
        source,
        target,
        label,
        inverseLabel,
        isInferred,
        linkType,
      });
    }
  };

  // First pass: collect explicit relationships
  for (const rel of relationships) {
    const { from_profile_id: from, to_profile_id: to, relationship_label: label, inverse_label, is_inferred } = rel;
    
    ensureMember(from);
    ensureMember(to);

    const labelLower = label.toLowerCase();

    // Determine relationship type and add to lookup structures
    if (isParentLabel(labelLower)) {
      // "from" is parent of "to"
      addToSetMap(parents, to, from);
      addToSetMap(children, from, to);
      addLink(from, to, label, inverse_label || 'Child', 'parent-child', is_inferred || false);
    } else if (isChildLabel(labelLower)) {
      // "from" is child of "to"
      addToSetMap(parents, from, to);
      addToSetMap(children, to, from);
      addLink(to, from, inverse_label || 'Parent', label, 'parent-child', is_inferred || false);
    } else if (isSpouseLabel(labelLower)) {
      addToSetMap(spouses, from, to);
      addToSetMap(spouses, to, from);
      addLink(from, to, label, inverse_label || 'Spouse', 'spouse', is_inferred || false);
    } else if (isSiblingLabel(labelLower)) {
      addToSetMap(siblings, from, to);
      addToSetMap(siblings, to, from);
      addLink(from, to, label, inverse_label || 'Sibling', 'sibling', is_inferred || false);
    } else if (isGrandparentLabel(labelLower)) {
      // Grandparent relationship - still parent-child but across 2 generations
      addLink(from, to, label, inverse_label || 'Grandchild', 'parent-child', is_inferred || false);
    } else if (isGrandchildLabel(labelLower)) {
      addLink(to, from, inverse_label || 'Grandparent', label, 'parent-child', is_inferred || false);
    }
  }

  // Inference: siblings from shared parents
  parents.forEach((parentSet, child) => {
    parentSet.forEach(parent => {
      const otherChildren = children.get(parent);
      if (otherChildren) {
        otherChildren.forEach(sibling => {
          if (sibling !== child) {
            if (!siblings.get(child)?.has(sibling)) {
              addToSetMap(siblings, child, sibling);
              addToSetMap(siblings, sibling, child);
              addLink(child, sibling, 'Sibling', 'Sibling', 'sibling', true);
            }
          }
        });
      }
    });
  });

  // Inference: grandparent from parent chain
  children.forEach((directChildren, parent) => {
    directChildren.forEach(child => {
      const grandchildren = children.get(child);
      if (grandchildren) {
        grandchildren.forEach(grandchild => {
          const existingKey = `${parent}-${grandchild}-parent-child`;
          if (!linksMap.has(existingKey)) {
            addLink(parent, grandchild, 'Grandparent', 'Grandchild', 'parent-child', true);
          }
        });
      }
    });
  });

  // Inference: uncle/aunt from parent's siblings
  siblings.forEach((siblingSet, person) => {
    const personChildren = children.get(person);
    if (personChildren) {
      siblingSet.forEach(sibling => {
        personChildren.forEach(child => {
          const key = `${sibling}-${child}-parent-child`;
          if (!linksMap.has(key)) {
            addLink(sibling, child, 'Uncle/Aunt', 'Nephew/Niece', 'parent-child', true);
          }
        });
      });
    }
  });

  // Determine the anchor profile
  let effectiveAnchorId = anchorProfileId;
  
  // If no anchor specified, try to find the self profile
  if (!effectiveAnchorId) {
    for (const [id, member] of members) {
      if (member.isSelf) {
        effectiveAnchorId = id;
        break;
      }
    }
  }
  
  // If still no anchor, pick the first member
  if (!effectiveAnchorId && members.size > 0) {
    effectiveAnchorId = members.keys().next().value;
  }

  // Compute generations using BFS from anchor (anchor = Gen 0)
  const computeGenerations = () => {
    if (!effectiveAnchorId || members.size === 0) return;

    const visited = new Set<string>();
    const queue: Array<{ id: string; gen: number }> = [];
    
    // Start from anchor as Gen 0
    queue.push({ id: effectiveAnchorId, gen: 0 });

    while (queue.length > 0) {
      const { id, gen } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const member = members.get(id);
      if (member) {
        member.generation = gen;
      }

      // Parents are one generation above (negative = older)
      const myParents = parents.get(id);
      if (myParents) {
        myParents.forEach(parentId => {
          if (!visited.has(parentId)) {
            queue.push({ id: parentId, gen: gen - 1 });
          }
        });
      }

      // Children are one generation below (positive = younger)
      const myChildren = children.get(id);
      if (myChildren) {
        myChildren.forEach(childId => {
          if (!visited.has(childId)) {
            queue.push({ id: childId, gen: gen + 1 });
          }
        });
      }

      // Spouses are same generation
      const mySpouses = spouses.get(id);
      if (mySpouses) {
        mySpouses.forEach(spouseId => {
          if (!visited.has(spouseId)) {
            queue.push({ id: spouseId, gen: gen });
          }
        });
      }

      // Siblings are same generation
      const mySiblings = siblings.get(id);
      if (mySiblings) {
        mySiblings.forEach(siblingId => {
          if (!visited.has(siblingId)) {
            queue.push({ id: siblingId, gen: gen });
          }
        });
      }
    }

    // Handle any unvisited members (disconnected components)
    members.forEach((member, id) => {
      if (!visited.has(id)) {
        member.generation = 0;
      }
    });
  };

  computeGenerations();

  // Build generations map
  const generations = new Map<number, string[]>();
  members.forEach((member, id) => {
    if (!generations.has(member.generation)) {
      generations.set(member.generation, []);
    }
    generations.get(member.generation)!.push(id);
  });

  return {
    members,
    links: Array.from(linksMap.values()),
    generations,
  };
}

/**
 * Get inferred relationships that should be stored in the database
 */
export function getInferredRelationships(
  existingRelationships: RawRelationship[],
  profiles: Map<string, ProfileInfo>
): Array<{
  from_profile_id: string;
  to_profile_id: string;
  relationship_label: string;
  inverse_label: string;
}> {
  const graph = buildFamilyGraph(existingRelationships, profiles);
  const inferred: Array<{
    from_profile_id: string;
    to_profile_id: string;
    relationship_label: string;
    inverse_label: string;
  }> = [];

  // Find links that are inferred and not in existing
  const existingSet = new Set(
    existingRelationships.map(r => `${r.from_profile_id}-${r.to_profile_id}`)
  );

  graph.links.forEach(link => {
    if (link.isInferred) {
      const key = `${link.source}-${link.target}`;
      const reverseKey = `${link.target}-${link.source}`;
      if (!existingSet.has(key) && !existingSet.has(reverseKey)) {
        inferred.push({
          from_profile_id: link.source,
          to_profile_id: link.target,
          relationship_label: link.label.toLowerCase().replace('/', '-'),
          inverse_label: link.inverseLabel,
        });
      }
    }
  });

  return inferred;
}

/**
 * Get generation label for display
 */
export function getGenerationLabel(gen: number, anchorName?: string): string {
  if (gen === 0) return anchorName ? `You (${anchorName})` : 'You';
  if (gen === -1) return 'Parents';
  if (gen === -2) return 'Grandparents';
  if (gen === -3) return 'Great-Grandparents';
  if (gen === 1) return 'Children';
  if (gen === 2) return 'Grandchildren';
  if (gen === 3) return 'Great-Grandchildren';
  if (gen < 0) return `Gen ${gen}`;
  return `Gen +${gen}`;
}
