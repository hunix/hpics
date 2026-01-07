import { memo, useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface LetterCount {
  letter: string;
  count: number;
}

interface AlphabeticalSidebarProps {
  letterCounts: LetterCount[];
  activeLetter: string | null;
  onLetterClick: (letter: string | null) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const AlphabeticalSidebar = memo(function AlphabeticalSidebar({
  letterCounts,
  activeLetter,
  onLetterClick,
}: AlphabeticalSidebarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewLetter, setPreviewLetter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const letterCountMap = new Map(letterCounts.map((lc) => [lc.letter, lc.count]));

  const getLetterFromY = useCallback(
    (clientY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const y = clientY - rect.top;
      const letterHeight = rect.height / ALPHABET.length;
      const index = Math.floor(y / letterHeight);
      if (index >= 0 && index < ALPHABET.length) {
        return ALPHABET[index];
      }
      return null;
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      const letter = getLetterFromY(e.clientY);
      if (letter && letterCountMap.has(letter)) {
        setPreviewLetter(letter);
        onLetterClick(letter);
      }
    },
    [getLetterFromY, letterCountMap, onLetterClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const letter = getLetterFromY(e.clientY);
      if (letter && letterCountMap.has(letter)) {
        setPreviewLetter(letter);
        onLetterClick(letter);
      }
    },
    [isDragging, getLetterFromY, letterCountMap, onLetterClick]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setPreviewLetter(null);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      const touch = e.touches[0];
      const letter = getLetterFromY(touch.clientY);
      if (letter && letterCountMap.has(letter)) {
        setPreviewLetter(letter);
        onLetterClick(letter);
      }
    },
    [getLetterFromY, letterCountMap, onLetterClick]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const letter = getLetterFromY(touch.clientY);
      if (letter && letterCountMap.has(letter)) {
        setPreviewLetter(letter);
        onLetterClick(letter);
      }
    },
    [getLetterFromY, letterCountMap, onLetterClick]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setPreviewLetter(null);
  }, []);

  return (
    <div className="relative">
      {/* Preview bubble */}
      {previewLetter && isDragging && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-4xl font-bold w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-50">
          {previewLetter}
        </div>
      )}

      {/* Alphabet strip */}
      <div
        ref={containerRef}
        className="flex flex-col items-center py-1 select-none touch-none bg-background/80 backdrop-blur-sm rounded-full px-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Clear filter option */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLetterClick(null);
          }}
          className={cn(
            'text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full transition-colors',
            activeLetter === null
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          All
        </button>

        {ALPHABET.map((letter) => {
          const hasContacts = letterCountMap.has(letter);
          const isActive = activeLetter === letter;
          const count = letterCountMap.get(letter) || 0;

          return (
            <button
              key={letter}
              onClick={(e) => {
                e.stopPropagation();
                if (hasContacts) {
                  onLetterClick(isActive ? null : letter);
                }
              }}
              className={cn(
                'text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full transition-colors',
                isActive && 'bg-primary text-primary-foreground',
                hasContacts && !isActive && 'text-foreground hover:bg-accent',
                !hasContacts && 'text-muted-foreground/40 cursor-default'
              )}
              title={hasContacts ? `${letter} (${count})` : undefined}
              disabled={!hasContacts}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
});
