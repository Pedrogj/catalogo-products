import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import type { Tenant } from '../types/domain';

export function useMyTenant(userId?: string) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!userId) {
      setTenant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setTenant(null);
      setLoading(false);
      return;
    }

    setTenant((data as Tenant) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { tenant, loading, error, refresh };
}
