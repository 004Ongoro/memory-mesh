import { Note, NoteType } from '../types/note';

export interface SearchFilters {
  query?: string;
  type?: NoteType | 'all';
  tag?: string | null;
  onlyFavorites?: boolean;
  onlyDueForReview?: boolean;
}

export function searchNotes(notes: Note[], filters: SearchFilters): Note[] {
  const { query, type, tag, onlyFavorites, onlyDueForReview } = filters;
  const now = new Date().toISOString();
  const trimmedQuery = (query || '').trim().toLowerCase();
  const queryTokens = trimmedQuery.split(/\s+/).filter(Boolean);

  return notes
    .map(note => {
      // Filter by type
      if (type && type !== 'all' && note.type !== type) {
        return { note, score: -1 };
      }

      // Filter by tag
      if (tag && !note.tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
        return { note, score: -1 };
      }

      // Filter by favorite
      if (onlyFavorites && !note.favorite) {
        return { note, score: -1 };
      }

      // Filter by due for review
      if (onlyDueForReview) {
        const hasDueCard = note.flashcards.some(c => !c.dueDate || c.dueDate <= now);
        if (!hasDueCard) return { note, score: -1 };
      }

      // If no query string, keep matching items
      if (queryTokens.length === 0) {
        return { note, score: 1 };
      }

      let score = 0;
      const titleLower = note.title.toLowerCase();
      const contentLower = note.content.toLowerCase();
      const codeLower = note.codeSnippet?.code.toLowerCase() || '';
      const authorLower = note.author?.toLowerCase() || '';
      const tagsLower = note.tags.map(t => t.toLowerCase()).join(' ');

      for (const token of queryTokens) {
        let tokenFound = false;

        // Exact Title Match (huge boost)
        if (titleLower.includes(token)) {
          score += 15;
          if (titleLower.startsWith(token)) score += 10;
          tokenFound = true;
        }

        // Tag match
        if (tagsLower.includes(token)) {
          score += 10;
          tokenFound = true;
        }

        // Author match
        if (authorLower.includes(token)) {
          score += 8;
          tokenFound = true;
        }

        // Content match
        if (contentLower.includes(token)) {
          score += 5;
          tokenFound = true;
        }

        // Code match
        if (codeLower.includes(token)) {
          score += 4;
          tokenFound = true;
        }

        if (!tokenFound) {
          // Token wasn't found in any field -> fails multi-term search
          return { note, score: -1 };
        }
      }

      return { note, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.note);
}
