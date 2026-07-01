import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Song } from "@workspace/api-client-react";

interface FavoritesContextType {
  favorites: Song[];
  addFavorite: (song: Song) => void;
  removeFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

const STORAGE_KEY = "ymusic_favorites";

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Song[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setFavorites(JSON.parse(raw) as Song[]);
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const save = useCallback((songs: Song[]) => {
    setFavorites(songs);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  }, []);

  const addFavorite = useCallback(
    (song: Song) => {
      setFavorites((prev) => {
        if (prev.find((s) => s.id === song.id)) return prev;
        const updated = [song, ...prev];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const removeFavorite = useCallback(
    (songId: string) => {
      setFavorites((prev) => {
        const updated = prev.filter((s) => s.id !== songId);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const isFavorite = useCallback(
    (songId: string) => favorites.some((s) => s.id === songId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
