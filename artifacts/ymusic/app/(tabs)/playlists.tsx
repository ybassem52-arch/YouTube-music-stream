import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { usePlaylists, type Playlist } from "@/context/PlaylistsContext";

const MINI_PLAYER_HEIGHT = 76;
const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 83 : Platform.OS === "web" ? 84 : 56;

function PlaylistCard({ playlist, onDelete }: { playlist: Playlist; onDelete: () => void }) {
  const colors = useColors();
  const thumb = playlist.songs[0]?.thumbnail;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/playlist/${playlist.id}`)}
      activeOpacity={0.8}
    >
      <View style={[styles.cardArt, { backgroundColor: colors.muted }]}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.cardArtImage} contentFit="cover" />
        ) : (
          <Feather name="music" size={28} color={colors.mutedForeground} />
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={[styles.cardCount, { color: colors.mutedForeground }]}>
          {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        hitSlop={8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Alert.alert("Delete Playlist", `Delete "${playlist.name}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
          ]);
        }}
      >
        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function PlaylistsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playlists, createPlaylist, deletePlaylist } = usePlaylists();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const paddingBottom = MINI_PLAYER_HEIGHT + TAB_BAR_HEIGHT + (Platform.OS === "web" ? 34 : 0);
  const paddingTop = Platform.OS === "web" ? insets.top + 67 : 0;

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createPlaylist(name);
    setNewName("");
    setShowCreate(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: paddingTop || insets.top + 16, backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Playlists</Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreate(true)}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={playlists}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[styles.list, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: pl }) => (
          <PlaylistCard
            playlist={pl}
            onDelete={() => deletePlaylist(pl.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="list" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No playlists yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Tap + to create your first playlist
            </Text>
            <TouchableOpacity
              style={[styles.emptyCreateBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreate(true)}
            >
              <Text style={styles.emptyCreateText}>Create Playlist</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreate(false)}
        >
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Playlist</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
              ]}
              placeholder="Playlist name..."
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleCreate}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.secondary }]}
                onPress={() => { setShowCreate(false); setNewName(""); }}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: newName.trim() ? 1 : 0.5 }]}
                onPress={handleCreate}
                disabled={!newName.trim()}
              >
                <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardArt: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  cardArtImage: {
    width: "100%",
    height: "100%",
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 14,
    gap: 4,
  },
  cardName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cardCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    padding: 16,
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
  emptyCreateBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  emptyCreateText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalBox: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
