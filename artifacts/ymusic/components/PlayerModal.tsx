import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusicPlayer } from "@/context/MusicContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ARTWORK_SIZE = Math.min(SCREEN_WIDTH - 64, 340);

function formatTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerModal() {
  const {
    currentSong,
    isPlaying,
    isLoading,
    positionSecs,
    durationSecs,
    playerVisible,
    closePlayer,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
  } = useMusicPlayer();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const fav = currentSong ? isFavorite(currentSong.id) : false;
  const progressRatio = durationSecs > 0 ? positionSecs / durationSecs : 0;

  const handleToggleFav = useCallback(() => {
    if (!currentSong) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (fav) removeFavorite(currentSong.id);
    else addFavorite(currentSong);
  }, [currentSong, fav, addFavorite, removeFavorite]);

  const barWidth = SCREEN_WIDTH - 64;
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth));
      seekTo(ratio * durationSecs);
    },
    onPanResponderMove: (e) => {
      const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth));
      seekTo(ratio * durationSecs);
    },
  });

  if (!currentSong) return null;

  return (
    <Modal
      visible={playerVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closePlayer}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: Platform.OS === "ios" ? insets.top : 20,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={closePlayer} style={styles.iconBtn}>
            <Feather name="chevron-down" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>
            Now Playing
          </Text>
          <TouchableOpacity onPress={handleToggleFav} style={styles.iconBtn}>
            <Feather
              name="heart"
              size={22}
              color={fav ? colors.primary : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View style={[styles.artworkContainer, { width: ARTWORK_SIZE, height: ARTWORK_SIZE }]}>
          <Image
            source={{ uri: currentSong.thumbnail }}
            style={styles.artwork}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* Info */}
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: colors.foreground }]} numberOfLines={2}>
            {currentSong.title}
          </Text>
          <Text style={[styles.songArtist, { color: colors.mutedForeground }]} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View
            style={[styles.progressBar, { backgroundColor: colors.muted }]}
            {...panResponder.panHandlers}
          >
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${progressRatio * 100}%` },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                { backgroundColor: colors.primary, left: `${progressRatio * 100}%` },
              ]}
            />
          </View>
          <View style={styles.progressTimes}>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
              {formatTime(positionSecs)}
            </Text>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
              {formatTime(durationSecs)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={playPrev} style={styles.controlBtn}>
            <Feather name="skip-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={togglePlayPause}
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="large" />
            ) : (
              <Feather name={isPlaying ? "pause" : "play"} size={32} color="#FFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={playNext} style={styles.controlBtn}>
            <Feather name="skip-forward" size={28} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  artworkContainer: {
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  artwork: {
    width: "100%",
    height: "100%",
  },
  songInfo: {
    marginBottom: 28,
  },
  songTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    lineHeight: 28,
  },
  songArtist: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  progressSection: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
  progressTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  controlBtn: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF2D2D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
});
