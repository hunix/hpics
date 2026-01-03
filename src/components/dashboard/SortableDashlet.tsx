import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableDashletProps {
  id: string;
  title?: string;
  children: React.ReactNode;
  onRemove?: () => void;
  isEditing?: boolean;
}

export function SortableDashlet({ id, title, children, onRemove, isEditing }: SortableDashletProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'opacity-50 z-50'
      )}
    >
      {isEditing && (
        <div className="absolute -top-2 -right-2 z-10 flex gap-1">
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded bg-muted/80 hover:bg-muted"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      <div className={cn(isEditing && 'ring-2 ring-primary/20 rounded-lg')}>
        {children}
      </div>
    </div>
  );
}
