import { useEffect, useState } from 'react';
import type { RegistrationDraft } from '@/types';

const KEY = 'cw_registration_draft';

const emptyDraft: RegistrationDraft = {
  personalInfo: {},
  withdrawal: {},
  step: 0,
  updatedAt: new Date().toISOString(),
};

export function useRegistrationDraft() {
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDraft({ ...emptyDraft, ...JSON.parse(raw) });
    } catch {
      // ignore corrupt draft
    }
    setLoaded(true);
  }, []);

  const save = (partial: Partial<RegistrationDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...partial, updatedAt: new Date().toISOString() };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // storage full / disabled — non-fatal
      }
      return next;
    });
  };

  const clear = () => {
    localStorage.removeItem(KEY);
    setDraft(emptyDraft);
  };

  return { draft, save, clear, loaded };
}
