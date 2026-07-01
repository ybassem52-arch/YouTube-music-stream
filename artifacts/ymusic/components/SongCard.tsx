import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/context/FavoritesContext";
import { usePlaylists } from "@/context/PlaylistsContext";
import { useMusicPlayer } from "@/context/MusicContext";
import type { Song } from "@workspace/api-client-react";

interface SongCardProps {
  song: Song;
  queue?: Song[];
  showIndex?: number;
  onRemove?: () => void;
}

export function SongCard({ song, queue, showIndex, onRemove }: SongCardProps) {
  const colors = useColors();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { playlists, addToPlaylist } = usePlaylists();
  const { playSong, currentSong } = useMusicPlayer();
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

  const fav = isFavorite(song.id);
  const isActive = currentSong?.id === song.id;

  function handleToggleFav() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (fav) {
      removeFavorite(song.id);
    } else {
      addFavorite(song);
    }
  }

  function handleAddToPlaylist() {
    if (playlists.length === 0) {
      Alert.alert("No Playlists", "Create a playlist first from the Playlists tab.");
      return;
    }
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Add to Playlist",
          options: [...playlists.map((p) => p.name), "Cancel"],
          cancelButtonIndex: playlists.length,
        },
        (idx) => {
          if (idx < playlists.length) {
            addToPlaylist(playlists[idx].id, song);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      );
    } else {
      setShowPlaylistPicker(true);
    }
  }

  function handlePlay() {
    playSong(song, queue ?? [song]);
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isActive ? colors.secondary : "transparent" }]}
      onPress={handlePlay}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: song.thumbnail }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        {showIndex !== undefined && (
          <Text style={[styles.index, { color: isActive ? colors.primary : colors.mutedForeground }]}>
            {showIndex + 1}
          </Text>
        )}
        <View style={styles.textBlock}>
          <Text
            style={[styles.title, { color: isActive ? colors.primary : colors.foreground }]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
          <Text style={[styles.artist, { color: colors.mutedForeground }]} numberOfLines={1}>
            {song.artist}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleToggleFav} style={styles.actionBtn} hitSlop={8}>
          <Feather
            name="heart"
            size={18}
            color={fav ? colors.primary : colors.mutedForeground}
            style={fav ? { opacity: 1 } : { opacity: 0.6 }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddToPlaylist} style={styles.actionBtn} hitSlop={8}>
          <Feather name="plus-circle" size={18} color={colors.mutedForeground} style={{ opacity: 0.6 }} />
        </TouchableOpacity>
        {onRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.actionBtn} hitSlop={8}>
            <Feather name="trash-2" size={18} color={colors.destructive} style={{ opacity: 0.7 }} />
          </TouchableOpacity>
        )}
      </View>

      {Platform.OS !== "ios" && (
        <Modal
          visible={showPlaylistPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPlaylistPicker(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowPlaylistPicker(false)}
          >
            <View style={[styles.picker, { backgroundColor: colors.card }]}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Add to Playlist</Text>
              <FlatList
                data={playlists}
                keyExtractor={(p) => p.id}
                renderItem={({ item: pl }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      addToPlaylist(pl.id, song);
                      setShowPlaylistPicker(false);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Text style={[styles.pickerItemText, { color: colors.foreground }]}>{pl.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  info: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    marginRight: 8,
    gap: 8,
  },
  index: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    width: 20,
    textAlign: "center",
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    padding: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  picker: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: 400,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
});
