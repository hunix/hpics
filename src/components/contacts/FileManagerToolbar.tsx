import { Search, Grid3X3, List, FileImage, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { ViewMode } from '@/hooks/useFileViewPreferences';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FileManagerToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  typeFilter: string | null;
  onTypeFilterChange: (type: string | null) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  filterOptions: FilterOption[];
  sortOptions: { value: string; label: string }[];
  totalItems: number;
  showDetailView?: boolean;
}

export function FileManagerToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  typeFilter,
  onTypeFilterChange,
  sortOption,
  onSortChange,
  itemsPerPage,
  onItemsPerPageChange,
  filterOptions,
  sortOptions,
  totalItems,
  showDetailView = true,
}: FileManagerToolbarProps) {
  const itemsPerPageOptions = [12, 24, 48, 96];

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <FileImage className="h-4 w-4 mr-1.5" />
              {typeFilter ? filterOptions.find(o => o.value === typeFilter)?.label : 'All Types'}
              <ChevronDown className="h-3 w-3 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={typeFilter || 'all'} onValueChange={(v) => onTypeFilterChange(v === 'all' ? null : v)}>
              <DropdownMenuRadioItem value="all">All Types</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              {filterOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                  {option.count !== undefined && (
                    <Badge variant="secondary" className="ml-2 h-5 text-xs">
                      {option.count}
                    </Badge>
                  )}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              Sort: {sortOptions.find(o => o.value === sortOption)?.label}
              <ChevronDown className="h-3 w-3 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={sortOption} onValueChange={onSortChange}>
              {sortOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Items per page */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              {itemsPerPage} / page
              <ChevronDown className="h-3 w-3 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Items per page</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={String(itemsPerPage)} onValueChange={(v) => onItemsPerPageChange(Number(v))}>
              {itemsPerPageOptions.map((count) => (
                <DropdownMenuRadioItem key={count} value={String(count)}>
                  {count}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Mode Toggle */}
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && onViewModeChange(v as ViewMode)}>
          <ToggleGroupItem value="grid" aria-label="Grid view" className="h-9 w-9 p-0">
            <Grid3X3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" className="h-9 w-9 p-0">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          {showDetailView && (
            <ToggleGroupItem value="detail" aria-label="Detail view" className="h-9 w-9 p-0">
              <FileImage className="h-4 w-4" />
            </ToggleGroupItem>
          )}
        </ToggleGroup>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
        {typeFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onTypeFilterChange(null)}
          >
            Clear filter
            <X className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
