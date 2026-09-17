import { Flashcard, Note } from '../types/note';

export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

/**
 * SuperMemo SM-2 algorithm implementation for offline flashcard scheduling.
 */
export function processSRSReview(card: Flashcard, rating: SRSRating): Flashcard {
  let { repetition, interval, easeFactor, lapses } = card;

  // Grade mapping:
  // again: 1
  // hard: 3
  // good: 4
  // easy: 5
  let grade = 4;
  if (rating === 'again') grade = 1;
  else if (rating === 'hard') grade = 3;
  else if (rating === 'good') grade = 4;
  else if (rating === 'easy') grade = 5;

  if (grade < 3) {
    // Incorrect / lapsed recall
    repetition = 0;
    interval = 1;
    lapses += 1;
  } else {
    // Correct recall
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = rating === 'hard' ? 2 : 4;
    } else {
      const multiplier = rating === 'easy' ? easeFactor * 1.25 : rating === 'hard' ? 1.2 : easeFactor;
      interval = Math.round(interval * multiplier);
    }
    repetition += 1;
  }

  // Update Ease Factor (EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)))
  const efDelta = 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
  easeFactor = Math.max(1.3, Number((easeFactor + efDelta).toFixed(2)));

  const now = new Date();
  const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    ...card,
    repetition,
    interval,
    easeFactor,
    lapses,
    lastReviewedDate: now.toISOString(),
    dueDate: nextDueDate.toISOString(),
  };
}

/**
 * Get all cards due for review (due date <= now).
 */
export function getDueFlashcards(notes: Note[]): { note: Note; card: Flashcard }[] {
  const now = new Date().toISOString();
  const dueItems: { note: Note; card: Flashcard }[] = [];

  for (const note of notes) {
    for (const card of note.flashcards) {
      if (!card.dueDate || card.dueDate <= now) {
        dueItems.push({ note, card });
      }
    }
  }

  return dueItems;
}

/**
 * Get overall SRS statistics across all notes.
 */
export interface SRSStats {
  totalCards: number;
  dueCards: number;
  learnedCards: number; // repetition >= 3
  masteredCards: number; // interval >= 21 days
  totalLapses: number;
  retentionRate: number;
}

export function calculateSRSStats(notes: Note[]): SRSStats {
  const now = new Date().toISOString();
  let totalCards = 0;
  let dueCards = 0;
  let learnedCards = 0;
  let masteredCards = 0;
  let totalLapses = 0;
  let successfulReviews = 0;

  for (const note of notes) {
    for (const card of note.flashcards) {
      totalCards += 1;
      if (!card.dueDate || card.dueDate <= now) {
        dueCards += 1;
      }
      if (card.repetition >= 3) {
        learnedCards += 1;
      }
      if (card.interval >= 21) {
        masteredCards += 1;
      }
      totalLapses += card.lapses || 0;
      successfulReviews += card.repetition;
    }
  }

  const totalReviews = successfulReviews + totalLapses;
  const retentionRate = totalReviews > 0 ? Math.round((successfulReviews / totalReviews) * 100) : 100;

  return {
    totalCards,
    dueCards,
    learnedCards,
    masteredCards,
    totalLapses,
    retentionRate,
  };
}
