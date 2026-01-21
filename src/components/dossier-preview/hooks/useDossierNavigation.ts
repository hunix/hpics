/**
 * Dossier Navigation Hook (v3.9.34)
 * Manages scroll-to-section and active section tracking via IntersectionObserver
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export function useDossierNavigation(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Register a section element
  const registerSection = useCallback((sectionId: string, element: HTMLElement | null) => {
    if (element) {
      sectionRefs.current.set(sectionId, element);
      observerRef.current?.observe(element);
    } else {
      const existing = sectionRefs.current.get(sectionId);
      if (existing) {
        observerRef.current?.unobserve(existing);
        sectionRefs.current.delete(sectionId);
      }
    }
  }, []);

  // Scroll to a specific section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = sectionRefs.current.get(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  }, []);

  // Set up IntersectionObserver
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio and pick the most visible
          const mostVisible = visibleEntries.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );
          setActiveSection(mostVisible.target.id);
        }
      },
      {
        rootMargin: '-10% 0px -70% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Clean up
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    activeSection,
    scrollToSection,
    registerSection,
    sectionRefs,
  };
}
