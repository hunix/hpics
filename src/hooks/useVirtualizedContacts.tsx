import { useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  [key: string]: any;
}

interface UseVirtualizedContactsOptions {
  contacts: Contact[];
  estimateSize?: number;
  overscan?: number;
}

export function useVirtualizedContacts({
  contacts,
  estimateSize = 80,
  overscan = 5,
}: UseVirtualizedContactsOptions) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const getContactAtIndex = useCallback(
    (index: number) => contacts[index],
    [contacts]
  );

  return {
    parentRef,
    virtualizer,
    virtualItems,
    totalSize,
    getContactAtIndex,
    isVirtualized: true,
  };
}

// Pagination hook for server-side pagination
export function usePaginatedQuery(pageSize: number = 50) {
  const calculateRange = useCallback(
    (page: number) => ({
      start: page * pageSize,
      end: (page + 1) * pageSize - 1,
    }),
    [pageSize]
  );

  return { pageSize, calculateRange };
}
