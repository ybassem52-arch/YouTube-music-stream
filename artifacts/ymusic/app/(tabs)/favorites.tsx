import { Feather } from "@expo/vector-icons";
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
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/context/FavoritesContext";
import { useMusicPlayer } from "@/context/MusicContext";
import { SongCard } from "@/components/SongCard";

const MINI_PLAYER_HEIGHT = 76;
const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 83 : Platform.OS === "web" ? 84 : 56;

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, removeFavorite } = useFavorites();
  const { playSong } = useMusicPlayer();

  const paddingBottom = MINI_PLAYER_HEIGHT + TAB_BAR_HEIGHT + (Platform.OS === "web" ? 34 : 0);
  const paddingTop = Platform.OS === "web" ? insets.top + 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: paddingTop || insets.top + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Favorites</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {favorites.length} {favorites.length === 1 ? "song" : "songs"}
        </Text>
        {favorites.length > 0 && (
          <TouchableOpacity
            style={[styles.playAllBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              playSong(favorites[0], favorites);
            }}
          >
            <Feather name="play" size={16} color="#FFFFFF" />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[styles.list, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: song, index }) => (
          <SongCard
            song={song}
            queue={favorites}
            showIndex={index}
            onRemove={() => removeFavorite(song.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="heart" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No favorites yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Tap the heart icon on any song to add it here
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  playAllText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 2,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
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
