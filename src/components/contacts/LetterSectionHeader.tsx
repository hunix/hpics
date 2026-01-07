import { memo } from 'react';

interface LetterSectionHeaderProps {
  letter: string;
  count?: number;
  isSticky?: boolean;
}

export const LetterSectionHeader = memo(function LetterSectionHeader({
  letter,
  count,
  isSticky = true,
}: LetterSectionHeaderProps) {
  return (
    <div
      className={`${
        isSticky ? 'sticky top-0 z-10' : ''
      } bg-muted/90 backdrop-blur-sm px-4 py-2 border-b`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-foreground">{letter}</span>
        {count !== undefined && (
          <span className="text-sm text-muted-foreground">{count} contacts</span>
        )}
      </div>
    </div>
  );
});
