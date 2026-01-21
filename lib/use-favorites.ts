'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';

type FavoriteType = 'team' | 'league' | 'tournament';

interface Favorite {
  favorite_type: FavoriteType;
  favorite_id: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load user and favorites on mount
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadFavorites();
      }
      setLoading(false);
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
    const { data, error } = await supabase
      .from('user_favorites')
      .select('favorite_type, favorite_id');

    if (!error && data) {
      setFavorites(data as Favorite[]);
    }
  };

  const addFavorite = useCallback(async (type: FavoriteType, id: number) => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: user.id, favorite_type: type, favorite_id: id });

    if (!error) {
      setFavorites(prev => [...prev, { favorite_type: type, favorite_id: id }]);
      return true;
    }
    return false;
  }, [user, supabase]);

  const removeFavorite = useCallback(async (type: FavoriteType, id: number) => {
    if (!user) return false;

    const { error } = await supabase
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
  }, [user, supabase]);

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

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setFavorites([]);
      return true;
    }
    return false;
  }, [user, supabase]);

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
