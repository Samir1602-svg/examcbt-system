import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRealtimeTest(testId) {
  const [isRecentlyUpdated, setIsRecentlyUpdated] = useState(false);
  const [updatedData, setUpdatedData] = useState(null);

  useEffect(() => {
    if (!testId || !supabase) return;

    const channel = supabase
      .channel(`test-channel-${testId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mock_tests',
          filter: `id=eq.${testId}`,
        },
        (payload) => {
          setIsRecentlyUpdated(true);
          setUpdatedData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [testId]);

  return { 
    isRecentlyUpdated, 
    updatedData, 
    clearUpdateBadge: () => setIsRecentlyUpdated(false) 
  };
}