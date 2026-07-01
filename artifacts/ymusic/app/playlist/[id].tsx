import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { usePlaylists } from "@/context/PlaylistsContext";
import { useMusicPlayer } from "@/context/MusicContext";
import { SongCard } from "@/components/SongCard";

const MINI_PLAYER_HEIGHT = 76;
const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 83 : Platform.OS === "web" ? 84 : 56;

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getPlaylist, removeFromPlaylist } = usePlaylists();
  const { playSong } = useMusicPlayer();

  const playlist = getPlaylist(id ?? "");
  const paddingTop = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;
  const paddingBottom = MINI_PLAYER_HEIGHT + TAB_BAR_HEIGHT + (Platform.OS === "web" ? 34 : 0);

  if (!playlist) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
            Playlist not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {playlist.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}
          </Text>
        </View>
        {playlist.songs.length > 0 && (
          <TouchableOpacity
            style={[styles.playAllBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              playSong(playlist.songs[0], playlist.songs);
            }}
          >
            <Feather name="play" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={playlist.songs}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[styles.list, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: song, index }) => (
          <SongCard
            song={song}
            queue={playlist.songs}
            showIndex={index}
            onRemove={() => removeFromPlaylist(playlist.id, song.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Feather name="music" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No songs yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Add songs by tapping + on any song
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  playAllBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 2,
  },
  centered: {
    alignItems: "center",
    paddingTop: 100,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
