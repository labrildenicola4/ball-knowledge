'use client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { tapLight } from '@/lib/haptics';

export function useSafeBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => {
    tapLight();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }, [router, fallback]);
}
