import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { claimAccessUrl, fetchSimpleFinAccounts, type SimpleFinAccount } from '../lib/simplefin';
import type { CreditCard } from '../lib/types';

// Mapping: simpleFin account id → credit card id in our app
export type AccountMapping = Record<string, string>;

const KEY_ACCESS_URL  = 'simplefin_access_url';
const KEY_MAPPINGS    = 'simplefin_mappings';
const KEY_LAST_SYNCED = 'simplefin_last_synced';

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase
    .from('budget_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await supabase
    .from('budget_settings')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
}

async function deleteSetting(key: string): Promise<void> {
  await supabase.from('budget_settings').delete().eq('key', key);
}

export function useSimpleFin() {
  const [accessUrl, setAccessUrl]   = useState<string | null>(null);
  const [mappings, setMappings]     = useState<AccountMapping>({});
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [accounts, setAccounts]     = useState<SimpleFinAccount[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    async function load() {
      try {
        const [url, mappingsStr, synced] = await Promise.all([
          getSetting(KEY_ACCESS_URL),
          getSetting(KEY_MAPPINGS),
          getSetting(KEY_LAST_SYNCED),
        ]);
        setAccessUrl(url);
        setMappings(mappingsStr ? (JSON.parse(mappingsStr) as AccountMapping) : {});
        setLastSynced(synced);
      } catch (err) {
        console.error('useSimpleFin: failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /**
   * Exchange a one-time setup token for a persistent access URL and save it.
   */
  const connect = useCallback(async (setupToken: string): Promise<boolean> => {
    setError(null);
    try {
      const url = await claimAccessUrl(setupToken);
      setAccessUrl(url);
      await setSetting(KEY_ACCESS_URL, url);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed.');
      return false;
    }
  }, []);

  /**
   * Remove all SimpleFin credentials and mappings.
   */
  const disconnect = useCallback(async (): Promise<void> => {
    setAccessUrl(null);
    setMappings({});
    setLastSynced(null);
    setAccounts([]);
    setError(null);
    await Promise.all([
      deleteSetting(KEY_ACCESS_URL),
      deleteSetting(KEY_MAPPINGS),
      deleteSetting(KEY_LAST_SYNCED),
    ]);
  }, []);

  /**
   * Save the user-defined mapping of SimpleFin account IDs → credit card IDs.
   */
  const saveMapping = useCallback(async (newMappings: AccountMapping): Promise<void> => {
    setMappings(newMappings);
    await setSetting(KEY_MAPPINGS, JSON.stringify(newMappings));
  }, []);

  /**
   * Fetch live balances from SimpleFin and apply them to mapped credit cards.
   * Returns how many cards were updated.
   */
  const sync = useCallback(async (
    creditCards: CreditCard[],
    updateCreditCard: (card: CreditCard) => void
  ): Promise<{ synced: number; fetched: number; error?: string }> => {
    if (!accessUrl) return { synced: 0, fetched: 0, error: 'Not connected to SimpleFin.' };

    setSyncing(true);
    setError(null);

    try {
      const sfAccounts = await fetchSimpleFinAccounts(accessUrl);
      setAccounts(sfAccounts);

      let synced = 0;
      for (const sfAccount of sfAccounts) {
        const cardId = mappings[sfAccount.id];
        if (!cardId) continue;

        const card = creditCards.find(c => c.id === cardId);
        if (!card) continue;

        // Credit card balances from SimpleFin are typically negative (money owed).
        // We store them as positive numbers.
        const rawBalance = parseFloat(sfAccount.balance);
        if (isNaN(rawBalance)) continue;

        const newBalance = Math.abs(rawBalance);
        if (newBalance !== card.balance) {
          updateCreditCard({ ...card, balance: Math.round(newBalance * 100) / 100 });
          synced++;
        }
      }

      const ts = new Date().toISOString();
      setLastSynced(ts);
      await setSetting(KEY_LAST_SYNCED, ts);

      return { synced, fetched: sfAccounts.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed.';
      setError(msg);
      return { synced: 0, fetched: 0, error: msg };
    } finally {
      setSyncing(false);
    }
  }, [accessUrl, mappings]);

  /**
   * Just fetch accounts (for mapping UI) without applying any updates.
   */
  const fetchAccounts = useCallback(async (): Promise<boolean> => {
    if (!accessUrl) return false;
    setSyncing(true);
    setError(null);
    try {
      const sfAccounts = await fetchSimpleFinAccounts(accessUrl);
      setAccounts(sfAccounts);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts.');
      return false;
    } finally {
      setSyncing(false);
    }
  }, [accessUrl]);

  return {
    connected: !!accessUrl,
    loading,
    syncing,
    error,
    accounts,
    mappings,
    lastSynced,
    connect,
    disconnect,
    saveMapping,
    sync,
    fetchAccounts,
  };
}
