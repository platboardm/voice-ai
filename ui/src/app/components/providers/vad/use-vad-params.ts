import { Metadata } from '@rapidaai/react';
import { useCallback } from 'react';

export const useVadParams = (
  parameters: Metadata[],
  onParameterChange: (parameters: Metadata[]) => void,
) => {
  const get = useCallback(
    (key: string, fallback: string) =>
      parameters?.find(p => p.getKey() === key)?.getValue() ?? fallback,
    [parameters],
  );

  const set = useCallback(
    (key: string, value: string) => {
      const updated = parameters ? parameters.map(p => p.clone()) : [];
      const idx = updated.findIndex(p => p.getKey() === key);
      if (idx !== -1) {
        updated[idx].setValue(value);
      } else {
        const m = new Metadata();
        m.setKey(key);
        m.setValue(value);
        updated.push(m);
      }
      onParameterChange(updated);
    },
    [parameters, onParameterChange],
  );

  return { get, set };
};
