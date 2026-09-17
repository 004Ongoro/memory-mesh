export type NoteType = 
  | 'concept'
  | 'code'
  | 'article'
  | 'book'
  | 'idea'
  | 'reflection'
  | 'screenshot';

export interface Flashcard {
  id: string;
  front: string;          // Question or prompt
  back: string;           // Answer or explanation
  repetition: number;     // Number of consecutive successful reviews
  interval: number;       // In days
  easeFactor: number;     // Multiplier (starts at 2.5)
  dueDate: string;        // ISO string
  lastReviewedDate?: string;
  lapses: number;         // Count of "Again" ratings
}

export interface ManualLink {
  targetNoteId: string;
  targetTitle: string;
  reason?: string;
}

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  content: string;        // Markdown content
  codeSnippet?: {
    code: string;
    language: string;
  };
  imageUri?: string;      // For screenshots or attached diagrams
  tags: string[];
  manualLinks: ManualLink[]; // User-specified or confirmed links
  flashcards: Flashcard[];
  sourceUrl?: string;     // For articles or external docs
  author?: string;        // For book notes or articles
  createdAt: string;      // ISO string
  updatedAt: string;      // ISO string
  favorite?: boolean;
}

export interface DiscoveredConnection {
  targetNoteId: string;
  targetNoteTitle: string;
  score: number;          // 0 to 1
  matchedKeywords: string[];
  reason: string;
}

export interface GraphNode {
  id: string;
  title: string;
  type: NoteType;
  tagCount: number;
  connectionsCount: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  radius: number;
  color: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  strength: number; // 0 to 1
  isExplicit: boolean; // wikilink or manual link vs auto-discovered
  label?: string;
}
