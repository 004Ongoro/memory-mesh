import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Flashcard, Note } from '../../types/note';
import { processSRSReview, SRSRating } from '../../services/srsEngine';
import { Colors, NoteTypeMeta } from '../../theme/colors';

interface FlashcardReviewModalProps {
  visible: boolean;
  onClose: () => void;
  queue: { note: Note; card: Flashcard }[];
  onReviewCard: (noteId: string, updatedCard: Flashcard) => void;
}

export function FlashcardReviewModal({
  visible,
  onClose,
  queue,
  onReviewCard,
}: FlashcardReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentItem = queue[currentIndex];

  const handleRating = async (rating: SRSRating) => {
    if (!currentItem) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const updatedCard = processSRSReview(currentItem.card, rating);
    onReviewCard(currentItem.note.id, updatedCard);
    setReviewedCount(c => c + 1);

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(i => i + 1);
      setShowAnswer(false);
    } else {
      setSessionCompleted(true);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionCompleted(false);
    setReviewedCount(0);
    onClose();
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, styles.safeArea]} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={resetSession} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Spaced Repetition Review</Text>
            {!sessionCompleted && queue.length > 0 && (
              <Text style={styles.headerSubtitle}>
                Card {currentIndex + 1} of {queue.length}
              </Text>
            )}
          </View>
          <View style={{ width: 36 }} />
        </View>

        {sessionCompleted ? (
          /* Session Complete Screen */
          <View style={styles.completeContainer}>
            <View style={styles.celebrationIconWrap}>
              <Ionicons name="trophy" size={54} color={Colors.amber} />
            </View>
            <Text style={styles.completeTitle}>Review Session Completed!</Text>
            <Text style={styles.completeSubtitle}>
              You strengthened {reviewedCount} memory traces today. Expanding intervals will reinforce long-term recall.
            </Text>

            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{reviewedCount}</Text>
                <Text style={styles.statLabel}>Cards Studied</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: Colors.emerald }]}>100%</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            <TouchableOpacity onPress={resetSession} style={styles.doneButton} activeOpacity={0.8}>
              <Text style={styles.doneButtonText}>Back to Memory Mesh</Text>
            </TouchableOpacity>
          </View>
        ) : !currentItem ? (
          /* Empty Queue */
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color={Colors.emerald} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>No cards due for review right now. Keep learning!</Text>
            <TouchableOpacity onPress={resetSession} style={styles.doneButton} activeOpacity={0.8}>
              <Text style={styles.doneButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Active Review Session */
          <ScrollView contentContainerStyle={styles.cardScroll}>
            {/* Associated Note Banner */}
            <View style={styles.noteContextBanner}>
              <View
                style={[
                  styles.noteTypeDot,
                  { backgroundColor: NoteTypeMeta[currentItem.note.type]?.color || Colors.primary },
                ]}
              />
              <Text style={styles.noteContextText} numberOfLines={1}>
                Note: {currentItem.note.title}
              </Text>
            </View>

            {/* Flashcard Surface */}
            <View style={styles.flashcard}>
              {/* Question Side */}
              <View style={styles.sideHeader}>
                <Text style={styles.sideLabel}>QUESTION / PROMPT</Text>
                <Text style={styles.intervalHint}>
                  Streak: {currentItem.card.repetition} • Interval: {currentItem.card.interval}d
                </Text>
              </View>
              <Text style={styles.promptText}>{currentItem.card.front}</Text>

              {/* Divider & Answer */}
              {showAnswer ? (
                <View style={styles.answerSection}>
                  <View style={styles.answerDivider} />
                  <View style={styles.sideHeader}>
                    <Text style={[styles.sideLabel, { color: Colors.emerald }]}>
                      ANSWER / EXPLANATION
                    </Text>
                  </View>
                  <Text style={styles.answerText}>{currentItem.card.back}</Text>
                </View>
              ) : null}
            </View>

            {/* Bottom Actions */}
            {!showAnswer ? (
              <TouchableOpacity
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setShowAnswer(true);
                }}
                style={styles.showAnswerButton}
                activeOpacity={0.8}
              >
                <Text style={styles.showAnswerText}>Show Answer</Text>
                <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.ratingsContainer}>
                <Text style={styles.ratingTitle}>How well did you remember this?</Text>
                <View style={styles.ratingButtonsRow}>
                  {/* Again */}
                  <TouchableOpacity
                    onPress={() => handleRating('again')}
                    style={[styles.ratingBtn, { borderColor: Colors.srs.again }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.ratingBtnText, { color: Colors.srs.again }]}>Again</Text>
                    <Text style={styles.ratingInterval}>1 day</Text>
                  </TouchableOpacity>

                  {/* Hard */}
                  <TouchableOpacity
                    onPress={() => handleRating('hard')}
                    style={[styles.ratingBtn, { borderColor: Colors.srs.hard }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.ratingBtnText, { color: Colors.srs.hard }]}>Hard</Text>
                    <Text style={styles.ratingInterval}>2 days</Text>
                  </TouchableOpacity>

                  {/* Good */}
                  <TouchableOpacity
                    onPress={() => handleRating('good')}
                    style={[styles.ratingBtn, { borderColor: Colors.srs.good }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.ratingBtnText, { color: Colors.srs.good }]}>Good</Text>
                    <Text style={styles.ratingInterval}>
                      {Math.max(3, currentItem.card.interval * 2)}d
                    </Text>
                  </TouchableOpacity>

                  {/* Easy */}
                  <TouchableOpacity
                    onPress={() => handleRating('easy')}
                    style={[styles.ratingBtn, { borderColor: Colors.srs.easy }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.ratingBtnText, { color: Colors.srs.easy }]}>Easy</Text>
                    <Text style={styles.ratingInterval}>
                      {Math.max(6, Math.round(currentItem.card.interval * 2.5))}d
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}
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
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardScroll: {
    padding: 18,
    paddingBottom: 40,
  },
  noteContextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    gap: 8,
  },
  noteTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noteContextText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  flashcard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 20,
    minHeight: 280,
    justifyContent: 'flex-start',
  },
  sideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sideLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryLight,
    letterSpacing: 0.8,
  },
  intervalHint: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  promptText: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '600',
    color: Colors.text,
  },
  answerSection: {
    marginTop: 18,
  },
  answerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#E2E8F0',
  },
  showAnswerButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  showAnswerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratingsContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  ratingButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  ratingBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ratingBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ratingInterval: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  celebrationIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.amberMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    width: '100%',
    marginBottom: 28,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
