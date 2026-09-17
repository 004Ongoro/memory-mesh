import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../../types/note';
import { Colors, NoteTypeMeta } from '../../theme/colors';

interface NoteCardProps {
  note: Note;
  connectionCount: number;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

export function NoteCard({ note, connectionCount, onPress, onToggleFavorite }: NoteCardProps) {
  const meta = NoteTypeMeta[note.type] || NoteTypeMeta.concept;

  // Snippet text without markdown symbols
  const snippet = note.content
    .replace(/[#*`>_\[\]]/g, '')
    .trim()
    .slice(0, 110);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { borderLeftColor: meta.color }]}
    >
      {/* Top row: Type Pill, Date, Favorite */}
      <View style={styles.topRow}>
        <View style={[styles.typePill, { backgroundColor: meta.bgColor }]}>
          <Ionicons name={meta.icon as any} size={11} color={meta.color} />
          <Text style={[styles.typePillText, { color: meta.color }]}>{meta.label}</Text>
        </View>

        <View style={styles.topRight}>
          <Text style={styles.dateText}>
            {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>

          {onToggleFavorite && (
            <TouchableOpacity
              onPress={() => onToggleFavorite()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={note.favorite ? 'star' : 'star-outline'}
                size={16}
                color={note.favorite ? Colors.amber : Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Note Title */}
      <Text style={styles.title} numberOfLines={2}>
        {note.title}
      </Text>

      {/* Content preview snippet */}
      {snippet.length > 0 && (
        <Text style={styles.snippet} numberOfLines={2}>
          {snippet}
        </Text>
      )}

      {/* Bottom meta row: Connections count, Flashcards count, Code badge, Tags */}
      <View style={styles.bottomRow}>
        <View style={styles.statsGroup}>
          {connectionCount > 0 && (
            <View style={styles.metaBadge}>
              <Ionicons name="git-network-outline" size={12} color={Colors.cyan} />
              <Text style={[styles.metaBadgeText, { color: Colors.cyan }]}>
                {connectionCount}
              </Text>
            </View>
          )}

          {note.flashcards && note.flashcards.length > 0 && (
            <View style={styles.metaBadge}>
              <Ionicons name="school-outline" size={12} color={Colors.emerald} />
              <Text style={[styles.metaBadgeText, { color: Colors.emerald }]}>
                {note.flashcards.length}
              </Text>
            </View>
          )}

          {note.codeSnippet && (
            <View style={styles.metaBadge}>
              <Ionicons name="code-slash" size={12} color={Colors.primaryLight} />
              <Text style={[styles.metaBadgeText, { color: Colors.primaryLight }]}>
                {note.codeSnippet.language || 'code'}
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.tagsGroup}>
          {note.tags.slice(0, 2).map(tag => (
            <View key={tag} style={styles.tagBadge}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {note.tags.length > 2 && (
            <Text style={styles.tagOverflow}>+{note.tags.length - 2}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3.5,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  typePillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 5,
    lineHeight: 21,
  },
  snippet: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  statsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10.5,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tagOverflow: {
    fontSize: 10.5,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
