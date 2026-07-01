import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface YoutubeAudioHandle {
  loadVideo: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface Props {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onBuffering?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onError?: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (id: string, opts: object) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (secs: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

let apiLoaded = false;
let apiLoadCallbacks: Array<() => void> = [];

function loadYouTubeAPI(onReady: () => void) {
  if (apiLoaded) { onReady(); return; }
  apiLoadCallbacks.push(onReady);
  if (document.getElementById("yt-iframe-api")) return;

  const tag = document.createElement("script");
  tag.id = "yt-iframe-api";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = () => {
    apiLoaded = true;
    const cbs = apiLoadCallbacks;
    apiLoadCallbacks = [];
    cbs.forEach((cb) => cb());
  };
}

const YoutubeAudioBridge = forwardRef<YoutubeAudioHandle, Props>(
  (
    { onPlay, onPause, onEnded, onBuffering, onTimeUpdate, onDurationChange, onError },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const readyRef = useRef(false);
    const pendingVideoRef = useRef<string | null>(null);

    const stopPolling = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    const startPolling = () => {
      stopPolling();
      pollRef.current = setInterval(() => {
        if (!playerRef.current || !readyRef.current) return;
        try {
          const ct = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (isFinite(ct)) onTimeUpdate?.(ct);
          if (isFinite(dur) && dur > 0) onDurationChange?.(dur);
        } catch { stopPolling(); }
      }, 500);
    };

    useEffect(() => {
      const divId = "yt-player-" + Math.random().toString(36).slice(2);
      if (containerRef.current) containerRef.current.id = divId;

      loadYouTubeAPI(() => {
        if (!containerRef.current) return;
        containerRef.current.id = divId;
        playerRef.current = new window.YT.Player(divId, {
          width: "1",
          height: "1",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              readyRef.current = true;
              if (pendingVideoRef.current) {
                playerRef.current?.loadVideoById(pendingVideoRef.current);
                pendingVideoRef.current = null;
              }
            },
            onStateChange: (e: { data: number }) => {
              const S = window.YT?.PlayerState;
              if (!S) return;
              if (e.data === S.PLAYING) { startPolling(); onPlay?.(); }
              else if (e.data === S.PAUSED) { stopPolling(); onPause?.(); }
              else if (e.data === S.ENDED) { stopPolling(); onEnded?.(); }
              else if (e.data === S.BUFFERING) { onBuffering?.(); }
            },
            onError: () => { stopPolling(); onError?.(); },
          },
        });
      });

      return () => {
        stopPolling();
        try { playerRef.current?.destroy(); } catch {}
        playerRef.current = null;
        readyRef.current = false;
      };
    }, []);

    useImperativeHandle(ref, () => ({
      loadVideo: (videoId: string) => {
        if (!readyRef.current || !playerRef.current) {
          pendingVideoRef.current = videoId;
        } else {
          playerRef.current.loadVideoById(videoId);
        }
      },
      play: () => { try { playerRef.current?.playVideo(); } catch {} },
      pause: () => { try { playerRef.current?.pauseVideo(); } catch {} },
      seekTo: (seconds: number) => { try { playerRef.current?.seekTo(seconds, true); } catch {} },
      getCurrentTime: () => { try { return playerRef.current?.getCurrentTime() ?? 0; } catch { return 0; } },
      getDuration: () => { try { return playerRef.current?.getDuration() ?? 0; } catch { return 0; } },
    }));

    return (
      <div
        ref={containerRef}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none", left: -9999 }}
      />
    );
  },
);

YoutubeAudioBridge.displayName = "YoutubeAudioBridge";
export default YoutubeAudioBridge;
