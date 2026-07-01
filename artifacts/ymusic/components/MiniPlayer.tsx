import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMusicPlayer } from "@/context/MusicContext";
import { useColors } from "@/hooks/useColors";
import { PlayerModal } from "./PlayerModal";

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 83 : Platform.OS === "web" ? 84 : 56;

export function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    isLoading,
    openPlayer,
    togglePlayPause,
    clearSong,
  } = useMusicPlayer();
  const colors = useColors();

  if (!currentSong) return <PlayerModal />;

  const bottom = TAB_BAR_HEIGHT + (Platform.OS === "web" ? 34 : 0);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            bottom,
          },
        ]}
        onPress={openPlayer}
        activeOpacity={0.92}
      >
        <Image
          source={{ uri: currentSong.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={[styles.artist, { color: colors.mutedForeground }]} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.btn}
          onPress={(e) => { e.stopPropagation(); togglePlayPause(); }}
          hitSlop={8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name={isPlaying ? "pause" : "play"} size={22} color={colors.foreground} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            clearSong();
          }}
          hitSlop={8}
        >
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </TouchableOpacity>
      <PlayerModal />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 64,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  btn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
