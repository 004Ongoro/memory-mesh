import { processSRSReview, calculateSRSStats, getDueFlashcards } from '../src/services/srsEngine';
import { findConnectionsForNote, buildKnowledgeGraph, computeGraphLayout } from '../src/services/connectionEngine';
import { searchNotes } from '../src/services/searchEngine';
import { Note, Flashcard } from '../src/types/note';

declare const process: any;

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n--- Running Memory Mesh Core Engine Test Suite ---\n');

// 1. Spaced Repetition (SM-2) Tests
console.log('[1] Testing Spaced Repetition Engine (SM-2)...');

const mockCard: Flashcard = {
  id: 'card-1',
  front: 'What is a closure?',
  back: 'A function that retains access to its lexical scope.',
  interval: 1,
  repetition: 1,
  easeFactor: 2.5,
  dueDate: '2026-09-01T00:00:00.000Z',
  lapses: 0,
};

// Success review (Rating 'good')
const cardGood = processSRSReview(mockCard, 'good');
assert(cardGood.repetition === 2, 'Repetition count increments to 2 on Good rating');
assert(cardGood.interval === 4, 'Second review interval is 4 days on Good');
assert(cardGood.easeFactor >= 2.5, 'Ease factor remains stable or increases on Good');
assert(cardGood.lastReviewedDate !== undefined, 'lastReviewedDate recorded');

// Perfect review (Rating 'easy')
const cardEasy = processSRSReview(cardGood, 'easy');
assert(cardEasy.repetition === 3, 'Repetition count increments to 3 on Easy rating');
assert(cardEasy.interval > 4, 'Third review interval is scaled by ease factor (> 4 days)');
assert(cardEasy.easeFactor >= cardGood.easeFactor, 'Ease factor maintained/increased on Easy');

// Failure review (Rating 'again')
const cardFailed = processSRSReview(cardEasy, 'again');
assert(cardFailed.repetition === 0, 'Repetition resets to 0 on failure ("again")');
assert(cardFailed.interval === 1, 'Interval resets to 1 day on failure');
assert(cardFailed.lapses === 1, 'Lapse counter incremented on failure');
assert(cardFailed.easeFactor >= 1.3, 'Ease factor never drops below minimum threshold of 1.3');

// SRS Statistics
const mockNotesWithCards: Note[] = [
  {
    id: 'n1',
    title: 'Note 1',
    type: 'concept',
    content: 'Content',
    tags: ['test'],
    manualLinks: [],
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    flashcards: [
      { id: 'c1', front: 'Q1', back: 'A1', interval: 10, repetition: 2, easeFactor: 2.5, dueDate: new Date().toISOString(), lapses: 0 },
      { id: 'c2', front: 'Q2', back: 'A2', interval: 25, repetition: 4, easeFactor: 2.6, dueDate: new Date().toISOString(), lapses: 0 },
    ],
  },
  {
    id: 'n2',
    title: 'Note 2',
    type: 'concept',
    content: 'Content',
    tags: [],
    manualLinks: [],
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    flashcards: [
      { id: 'c3', front: 'Q3', back: 'A3', interval: 1, repetition: 0, easeFactor: 2.5, dueDate: '2020-01-01T00:00:00.000Z', lapses: 1 },
    ],
  },
];

const stats = calculateSRSStats(mockNotesWithCards);
assert(stats.totalCards === 3, 'Total cards counted accurately (3 cards)');
assert(stats.masteredCards === 1, 'Mastered cards counted (> 21 days interval)');
assert(stats.retentionRate > 0, 'Retention rate is calculated positive percentage');

const dueCards = getDueFlashcards(mockNotesWithCards);
assert(dueCards.some(d => d.card.id === 'c3'), 'Overdue card c3 is included in due flashcards');

// 2. Offline Connection Engine Tests
console.log('\n[2] Testing Semantic Connection Engine & Knowledge Graph...');

const noteA: Note = {
  id: 'note-hooks',
  title: 'React Hooks Fundamentals',
  type: 'concept',
  content: 'Hooks allow state encapsulation. See [[Modern State Management]] for advanced patterns.',
  tags: ['react', 'frontend', 'hooks'],
  manualLinks: [],
  favorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  flashcards: [],
};

const noteB: Note = {
  id: 'note-state',
  title: 'Modern State Management',
  type: 'concept',
  content: 'Zustand and Redux Toolkit manage global store state in React apps.',
  tags: ['react', 'state', 'architecture'],
  manualLinks: [],
  favorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  flashcards: [],
};

const noteC: Note = {
  id: 'note-unrelated',
  title: 'Baking Sourdough Bread',
  type: 'reflection',
  content: 'Flour, water, wild yeast fermentation process.',
  tags: ['cooking', 'bread'],
  manualLinks: [],
  favorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  flashcards: [],
};

const allTestNotes = [noteA, noteB, noteC];

// Detect connections
const connsA = findConnectionsForNote(noteA, allTestNotes);
assert(connsA.some(c => c.targetNoteId === noteB.id), 'Automatic connection formed between React Hooks and State Management');
assert(!connsA.some(c => c.targetNoteId === noteC.id), 'Unrelated sourdough note is NOT connected to React Hooks');

// Connection reasons
const linkConn = connsA.find(c => c.targetNoteId === noteB.id);
assert(linkConn !== undefined && (linkConn.reason.includes('Referenced') || linkConn.reason.includes('domain') || linkConn.reason.includes('Shared')), 'Connection reasons mention semantic linkages');

// Knowledge Graph construction
const graph = buildKnowledgeGraph(allTestNotes);
assert(graph.nodes.length === 3, 'Knowledge graph contains all 3 nodes');
assert(graph.edges.length >= 1, 'Knowledge graph contains synaptic edges');
assert(graph.edges.some(e => (e.source === noteA.id && e.target === noteB.id) || (e.source === noteB.id && e.target === noteA.id)), 'Synaptic edge connects noteA and noteB');

// Graph Layout coordinates check (ensuring no NaN or Infinity)
const layoutNodes = computeGraphLayout(graph);
assert(layoutNodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y)), 'All layout nodes have finite, valid X and Y coordinates (no NaN/Infinity)');
assert(layoutNodes.every(n => n.x >= 0 && n.y >= 0), 'All layout nodes reside within valid virtual canvas bounds');

// 3. Offline Search Engine Tests
console.log('\n[3] Testing Offline Multi-Token Search Engine...');

const search1 = searchNotes(allTestNotes, { query: 'react hooks' });
assert(search1.length > 0 && search1[0].id === noteA.id, 'Search for "react hooks" returns noteA as top result');

const search2 = searchNotes(allTestNotes, { query: 'fermentation' });
assert(search2.length === 1 && search2[0].id === noteC.id, 'Search for "fermentation" accurately finds sourdough note');

const searchTag = searchNotes(allTestNotes, { tag: 'react' });
assert(searchTag.length === 2, 'Tag filter for "react" matches exactly 2 notes');

const searchType = searchNotes(allTestNotes, { type: 'reflection' });
assert(searchType.length === 1 && searchType[0].id === noteC.id, 'Type filter for "reflection" matches noteC');

// Empty query returns all notes
const searchAll = searchNotes(allTestNotes, {});
assert(searchAll.length === 3, 'Empty search options returns full note set');

console.log(`\n========================================`);
console.log(`Test Results: ${passed} PASSED | ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
