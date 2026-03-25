
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DB, INITIAL_DB, loadDBFromSupabase } from './db';
import { supabaseService } from '../services/supabaseService';

interface DBContextType {
  db: DB;
  setDb: (db: DB | ((prev: DB) => DB)) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  forceSkipLoading: () => void;
}

const DBContext = createContext<DBContextType | undefined>(undefined);

export const DBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDbState] = useState<DB>(INITIAL_DB);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const forceSkipLoading = () => setLoading(false);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadDBFromSupabase();
      setDbState(data);
    } catch (err: any) {
      console.error("Failed to refresh DB:", err);
      setError(err.message || "Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const silentRefresh = async () => {
    try {
      const data = await loadDBFromSupabase();
      setDbState(data);
    } catch (err: any) {
      console.error("Failed to silent refresh DB:", err);
    }
  };

  useEffect(() => {
    refresh();

    // Subscribe to real-time changes
    const subscription = supabaseService.subscribeToChanges((payload) => {
      console.log('Real-time change detected:', payload.eventType, payload.table);
      // When any change happens in Supabase (including deletions), 
      // we refresh the local state to stay in sync.
      silentRefresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setDb = (newDbOrFn: DB | ((prev: DB) => DB)) => {
    setDbState(prev => {
      const next = typeof newDbOrFn === 'function' ? newDbOrFn(prev) : newDbOrFn;
      // We no longer call persistDB(next) here. 
      // Components should call supabaseService directly for writes.
      // This setDb is now only for optimistic UI updates if needed.
      return next;
    });
  };

  return (
    <DBContext.Provider value={{ db, setDb, loading, error, refresh, forceSkipLoading }}>
      {children}
    </DBContext.Provider>
  );
};

export const useDB = () => {
  const context = useContext(DBContext);
  if (!context) throw new Error('useDB must be used within a DBProvider');
  return context;
};
