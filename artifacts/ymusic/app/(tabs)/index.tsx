import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useSearchMusic,
  useGetTrendingMusic,
  getSearchMusicQueryKey,
  getGetTrendingMusicQueryKey,
} from "@workspace/api-client-react";
import type { Song } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { SearchBar } from "@/components/SearchBar";
import { SongCard } from "@/components/SongCard";
import { useMusicPlayer } from "@/context/MusicContext";

const MINI_PLAYER_HEIGHT = 76;
const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 83 : Platform.OS === "web" ? 84 : 56;

const CATEGORIES = ["All", "Pop", "Hip-Hop", "Rock", "Jazz", "Classical", "EDM", "R&B"];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { currentSong } = useMusicPlayer();

  const searchQ = activeSearch.length > 0
    ? (category !== "All" ? `${activeSearch} ${category}` : activeSearch)
    : undefined;

  const categoryQ = activeSearch.length === 0 && category !== "All" ? category + " music" : undefined;

  const searchParams = { q: searchQ ?? categoryQ ?? "" };
  const { data: searchData, isLoading: searchLoading } = useSearchMusic(searchParams, {
    query: {
      queryKey: getSearchMusicQueryKey(searchParams),
      enabled: !!searchQ || !!categoryQ,
    },
  });

  const { data: trendingData, isLoading: trendingLoading } = useGetTrendingMusic({
    query: {
      queryKey: getGetTrendingMusicQueryKey(),
      enabled: !activeSearch && category === "All",
    },
  });

  const handleSearch = useCallback(() => {
    setActiveSearch(query.trim());
  }, [query]);

  const songs: Song[] = searchData?.songs ?? trendingData?.songs ?? [];
  const isLoading = searchLoading || trendingLoading;
  const isShowingSearch = !!activeSearch || category !== "All";

  const paddingBottom = MINI_PLAYER_HEIGHT + TAB_BAR_HEIGHT + (Platform.OS === "web" ? 34 : 0);
  const paddingTop = Platform.OS === "web" ? insets.top + 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop || insets.top + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.appTitle, { color: colors.primary }]}>ymusic</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={handleSearch}
          placeholder="Search songs, artists..."
        />
        {/* Categories */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.categories}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[
                styles.categoryBtn,
                {
                  backgroundColor: cat === category ? colors.primary : colors.secondary,
                  borderColor: cat === category ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setCategory(cat);
                setActiveSearch("");
                setQuery("");
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: cat === category ? "#FFFFFF" : colors.foreground },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Song List */}
      <FlatList
        data={songs}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[styles.list, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {isShowingSearch ? "Results" : "Trending"}
          </Text>
        }
        renderItem={({ item: song }) => (
          <SongCard song={song} queue={songs} />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {isShowingSearch ? "No songs found" : "Could not load trending.\nCheck your connection."}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
    zIndex: 10,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  categories: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
