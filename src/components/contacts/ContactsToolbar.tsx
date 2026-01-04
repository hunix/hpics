import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  Upload, 
  LayoutGrid, 
  List, 
  Table2, 
  Users, 
  X,
  ArrowUpDown,
  Trash2,
  Filter
} from 'lucide-react';

export type ViewMode = 'cards' | 'table' | 'list' | 'avatars';
export type SortOption = 'name-asc' | 'name-desc' | 'recent' | 'oldest' | 'organization' | 'relationship';

interface ContactsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onImport: () => void;
  onAddContact: () => void;
  // Filters
  relationshipFilter: string | null;
  onRelationshipFilterChange: (value: string | null) => void;
  tagFilter: string | null;
  onTagFilterChange: (value: string | null) => void;
  favoriteFilter: boolean;
  onFavoriteFilterChange: (value: boolean) => void;
  availableRelationships: string[];
  availableTags: string[];
}

export function ContactsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  selectedCount,
  onBulkDelete,
  onImport,
  onAddContact,
  relationshipFilter,
  onRelationshipFilterChange,
  tagFilter,
  onTagFilterChange,
  favoriteFilter,
  onFavoriteFilterChange,
  availableRelationships,
  availableTags,
}: ContactsToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = [
    relationshipFilter,
    tagFilter,
    favoriteFilter,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onRelationshipFilterChange(null);
    onTagFilterChange(null);
    onFavoriteFilterChange(false);
  };

  const viewModeIcons = {
    cards: <LayoutGrid className="h-4 w-4" />,
    table: <Table2 className="h-4 w-4" />,
    list: <List className="h-4 w-4" />,
    avatars: <Users className="h-4 w-4" />,
  };

  const sortLabels: Record<SortOption, string> = {
    'name-asc': 'Name (A-Z)',
    'name-desc': 'Name (Z-A)',
    'recent': 'Recently Added',
    'oldest': 'Oldest First',
    'organization': 'Organization',
    'relationship': 'Relationship Type',
  };

  return (
    <div className="space-y-4">
      {/* Main Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={activeFiltersCount > 0 ? 'border-primary' : ''}
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <Button variant="destructive" size="sm" onClick={onBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedCount})
            </Button>
          )}

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortLabels[sortOption]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(sortLabels).map(([key, label]) => (
                <DropdownMenuItem 
                  key={key} 
                  onClick={() => onSortChange(key as SortOption)}
                  className={sortOption === key ? 'bg-accent' : ''}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            {Object.entries(viewModeIcons).map(([mode, icon]) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'secondary' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => onViewModeChange(mode as ViewMode)}
              >
                {icon}
              </Button>
            ))}
          </div>

          <Button variant="outline" onClick={onImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={onAddContact}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filter Tags Section */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
          {/* Relationship Filter */}
          <Select 
            value={relationshipFilter || 'all'} 
            onValueChange={(v) => onRelationshipFilterChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Relationships</SelectItem>
              {availableRelationships.map((rel) => (
                <SelectItem key={rel} value={rel} className="capitalize">
                  {rel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tag Filter */}
          <Select 
            value={tagFilter || 'all'} 
            onValueChange={(v) => onTagFilterChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Favorites Toggle */}
          <Badge 
            variant={favoriteFilter ? 'default' : 'outline'}
            className="cursor-pointer h-8 px-3"
            onClick={() => onFavoriteFilterChange(!favoriteFilter)}
          >
            ⭐ Favorites Only
          </Badge>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <>
              <div className="w-px bg-border h-8" />
              {relationshipFilter && (
                <Badge variant="secondary" className="h-8 gap-1">
                  {relationshipFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onRelationshipFilterChange(null)} 
                  />
                </Badge>
              )}
              {tagFilter && (
                <Badge variant="secondary" className="h-8 gap-1">
                  {tagFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onTagFilterChange(null)} 
                  />
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-muted-foreground"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
