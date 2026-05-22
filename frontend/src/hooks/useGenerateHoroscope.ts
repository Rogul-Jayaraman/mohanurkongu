import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import type { HoroscopeResult, BirthInput } from '@/types/horoscope';

export function useGenerateHoroscope() {
  return useMutation<HoroscopeResult, Error, BirthInput>({
    mutationFn: (input) => api.post('/horoscope/generate', input),
  });
}
