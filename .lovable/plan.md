

# Add Data Collection Guide to Navigation Menu

## Current State
The `/data-guide` page exists and is functional, but it's not accessible from the sidebar navigation menu. Users must manually type the URL or use the command palette.

## Changes Required

### File: `src/lib/navigationConfig.ts`

Add a new navigation item to the `navigationItems` array. The best placement is in the **intelligence** category since this page helps users understand what data to collect for intelligence analysis.

```typescript
{
  id: 'data-collection-guide',
  title: 'Data Collection Guide',
  url: '/data-guide',
  icon: Compass,  // or Target, Lightbulb - fits the "guidance" theme
  description: 'Maximize intelligence coverage',
  badge: 'new',
  category: 'intelligence',
  keywords: ['data', 'collection', 'guide', 'coverage', 'completeness', 'sources'],
},
```

## Placement Options

| Location | Rationale |
|----------|-----------|
| **Intelligence group** (recommended) | The page helps users understand what data unlocks intelligence modules |
| **Command group** | Could fit as a "getting started" utility |
| **Analysis group** | Related to analysis enablement matrix |

## Technical Details

1. Add the new `NavItem` object to the `navigationItems` array (around line 140, after existing intelligence items or near the top of the intelligence section)
2. The `Compass` icon is already imported and fits the "guidance" theme
3. Adding `badge: 'new'` will highlight it as a new feature
4. Keywords enable command palette search

## Result
After implementation:
- Page will appear in the sidebar under "Intelligence" group
- Searchable via Cmd/Ctrl+K command palette
- Visible to all users (no role/clearance restriction needed)

