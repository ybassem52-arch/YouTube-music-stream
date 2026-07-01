import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import YoutubePlayer from "react-native-youtube-iframe";
import { View } from "react-native";

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

const YoutubeAudioBridge = forwardRef<YoutubeAudioHandle, Props>(
  ({ onPlay, onPause, onEnded, onBuffering, onTimeUpdate, onDurationChange, onError }, ref) => {
    const [videoId, setVideoId] = useState<string>("");
    const [playing, setPlaying] = useState(false);
    const playerRef = useRef<InstanceType<typeof YoutubePlayer> | null>(null);
    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);

    useImperativeHandle(ref, () => ({
      loadVideo: (id: string) => {
        setVideoId(id);
        setPlaying(true);
      },
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      seekTo: (seconds: number) => {
        (playerRef.current as any)?.seekTo(seconds, true);
      },
      getCurrentTime: () => currentTimeRef.current,
      getDuration: () => durationRef.current,
    }));

    if (!videoId) return null;

    return (
      <View style={{ width: 0, height: 0, overflow: "hidden" }}>
        <YoutubePlayer
          ref={playerRef as React.RefObject<InstanceType<typeof YoutubePlayer>>}
          height={0}
          width={0}
          videoId={videoId}
          play={playing}
          onChangeState={(state: string) => {
            if (state === "playing") { setPlaying(true); onPlay?.(); }
            else if (state === "paused") { setPlaying(false); onPause?.(); }
            else if (state === "ended") { setPlaying(false); onEnded?.(); }
            else if (state === "buffering") { onBuffering?.(); }
          }}
          onError={() => { setPlaying(false); onError?.(); }}
          onPlaybackQualityChange={() => {}}
          initialPlayerParams={{ controls: false, modestbranding: true, rel: false, iv_load_policy: 3 }}
        />
      </View>
    );
  },
);

YoutubeAudioBridge.displayName = "YoutubeAudioBridge";
export default YoutubeAudioBridge;
