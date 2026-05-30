import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchManamaalaiAnalytics, fetchMandapamAnalytics, fetchMembershipAnalytics, fetchOperationsAnalytics } from '@/api/analytics.api';
import type { ManamaalaiAnalytics, MandapamAnalytics, MembershipAnalytics, OperationsAnalytics } from '@/types/analytics';

export type SectionKey = 'manamaalai' | 'mandapam' | 'membership' | 'operations';

interface SectionState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  cachedAt: number | null;
}

type AnalyticsState = {
  [K in SectionKey]: SectionState<
    K extends 'manamaalai' ? ManamaalaiAnalytics :
    K extends 'mandapam' ? MandapamAnalytics :
    K extends 'membership' ? MembershipAnalytics :
    OperationsAnalytics
  >;
};

interface UseAnalyticsDataResult {
  sections: AnalyticsState;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  refetchSection: (section: SectionKey) => void;
  manamaalai: ManamaalaiAnalytics | null;
  mandapam: MandapamAnalytics | null;
  membership: MembershipAnalytics | null;
  operations: OperationsAnalytics | null;
  activeSection: SectionKey;
  setActiveSection: (s: SectionKey) => void;
}

const TTL_MS = 5 * 60 * 1000;

const SECTION_FETCHERS: Record<SectionKey, () => Promise<any>> = {
  manamaalai: fetchManamaalaiAnalytics,
  mandapam: fetchMandapamAnalytics,
  membership: fetchMembershipAnalytics,
  operations: fetchOperationsAnalytics,
};

const INITIAL_SECTION: SectionState<any> = { data: null, loading: true, error: null, cachedAt: null };

function initialAnalyticsState(): AnalyticsState {
  return {
    manamaalai: { ...INITIAL_SECTION },
    mandapam: { ...INITIAL_SECTION },
    membership: { ...INITIAL_SECTION },
    operations: { ...INITIAL_SECTION },
  };
}

export function useAnalyticsData(): UseAnalyticsDataResult {
  const [activeSection, setActiveSection] = useState<SectionKey>('manamaalai');
  const [sections, setSections] = useState<AnalyticsState>(initialAnalyticsState);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const fetchSection = useCallback(async (key: SectionKey) => {
    const cached = sections[key];
    if (cached.data && cached.cachedAt && Date.now() - cached.cachedAt < TTL_MS) {
      return;
    }
    setSections(prev => ({ ...prev, [key]: { ...prev[key], loading: true, error: null } }));
    try {
      const data = await SECTION_FETCHERS[key]();
      if (mountedRef.current) {
        setSections(prev => ({ ...prev, [key]: { data, loading: false, error: null, cachedAt: Date.now() } }));
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setSections(prev => ({ ...prev, [key]: { ...prev[key], loading: false, error: err?.message ?? `Failed to load ${key}` } }));
      }
    }
  }, [sections]);

  const fetchAll = useCallback(() => {
    (Object.keys(SECTION_FETCHERS) as SectionKey[]).forEach(key => {
      setSections(prev => ({ ...prev, [key]: { ...prev[key], loading: true, error: null } }));
      SECTION_FETCHERS[key]()
        .then((data: any) => {
          if (mountedRef.current) {
            setSections(prev => ({ ...prev, [key]: { data, loading: false, error: null, cachedAt: Date.now() } }));
          }
        })
        .catch((err: any) => {
          if (mountedRef.current) {
            setSections(prev => ({ ...prev, [key]: { ...prev[key], loading: false, error: err?.message ?? `Failed to load ${key}` } }));
          }
        });
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refetchSection = useCallback((key: SectionKey) => {
    setSections(prev => ({ ...prev, [key]: { ...prev[key], loading: true, error: null, cachedAt: null } }));
    SECTION_FETCHERS[key]()
      .then((data: any) => {
        if (mountedRef.current) {
          setSections(prev => ({ ...prev, [key]: { data, loading: false, error: null, cachedAt: Date.now() } }));
        }
      })
      .catch((err: any) => {
        if (mountedRef.current) {
          setSections(prev => ({ ...prev, [key]: { ...prev[key], loading: false, error: err?.message ?? `Failed to load ${key}` } }));
        }
      });
  }, []);

  const anyLoading = Object.values(sections).some(s => s.loading);
  const anyError = Object.values(sections).find(s => s.error)?.error ?? null;

  return {
    sections,
    loading: anyLoading,
    error: anyError,
    refetch: fetchAll,
    refetchSection,
    manamaalai: sections.manamaalai.data,
    mandapam: sections.mandapam.data,
    membership: sections.membership.data,
    operations: sections.operations.data,
    activeSection,
    setActiveSection,
  };
}