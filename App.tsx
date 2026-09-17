import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Note, NoteType, Flashcard } from './src/types/note';
import { Colors, NoteTypeMeta } from './src/theme/colors';
import {
  loadAllNotes,
  createNote,
  updateNote,
  deleteNote,
  resetToSeedData,
  clearAllNotes,
} from './src/storage/asyncStorage';
import { findConnectionsForNote } from './src/services/connectionEngine';
import { searchNotes } from './src/services/searchEngine';
import { getDueFlashcards, calculateSRSStats } from './src/services/srsEngine';

// Components
import { KnowledgeGraph } from './src/components/graph/KnowledgeGraph';
import { NoteCard } from './src/components/notes/NoteCard';
import { NoteDetailModal } from './src/components/notes/NoteDetailModal';
import { NoteEditorModal } from './src/components/notes/NoteEditorModal';
import { FlashcardReviewModal } from './src/components/srs/FlashcardReviewModal';
import { MeshAnalyticsModal } from './src/components/analytics/MeshAnalyticsModal';

type ActiveTab = 'mesh' | 'notes' | 'review';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('mesh');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NoteType | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyDue, setOnlyDue] = useState(false);

  // Selected Note & Modals State
  const [selectedGraphNoteId, setSelectedGraphNoteId] = useState<string | null>(null);
  const [activeDetailNote, setActiveDetailNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isSRSReviewVisible, setIsSRSReviewVisible] = useState(false);
  const [customSRSQueue, setCustomSRSQueue] = useState<{ note: Note; card: Flashcard }[] | null>(null);
  const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const loaded = await loadAllNotes();
        setNotes(loaded);
        if (loaded.length > 0) {
          setSelectedGraphNoteId(loaded[0].id);
        }
      } catch (err) {
        console.error('Failed to init notes:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Compute connections map for fast badge lookups
  const connectionsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const note of notes) {
      const conns = findConnectionsForNote(note, notes);
      map[note.id] = conns.length;
    }
    return map;
  }, [notes]);

  // Filtered notes for Library tab
  const filteredNotes = useMemo(() => {
    return searchNotes(notes, {
      query: searchQuery,
      type: selectedType,
      tag: selectedTag,
      onlyFavorites,
      onlyDueForReview: onlyDue,
    });
  }, [notes, searchQuery, selectedType, selectedTag, onlyFavorites, onlyDue]);

  // Spaced Repetition Due Cards
  const dueItems = useMemo(() => getDueFlashcards(notes), [notes]);
  const srsStats = useMemo(() => calculateSRSStats(notes), [notes]);

  // Collect all unique tags across all notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tagSet.add(t.toLowerCase())));
    return Array.from(tagSet).sort();
  }, [notes]);

  // Handlers for Note CRUD
  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      if (editingNote) {
        const updated = await updateNote({
          ...editingNote,
          ...noteData,
        } as Note);
        setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
        if (activeDetailNote?.id === updated.id) {
          setActiveDetailNote(updated);
        }
      } else {
        const created = await createNote(noteData as any);
        setNotes(prev => [created, ...prev]);
        setSelectedGraphNoteId(created.id);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save note.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (selectedGraphNoteId === noteId) {
        setSelectedGraphNoteId(null);
      }
      if (activeDetailNote?.id === noteId) {
        setActiveDetailNote(null);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to delete note.');
    }
  };

  const handleToggleFavorite = async (note: Note) => {
    const updated = { ...note, favorite: !note.favorite };
    await updateNote(updated);
    setNotes(prev => prev.map(n => (n.id === note.id ? updated : n)));
    if (activeDetailNote?.id === note.id) {
      setActiveDetailNote(updated);
    }
  };

  const handleReviewCard = async (noteId: string, updatedCard: Flashcard) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (!targetNote) return;

    const updatedCards = targetNote.flashcards.map(c =>
      c.id === updatedCard.id ? updatedCard : c
    );
    const updated = { ...targetNote, flashcards: updatedCards };
    await updateNote(updated);
    setNotes(prev => prev.map(n => (n.id === noteId ? updated : n)));
    if (activeDetailNote?.id === noteId) {
      setActiveDetailNote(updated);
    }
  };

  const handleStartReviewForNote = (note: Note) => {
    const items = note.flashcards.map(card => ({ note, card }));
    setCustomSRSQueue(items);
    setIsSRSReviewVisible(true);
  };

  const handleResetSeedData = async () => {
    const seeded = await resetToSeedData();
    setNotes(seeded);
    if (seeded.length > 0) {
      setSelectedGraphNoteId(seeded[0].id);
    }
  };

  const handleClearAllNotes = async () => {
    try {
      const empty = await clearAllNotes();
      setNotes(empty);
      setSelectedGraphNoteId(null);
      setActiveDetailNote(null);
    } catch (e) {
      console.error('Error clearing notes:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Synthesizing Memory Mesh...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1, position: 'relative' }}>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

        {/* Top Application Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="git-network" size={18} color={Colors.primaryLight} />
            </View>
            <View>
              <Text style={styles.appTitle}>Memory Mesh</Text>
              <Text style={styles.appSubtitle}>
                {notes.length} concepts • {Object.values(connectionsMap).reduce((a, b) => a + b, 0) / 2 | 0} connections
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setIsAnalyticsVisible(true)}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="analytics-outline" size={20} color={Colors.cyan} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Tab Content */}
        <View style={styles.mainContent}>
          {activeTab === 'mesh' && (
            <View style={styles.tabMeshContainer}>
              {/* Category Filter Pills */}
              <View style={styles.filterPillsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
                  <TouchableOpacity
                    onPress={() => setSelectedType('all')}
                    style={[styles.filterPill, selectedType === 'all' && styles.filterPillActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterPillText, selectedType === 'all' && styles.filterPillTextActive]}>
                      All Nodes
                    </Text>
                  </TouchableOpacity>

                  {Object.entries(NoteTypeMeta).map(([typeKey, meta]) => {
                    const isSelected = selectedType === typeKey;
                    return (
                      <TouchableOpacity
                        key={typeKey}
                        onPress={() => setSelectedType(isSelected ? 'all' : (typeKey as NoteType))}
                        style={[
                          styles.filterPill,
                          isSelected && { backgroundColor: meta.bgColor, borderColor: meta.color },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={meta.icon as any}
                          size={12}
                          color={isSelected ? meta.color : Colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected && { color: meta.color, fontWeight: '700' },
                          ]}
                        >
                          {meta.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Visual Knowledge Graph */}
              <ScrollView contentContainerStyle={styles.graphScrollArea}>
                <KnowledgeGraph
                  notes={notes}
                  selectedNoteId={selectedGraphNoteId}
                  onSelectNote={id => setSelectedGraphNoteId(id)}
                  onOpenNoteDetail={id => {
                    const target = notes.find(n => n.id === id);
                    if (target) setActiveDetailNote(target);
                  }}
                  filterType={selectedType}
                />

                {/* Helpful Graph Interaction Hint */}
                <View style={styles.graphHintCard}>
                  <Ionicons name="information-circle-outline" size={16} color={Colors.primaryLight} />
                  <Text style={styles.graphHintText}>
                    Drag canvas to pan • Pinch / tap +/- to zoom • Tap nodes to inspect synaptic connections
                  </Text>
                </View>
              </ScrollView>
            </View>
          )}

          {activeTab === 'notes' && (
            <View style={styles.tabNotesContainer}>
              {/* Search Bar */}
              <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search notes, concepts, code, tags..."
                  placeholderTextColor={Colors.textMuted}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Filter Chips: Starred, Due, Type */}
              <View style={styles.quickFiltersRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersContent}>
                  <TouchableOpacity
                    onPress={() => setOnlyFavorites(!onlyFavorites)}
                    style={[styles.quickFilterChip, onlyFavorites && styles.quickFilterChipActive]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="star"
                      size={12}
                      color={onlyFavorites ? Colors.amber : Colors.textMuted}
                    />
                    <Text style={[styles.quickFilterText, onlyFavorites && { color: Colors.amber }]}>
                      Starred
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setOnlyDue(!onlyDue)}
                    style={[styles.quickFilterChip, onlyDue && styles.quickFilterChipActive]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="school"
                      size={12}
                      color={onlyDue ? Colors.emerald : Colors.textMuted}
                    />
                    <Text style={[styles.quickFilterText, onlyDue && { color: Colors.emerald }]}>
                      Due for Review ({dueItems.length})
                    </Text>
                  </TouchableOpacity>

                  {allTags.slice(0, 8).map(tag => {
                    const isTagSelected = selectedTag === tag;
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => setSelectedTag(isTagSelected ? null : tag)}
                        style={[
                          styles.quickFilterChip,
                          isTagSelected && { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.quickFilterText,
                            isTagSelected && { color: Colors.primaryLight, fontWeight: '700' },
                          ]}
                        >
                          #{tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Note Cards List */}
              <FlatList
                data={filteredNotes}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.notesListContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <NoteCard
                    note={item}
                    connectionCount={connectionsMap[item.id] || 0}
                    onPress={() => {
                      setActiveDetailNote(item);
                    }}
                    onToggleFavorite={() => handleToggleFavorite(item)}
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyListState}>
                    <Ionicons name="search-outline" size={44} color={Colors.textMuted} />
                    <Text style={styles.emptyListTitle}>No Notes Found</Text>
                    <Text style={styles.emptyListSubtitle}>
                      Try clearing search query or adjusting active filters.
                    </Text>
                  </View>
                }
              />
            </View>
          )}

          {activeTab === 'review' && (
            <ScrollView contentContainerStyle={styles.reviewTabContent}>
              {/* SRS Header Card */}
              <View style={styles.srsHeroCard}>
                <View style={styles.srsHeroHeader}>
                  <View style={styles.srsHeroTitleGroup}>
                    <Text style={styles.srsHeroTitle}>Spaced Repetition</Text>
                    <Text style={styles.srsHeroSubtitle}>
                      Continuous recall prevents the exponential forgetting curve
                    </Text>
                  </View>
                  <View style={styles.srsHeroBadge}>
                    <Ionicons name="flame" size={18} color={Colors.amber} />
                    <Text style={styles.srsStreakText}>Active</Text>
                  </View>
                </View>

                {/* Stats Matrix */}
                <View style={styles.srsStatsMatrix}>
                  <View style={styles.srsStatBox}>
                    <Text style={[styles.srsStatValue, { color: Colors.emerald }]}>
                      {dueItems.length}
                    </Text>
                    <Text style={styles.srsStatName}>Due Today</Text>
                  </View>

                  <View style={styles.srsStatBox}>
                    <Text style={styles.srsStatValue}>{srsStats.totalCards}</Text>
                    <Text style={styles.srsStatName}>Total Cards</Text>
                  </View>

                  <View style={styles.srsStatBox}>
                    <Text style={[styles.srsStatValue, { color: Colors.cyan }]}>
                      {srsStats.masteredCards}
                    </Text>
                    <Text style={styles.srsStatName}>Mastered</Text>
                  </View>

                  <View style={styles.srsStatBox}>
                    <Text style={[styles.srsStatValue, { color: Colors.amber }]}>
                      {srsStats.retentionRate}%
                    </Text>
                    <Text style={styles.srsStatName}>Retention</Text>
                  </View>
                </View>

                {/* Start Due Review CTA */}
                <TouchableOpacity
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch {}
                    setCustomSRSQueue(null);
                    setIsSRSReviewVisible(true);
                  }}
                  disabled={dueItems.length === 0}
                  style={[
                    styles.startReviewBtn,
                    dueItems.length === 0 && styles.startReviewBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play" size={18} color="#FFFFFF" />
                  <Text style={styles.startReviewText}>
                    {dueItems.length > 0
                      ? `Start Review Session (${dueItems.length} Due)`
                      : 'All Caught Up For Today!'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Due Notes List */}
              <Text style={styles.reviewSectionHeading}>CARDS READY FOR RECALL</Text>
              {dueItems.length === 0 ? (
                <View style={styles.reviewEmptyCard}>
                  <Ionicons name="checkmark-circle" size={36} color={Colors.emerald} />
                  <Text style={styles.reviewEmptyTitle}>No Cards Due Right Now</Text>
                  <Text style={styles.reviewEmptyText}>
                    Great job staying on top of your recall! Add new flashcards inside your notes anytime.
                  </Text>
                </View>
              ) : (
                dueItems.map(({ note, card }) => (
                  <TouchableOpacity
                    key={card.id}
                    onPress={() => handleStartReviewForNote(note)}
                    style={styles.dueCardItem}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dueCardHeader}>
                      <Text style={styles.dueCardNoteTitle} numberOfLines={1}>
                        {note.title}
                      </Text>
                      <View style={styles.dueIntervalPill}>
                        <Text style={styles.dueIntervalText}>Rep: {card.repetition}</Text>
                      </View>
                    </View>
                    <Text style={styles.dueCardPrompt} numberOfLines={2}>
                      {card.front}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>

        {/* Bottom Navigation Tabs */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            onPress={() => setActiveTab('mesh')}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'mesh' ? 'git-network' : 'git-network-outline'}
              size={22}
              color={activeTab === 'mesh' ? Colors.primaryLight : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'mesh' && styles.tabLabelActive,
              ]}
            >
              Mesh
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('notes')}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'notes' ? 'library' : 'library-outline'}
              size={22}
              color={activeTab === 'notes' ? Colors.primaryLight : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'notes' && styles.tabLabelActive,
              ]}
            >
              Library
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('review')}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={activeTab === 'review' ? 'school' : 'school-outline'}
                size={22}
                color={activeTab === 'review' ? Colors.primaryLight : Colors.textMuted}
              />
              {dueItems.length > 0 && <View style={styles.tabBadgeDot} />}
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'review' && styles.tabLabelActive,
              ]}
            >
              Review
            </Text>
          </TouchableOpacity>
        </View>

        {/* Floating Action Button (Quick Capture) - placed on top */}
        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            setEditingNote(null);
            setIsEditorVisible(true);
          }}
          style={styles.fab}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Full-screen overlays outside container with absolute fill */}
      {activeDetailNote && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 100 }]}>
          <NoteDetailModal
            visible={true}
            note={activeDetailNote}
            allNotes={notes}
            onClose={() => setActiveDetailNote(null)}
            onEditNote={note => {
              setActiveDetailNote(null);
              setEditingNote(note);
              setIsEditorVisible(true);
            }}
            onDeleteNote={handleDeleteNote}
            onToggleFavorite={handleToggleFavorite}
            onSelectConnectedNote={targetId => {
              const target = notes.find(n => n.id === targetId);
              if (target) {
                setActiveDetailNote(target);
                setSelectedGraphNoteId(target.id);
              }
            }}
            onStartReviewForNote={handleStartReviewForNote}
          />
        </View>
      )}

      {isEditorVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 100 }]}>
          <NoteEditorModal
            visible={true}
            initialNote={editingNote}
            allNotes={notes}
            onClose={() => {
              setIsEditorVisible(false);
              setEditingNote(null);
            }}
            onSave={handleSaveNote}
          />
        </View>
      )}

      {isSRSReviewVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 100 }]}>
          <FlashcardReviewModal
            visible={true}
            onClose={() => setIsSRSReviewVisible(false)}
            queue={customSRSQueue || dueItems}
            onReviewCard={handleReviewCard}
          />
        </View>
      )}

      {isAnalyticsVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 100 }]}>
          <MeshAnalyticsModal
            visible={true}
            notes={notes}
            onClose={() => setIsAnalyticsVisible(false)}
            onResetSeedData={handleResetSeedData}
            onClearAll={handleClearAllNotes}
          />
        </View>
      )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 11,
    color: Colors.cyan,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
  },
  tabMeshContainer: {
    flex: 1,
  },
  filterPillsWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterPills: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  graphScrollArea: {
    padding: 16,
    paddingBottom: 80,
  },
  graphHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    marginTop: 12,
  },
  graphHintText: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
    flex: 1,
  },
  tabNotesContainer: {
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
  },
  quickFiltersRow: {
    paddingBottom: 8,
  },
  quickFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickFilterChipActive: {
    borderColor: Colors.amber,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  quickFilterText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  notesListContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  emptyListState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyListSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  reviewTabContent: {
    padding: 16,
    paddingBottom: 80,
  },
  srsHeroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 20,
  },
  srsHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  srsHeroTitleGroup: {
    flex: 1,
    marginRight: 10,
  },
  srsHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  srsHeroSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
    lineHeight: 17,
  },
  srsHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amberMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  srsStreakText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.amber,
  },
  srsStatsMatrix: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    marginBottom: 16,
  },
  srsStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  srsStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  srsStatName: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  startReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
  },
  startReviewBtnDisabled: {
    backgroundColor: '#1E293B',
  },
  startReviewText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewSectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  reviewEmptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  reviewEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  reviewEmptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  dueCardItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  dueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dueCardNoteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryLight,
    flex: 1,
    marginRight: 8,
  },
  dueIntervalPill: {
    backgroundColor: Colors.cyanMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dueIntervalText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cyan,
  },
  dueCardPrompt: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 90 : 74,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 100,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0C111E',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 30 : 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.emerald,
  },
});
