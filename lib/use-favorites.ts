'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from './supabase';
import { User } from '@supabase/supabase-js';

type FavoriteType = 'team' | 'league' | 'tournament' | 'mlb_team' | 'nba_team' | 'ncaab_team' | 'ncaaf_team' | 'conference';

interface Favorite {
  favorite_type: FavoriteType;
  favorite_id: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user and favorites on mount
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabaseBrowser.auth.getUser();
        setUser(user);

        if (user) {
          await loadFavorites();
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadFavorites();
      } else {
        setFavorites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadFavorites = async () => {
    const { data, error } = await supabaseBrowser
      .from('user_favorites')
      .select('favorite_type, favorite_id');

    if (!error && data) {
      setFavorites(data as Favorite[]);
    }
  };

  const addFavorite = useCallback(async (type: FavoriteType, id: number) => {
    if (!user) return false;

    const { error } = await supabaseBrowser
      .from('user_favorites')
      .insert({ user_id: user.id, favorite_type: type, favorite_id: id });

    if (!error) {
      setFavorites(prev => [...prev, { favorite_type: type, favorite_id: id }]);
      return true;
    }
    return false;
  }, [user]);

  const removeFavorite = useCallback(async (type: FavoriteType, id: number) => {
    if (!user) return false;

    const { error } = await supabaseBrowser
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('favorite_type', type)
      .eq('favorite_id', id);

    if (!error) {
      setFavorites(prev =>
        prev.filter(f => !(f.favorite_type === type && f.favorite_id === id))
      );
      return true;
    }
    return false;
  }, [user]);

  const toggleFavorite = useCallback(async (type: FavoriteType, id: number) => {
    if (isFavorite(type, id)) {
      return removeFavorite(type, id);
    } else {
      return addFavorite(type, id);
    }
  }, [addFavorite, removeFavorite]);

  const isFavorite = useCallback((type: FavoriteType, id: number) => {
    return favorites.some(f => f.favorite_type === type && f.favorite_id === id);
  }, [favorites]);

  const getFavoritesByType = useCallback((type: FavoriteType) => {
    return favorites
      .filter(f => f.favorite_type === type)
      .map(f => f.favorite_id);
  }, [favorites]);

  const clearFavorites = useCallback(async () => {
    if (!user) return false;

    const { error } = await supabaseBrowser
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setFavorites([]);
      return true;
    }
    return false;
  }, [user]);

  return {
    favorites,
    user,
    loading,
    isLoggedIn: !!user,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
    clearFavorites,
  };
}
