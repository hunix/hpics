import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GridLayoutSelectorProps {
  value: number;
  onChange: (columns: number) => void;
  max?: number;
  min?: number;
  className?: string;
}

export function GridLayoutSelector({ 
  value, 
  onChange, 
  max = 6, 
  min = 1,
  className 
}: GridLayoutSelectorProps) {
  const columns = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LayoutGrid className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground mr-1">Columns:</span>
      {columns.map(cols => (
        <Button
          key={cols}
          variant={value === cols ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(cols)}
          className="w-8 h-8 p-0"
        >
          {cols}
        </Button>
      ))}
    </div>
  );
}
