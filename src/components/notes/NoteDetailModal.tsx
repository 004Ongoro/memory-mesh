import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Note } from '../../types/note';
import { Colors, NoteTypeMeta } from '../../theme/colors';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import { CodeBlock } from '../markdown/CodeBlock';
import { findConnectionsForNote } from '../../services/connectionEngine';

interface NoteDetailModalProps {
  visible: boolean;
  note: Note | null;
  allNotes: Note[];
  onClose: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleFavorite: (note: Note) => void;
  onSelectConnectedNote: (targetNoteId: string) => void;
  onStartReviewForNote: (note: Note) => void;
}

export function NoteDetailModal({
  visible,
  note,
  allNotes,
  onClose,
  onEditNote,
  onDeleteNote,
  onToggleFavorite,
  onSelectConnectedNote,
  onStartReviewForNote,
}: NoteDetailModalProps) {
  if (!visible || !note) return null;

  const meta = NoteTypeMeta[note.type] || NoteTypeMeta.concept;
  const connections = findConnectionsForNote(note, allNotes);

  const handleDelete = () => {
    Alert.alert('Delete Note', `Are you sure you want to delete "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDeleteNote(note.id);
          onClose();
        },
      },
    ]);
  };

  const handleWikilinkPress = (targetTitle: string) => {
    const query = targetTitle.toLowerCase().trim();
    const target =
      allNotes.find(n => n.title.toLowerCase().trim() === query) ||
      allNotes.find(n => n.title.toLowerCase().includes(query)) ||
      allNotes.find(n => query.includes(n.title.toLowerCase()));

    if (target) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      onSelectConnectedNote(target.id);
    } else {
      Alert.alert('Note Not Found', `No note named "${targetTitle}" exists in your mesh yet.`);
    }
  };

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, styles.safeArea]} edges={['top', 'left', 'right', 'bottom']}>
        {/* Top Navbar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.navBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.navActions}>
            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onToggleFavorite(note);
              }}
              style={styles.navBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={note.favorite ? 'star' : 'star-outline'}
                size={20}
                color={note.favorite ? Colors.amber : Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onEditNote(note);
              }}
              style={styles.navBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} style={styles.navBtn} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={20} color={Colors.rose} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Pill & Date */}
          <View style={styles.metaRow}>
            <View style={[styles.typePill, { backgroundColor: meta.bgColor }]}>
              <Ionicons name={meta.icon as any} size={12} color={meta.color} />
              <Text style={[styles.typePillText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{note.title}</Text>

          {/* Author or Source */}
          {(note.author || note.sourceUrl) && (
            <View style={styles.sourceBox}>
              {note.author && (
                <View style={styles.sourceItem}>
                  <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.sourceText}>{note.author}</Text>
                </View>
              )}
              {note.sourceUrl && (
                <View style={styles.sourceItem}>
                  <Ionicons name="globe-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.sourceText} numberOfLines={1}>
                    {note.sourceUrl}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Screenshot / Image if present */}
          {note.imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: note.imageUri }} style={styles.attachedImage} resizeMode="cover" />
            </View>
          )}

          {/* Markdown Content */}
          <View style={styles.markdownWrapper}>
            <MarkdownRenderer
              content={note.content}
              onPressWikilink={handleWikilinkPress}
            />
          </View>

          {/* Explicit Code Snippet if present */}
          {note.codeSnippet && note.codeSnippet.code ? (
            <View style={styles.codeSnippetSection}>
              <Text style={styles.sectionHeading}>CODE SNIPPET</Text>
              <CodeBlock
                code={note.codeSnippet.code}
                language={note.codeSnippet.language || 'typescript'}
              />
            </View>
          ) : null}

          {/* Tags */}
          {note.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {note.tags.map(tag => (
                <View key={tag} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Mesh Connections Section */}
          <View style={styles.meshSection}>
            <View style={styles.meshSectionHeader}>
              <View style={styles.meshIconTitle}>
                <Ionicons name="git-network-outline" size={18} color={Colors.primaryLight} />
                <Text style={styles.sectionHeading}>CONNECTED IN MESH ({connections.length})</Text>
              </View>
            </View>

            {connections.length === 0 ? (
              <View style={styles.emptyConnectionsBox}>
                <Text style={styles.emptyConnectionsText}>
                  No connections detected yet. As you add more notes with related concepts or wikilinks, Memory Mesh will automatically form synaptic links.
                </Text>
              </View>
            ) : (
              <View style={styles.connectionList}>
                {connections.map(conn => {
                  const target = allNotes.find(n => n.id === conn.targetNoteId);
                  const targetMeta = target ? NoteTypeMeta[target.type] : NoteTypeMeta.concept;

                  return (
                    <TouchableOpacity
                      key={conn.targetNoteId}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch {}
                        onSelectConnectedNote(conn.targetNoteId);
                      }}
                      style={styles.connectionCard}
                      activeOpacity={0.7}
                    >
                      <View style={styles.connectionTop}>
                        <View style={styles.connectionTitleRow}>
                          <View
                            style={[
                              styles.connectionTypeDot,
                              { backgroundColor: targetMeta.color },
                            ]}
                          />
                          <Text style={styles.connectionTitle} numberOfLines={1}>
                            {conn.targetNoteTitle}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                      </View>
                      <Text style={styles.connectionReason} numberOfLines={1}>
                        {conn.reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Spaced Repetition Flashcards Section */}
          <View style={styles.srsSection}>
            <View style={styles.srsSectionHeader}>
              <View style={styles.meshIconTitle}>
                <Ionicons name="school-outline" size={18} color={Colors.emerald} />
                <Text style={styles.sectionHeading}>ACTIVE RECALL ({note.flashcards.length})</Text>
              </View>
              {note.flashcards.length > 0 && (
                <TouchableOpacity
                  onPress={() => onStartReviewForNote(note)}
                  style={styles.practiceBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play" size={12} color="#FFFFFF" />
                  <Text style={styles.practiceBtnText}>Practice</Text>
                </TouchableOpacity>
              )}
            </View>

            {note.flashcards.length === 0 ? (
              <View style={styles.emptySRSBox}>
                <Text style={styles.emptySRSText}>
                  No flashcards attached to this note. Edit this note to add atomic prompts for spaced repetition review!
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {note.flashcards.map((card, idx) => (
                  <View key={card.id || idx} style={styles.cardItem}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardIndex}>CARD {idx + 1}</Text>
                      <Text style={styles.cardMeta}>
                        Streak: {card.repetition} • Interval: {card.interval}d
                      </Text>
                    </View>
                    <Text style={styles.cardFront}>{card.front}</Text>
                    <View style={styles.cardDivider} />
                    <Text style={styles.cardBack}>{card.back}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    zIndex: 100,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  sourceBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  imageContainer: {
    marginVertical: 14,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attachedImage: {
    width: '100%',
    height: 220,
  },
  markdownWrapper: {
    marginVertical: 12,
  },
  codeSnippetSection: {
    marginTop: 14,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 14,
  },
  tagBadge: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  meshSection: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  meshSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  meshIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyConnectionsBox: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyConnectionsText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textMuted,
  },
  connectionList: {
    gap: 8,
  },
  connectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  connectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  connectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  connectionTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  connectionReason: {
    fontSize: 11,
    color: Colors.cyan,
    marginLeft: 16,
  },
  srsSection: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  srsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  practiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  practiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySRSBox: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptySRSText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textMuted,
  },
  cardList: {
    gap: 10,
  },
  cardItem: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardIndex: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryLight,
  },
  cardMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cardFront: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  cardBack: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
