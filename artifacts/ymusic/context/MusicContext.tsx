import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as Haptics from "expo-haptics";
import type { Song } from "@workspace/api-client-react";
import YoutubeAudioBridge, {
  type YoutubeAudioHandle,
} from "../components/YoutubeAudioBridge";

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  queue: Song[];
  positionSecs: number;
  durationSecs: number;
  playerVisible: boolean;
  playSong: (song: Song, newQueue?: Song[]) => Promise<void>;
  togglePlayPause: () => void;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  seekTo: (seconds: number) => void;
  clearSong: () => void;
  openPlayer: () => void;
  closePlayer: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicProvider");
  return ctx;
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [positionSecs, setPositionSecs] = useState(0);
  const [durationSecs, setDurationSecs] = useState(0);

  const ytRef = useRef<YoutubeAudioHandle>(null);
  const queueRef = useRef(queue);
  const currentSongRef = useRef(currentSong);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setPositionSecs(0);
    const q = queueRef.current;
    const cur = currentSongRef.current;
    if (cur && q.length > 1) {
      const idx = q.findIndex((s) => s.id === cur.id);
      const next = q[(idx + 1) % q.length];
      if (next) loadAndPlay(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAndPlay = useCallback(async (song: Song) => {
    setIsLoading(true);
    setCurrentSong(song);
    setPlayerVisible(true);
    setPositionSecs(0);
    setDurationSecs(0);
    setIsPlaying(true);
    try {
      // videoId is the song.id — no backend call needed, YouTube IFrame handles streaming
      ytRef.current?.loadVideo(song.id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playSong = useCallback(
    async (song: Song, newQueue?: Song[]) => {
      if (newQueue) setQueue(newQueue);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadAndPlay(song);
    },
    [loadAndPlay],
  );

  const togglePlayPause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      ytRef.current?.pause();
      setIsPlaying(false);
    } else {
      ytRef.current?.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const playNext = useCallback(async () => {
    const cur = currentSongRef.current;
    const q = queueRef.current;
    if (!cur || q.length === 0) return;
    const idx = q.findIndex((s) => s.id === cur.id);
    await loadAndPlay(q[(idx + 1) % q.length]);
  }, [loadAndPlay]);

  const playPrev = useCallback(async () => {
    const cur = currentSongRef.current;
    const q = queueRef.current;
    if (!cur || q.length === 0) return;
    // Restart if past 3 seconds, else go to previous
    if (positionSecs > 3) {
      ytRef.current?.seekTo(0);
      setPositionSecs(0);
      return;
    }
    const idx = q.findIndex((s) => s.id === cur.id);
    await loadAndPlay(q[(idx - 1 + q.length) % q.length]);
  }, [loadAndPlay, positionSecs]);

  const seekTo = useCallback((seconds: number) => {
    ytRef.current?.seekTo(seconds);
    setPositionSecs(seconds);
  }, []);

  const clearSong = useCallback(() => {
    ytRef.current?.pause();
    setCurrentSong(null);
    setQueue([]);
    setPlayerVisible(false);
    setIsPlaying(false);
    setPositionSecs(0);
    setDurationSecs(0);
  }, []);

  const openPlayer = useCallback(() => setPlayerVisible(true), []);
  const closePlayer = useCallback(() => setPlayerVisible(false), []);

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        isLoading,
        queue,
        positionSecs,
        durationSecs,
        playerVisible,
        playSong,
        togglePlayPause,
        playNext,
        playPrev,
        seekTo,
        clearSong,
        openPlayer,
        closePlayer,
      }}
    >
      {/* Hidden YouTube player — always mounted so it survives navigation */}
      <YoutubeAudioBridge
        ref={ytRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onBuffering={() => {}}
        onTimeUpdate={(t) => setPositionSecs(t)}
        onDurationChange={(d) => setDurationSecs(d)}
        onError={() => { setIsPlaying(false); setIsLoading(false); }}
      />
      {children}
    </MusicContext.Provider>
  );
}
