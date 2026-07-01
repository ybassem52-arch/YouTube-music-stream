import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Song } from "@workspace/api-client-react";

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
}

interface PlaylistsContextType {
  playlists: Playlist[];
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  getPlaylist: (id: string) => Playlist | undefined;
}

const PlaylistsContext = createContext<PlaylistsContextType | null>(null);

const STORAGE_KEY = "ymusic_playlists";

export function usePlaylists() {
  const ctx = useContext(PlaylistsContext);
  if (!ctx) throw new Error("usePlaylists must be used within PlaylistsProvider");
  return ctx;
}

function newId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

export function PlaylistsProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setPlaylists(JSON.parse(raw) as Playlist[]);
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const persist = useCallback((updated: Playlist[]) => {
    setPlaylists(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const createPlaylist = useCallback(
    (name: string): Playlist => {
      const pl: Playlist = { id: newId(), name, songs: [], createdAt: Date.now() };
      setPlaylists((prev) => {
        const updated = [pl, ...prev];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      return pl;
    },
    []
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      setPlaylists((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const renamePlaylist = useCallback(
    (id: string, name: string) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => (p.id === id ? { ...p, name } : p));
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const addToPlaylist = useCallback(
    (playlistId: string, song: Song) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== playlistId) return p;
          if (p.songs.find((s) => s.id === song.id)) return p;
          return { ...p, songs: [...p.songs, song] };
        });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const removeFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) =>
          p.id === playlistId
            ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
            : p
        );
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const getPlaylist = useCallback(
    (id: string) => playlists.find((p) => p.id === id),
    [playlists]
  );

  return (
    <PlaylistsContext.Provider
      value={{
        playlists,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addToPlaylist,
        removeFromPlaylist,
        getPlaylist,
      }}
    >
      {children}
    </PlaylistsContext.Provider>
  );
}
