// Helper functions to get human-readable labels for relationship subtypes and hierarchy levels

import { RELATIONSHIP_SUBTYPES, HIERARCHY_LEVELS } from './relationshipSubtypes';

export function getRelationshipSubtypeLabel(relationshipType: string, subtypeValue: string): string {
  const subtypes = RELATIONSHIP_SUBTYPES[relationshipType] || [];
  const found = subtypes.find(s => s.value === subtypeValue);
  return found?.label || subtypeValue;
}

export function getHierarchyLevelLabel(hierarchyValue: string): string {
  const found = HIERARCHY_LEVELS.find(h => h.value === hierarchyValue);
  return found?.label || hierarchyValue;
}

export function formatRelationshipDisplay(
  relationshipType: string | null,
  relationshipSubtype: string | null,
  hierarchyLevel: string | null
): { primary: string; secondary: string | null } {
  if (!relationshipType) {
    return { primary: 'Other', secondary: null };
  }

  const typeLabel = relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1);
  
  let secondary: string | null = null;
  
  if (relationshipSubtype) {
    secondary = getRelationshipSubtypeLabel(relationshipType, relationshipSubtype);
  }
  
  if (hierarchyLevel) {
    const hierarchyLabel = getHierarchyLevelLabel(hierarchyLevel);
    secondary = secondary ? `${secondary} • ${hierarchyLabel}` : hierarchyLabel;
  }
  
  return { primary: typeLabel, secondary };
}
