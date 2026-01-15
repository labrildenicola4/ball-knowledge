'use client';

import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites, loaded]);

  const toggleFavorite = (teamId: number) => {
    setFavorites((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const addFavorite = (teamId: number) => {
    setFavorites((prev) =>
      prev.includes(teamId) ? prev : [...prev, teamId]
    );
  };

  const removeFavorite = (teamId: number) => {
    setFavorites((prev) => prev.filter((id) => id !== teamId));
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const isFavorite = (teamId: number) => favorites.includes(teamId);

  return { favorites, toggleFavorite, addFavorite, removeFavorite, clearFavorites, isFavorite, loaded };
}
