import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../../types/note';
import { Colors, NoteTypeMeta } from '../../theme/colors';
import { buildKnowledgeGraph } from '../../services/connectionEngine';
import { calculateSRSStats } from '../../services/srsEngine';

interface MeshAnalyticsModalProps {
  visible: boolean;
  notes: Note[];
  onClose: () => void;
  onResetSeedData: () => void;
  onClearAll?: () => void;
}

export function MeshAnalyticsModal({
  visible,
  notes,
  onClose,
  onResetSeedData,
  onClearAll,
}: MeshAnalyticsModalProps) {
  if (!visible) return null;

  const graph = buildKnowledgeGraph(notes);
  const srsStats = calculateSRSStats(notes);

  // Calculate most connected notes
  const nodeDegrees: Record<string, number> = {};
  graph.edges.forEach(e => {
    nodeDegrees[e.source] = (nodeDegrees[e.source] || 0) + 1;
    nodeDegrees[e.target] = (nodeDegrees[e.target] || 0) + 1;
  });

  const sortedHubs = [...notes]
    .map(n => ({ note: n, degree: nodeDegrees[n.id] || 0 }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 5);

  // Note type breakdown
  const typeCounts: Record<string, number> = {};
  notes.forEach(n => {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  });

  const handleReset = () => {
    Alert.alert(
      'Load Sample Knowledge Base',
      'This will reload the rich starter concepts (React Hooks, State Management, Spaced Repetition, etc.). Any notes you added will be refreshed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Samples',
          style: 'destructive',
          onPress: () => {
            onResetSeedData();
            onClose();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clean Slate (Clear All Notes)',
      'This will remove all mock/seed notes so you can start with a 100% clean knowledge base. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            onClearAll?.();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, styles.safeArea]} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mesh & Learning Analytics</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollArea}>
          {/* Top Metric Cards */}
          <View style={styles.grid2x2}>
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primaryLight} />
              </View>
              <Text style={styles.statNumber}>{notes.length}</Text>
              <Text style={styles.statLabel}>Total Notes</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.cyanMuted }]}>
                <Ionicons name="git-network-outline" size={20} color={Colors.cyan} />
              </View>
              <Text style={[styles.statNumber, { color: Colors.cyan }]}>
                {graph.edges.length}
              </Text>
              <Text style={styles.statLabel}>Synaptic Links</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.emeraldMuted }]}>
                <Ionicons name="school-outline" size={20} color={Colors.emerald} />
              </View>
              <Text style={[styles.statNumber, { color: Colors.emerald }]}>
                {srsStats.totalCards}
              </Text>
              <Text style={styles.statLabel}>SRS Flashcards</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.amberMuted }]}>
                <Ionicons name="flame-outline" size={20} color={Colors.amber} />
              </View>
              <Text style={[styles.statNumber, { color: Colors.amber }]}>
                {srsStats.retentionRate}%
              </Text>
              <Text style={styles.statLabel}>Retention Score</Text>
            </View>
          </View>

          {/* Central Knowledge Hubs */}
          <Text style={styles.sectionTitle}>CENTRAL KNOWLEDGE HUBS</Text>
          <Text style={styles.sectionSubtitle}>
            Concepts with the highest synaptic connections across your mesh:
          </Text>

          <View style={styles.hubList}>
            {sortedHubs.map((item, idx) => {
              const meta = NoteTypeMeta[item.note.type] || NoteTypeMeta.concept;
              return (
                <View key={item.note.id} style={styles.hubItem}>
                  <Text style={styles.hubRank}>#{idx + 1}</Text>
                  <View style={[styles.hubDot, { backgroundColor: meta.color }]} />
                  <Text style={styles.hubTitle} numberOfLines={1}>
                    {item.note.title}
                  </Text>
                  <View style={styles.hubBadge}>
                    <Text style={styles.hubBadgeText}>{item.degree} links</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Content Distribution */}
          <Text style={styles.sectionTitle}>KNOWLEDGE DISTRIBUTION</Text>
          <View style={styles.distributionCard}>
            {Object.entries(NoteTypeMeta).map(([typeKey, meta]) => {
              const count = typeCounts[typeKey] || 0;
              const pct = notes.length > 0 ? Math.round((count / notes.length) * 100) : 0;

              return (
                <View key={typeKey} style={styles.distRow}>
                  <View style={styles.distLabelGroup}>
                    <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                    <Text style={styles.distLabelText}>{meta.label}</Text>
                  </View>
                  <View style={styles.distBarTrack}>
                    <View
                      style={[
                        styles.distBarFill,
                        { width: `${Math.max(pct, count > 0 ? 8 : 0)}%`, backgroundColor: meta.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.distCount}>{count}</Text>
                </View>
              );
            })}
          </View>

          {/* Demo Reset Section */}
          <View style={styles.resetCard}>
            <Ionicons name="refresh-circle-outline" size={28} color={Colors.primaryLight} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resetTitle}>Restore Sample Knowledge Base</Text>
              <Text style={styles.resetDesc}>
                Reloads React Hooks, State Management, and computer science concepts.
              </Text>
            </View>
            <TouchableOpacity onPress={handleReset} style={styles.resetActionBtn}>
              <Text style={styles.resetActionText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Clean Slate Section */}
          <View style={[styles.resetCard, { borderColor: Colors.rose + '40', marginTop: 12 }]}>
            <Ionicons name="trash-bin-outline" size={28} color={Colors.rose} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resetTitle, { color: Colors.rose }]}>Clean Slate (Production)</Text>
              <Text style={styles.resetDesc}>
                Clear all notes and mock data to start with an empty knowledge base.
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.resetActionBtn, { backgroundColor: Colors.rose + '20', borderColor: Colors.rose }]}
            >
              <Text style={[styles.resetActionText, { color: Colors.rose }]}>Clear</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollArea: {
    padding: 18,
    paddingBottom: 40,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  hubList: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 24,
    gap: 10,
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  hubRank: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryLight,
    width: 24,
  },
  hubDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  hubTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  hubBadge: {
    backgroundColor: Colors.cyanMuted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hubBadgeText: {
    fontSize: 11,
    color: Colors.cyan,
    fontWeight: '700',
  },
  distributionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 110,
  },
  distLabelText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  distBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  distBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    width: 24,
    textAlign: 'right',
  },
  resetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  resetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  resetDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  resetActionBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetActionText: {
    color: Colors.primaryLight,
    fontWeight: '700',
    fontSize: 12,
  },
});
