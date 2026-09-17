import { Note } from '../types/note';

export const SEED_NOTES: Note[] = [
  {
    id: 'note-react-hooks',
    title: 'React Hooks & State Encapsulation',
    type: 'concept',
    content: `# React Hooks: Fundamentals & Mental Models

Hooks let you use state and other React features without writing a class. They embrace JavaScript closures and functional programming principles.

## Core Mental Model
Hooks rely on the **call order** of hooks inside the component render function. Every time the component renders, React matches hook calls by index.

> **Key Rule**: Only call Hooks at the top level. Don't call Hooks inside loops, conditions, or nested functions.

### Common Hooks
- \`useState\`: Local component state
- \`useEffect\`: Side-effects, subscriptions, timers
- \`useMemo\`: Memoizing expensive computations
- \`useCallback\`: Stable function references across renders

Connects closely with [[State Management Patterns]] and JavaScript closures!`,
    codeSnippet: {
      language: 'typescript',
      code: `import React, { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}`,
    },
    tags: ['react', 'hooks', 'frontend', 'state', 'javascript'],
    manualLinks: [],
    flashcards: [
      {
        id: 'fc-hooks-1',
        front: 'Why must React Hooks be called at the top level of a component?',
        back: 'React relies on the call order of hooks during each render to correctly associate state with each hook call.',
        repetition: 2,
        interval: 3,
        easeFactor: 2.5,
        dueDate: new Date(Date.now() - 3600000).toISOString(), // Due now
        lapses: 0,
      },
      {
        id: 'fc-hooks-2',
        front: 'What does the cleanup function returned inside useEffect do?',
        back: 'It executes before the effect re-runs or when the component unmounts to prevent memory leaks and cancel timers/subscriptions.',
        repetition: 1,
        interval: 1,
        easeFactor: 2.4,
        dueDate: new Date(Date.now() - 7200000).toISOString(), // Due now
        lapses: 0,
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    favorite: true,
  },
  {
    id: 'note-state-management',
    title: 'State Management Patterns in React',
    type: 'concept',
    content: `# Modern State Management Patterns

Selecting the right state abstraction depends on scope, frequency of changes, and coupling.

## State Taxonomy
1. **Local State**: Managed with \`useState\` or \`useReducer\` within a single component subtree. See [[React Hooks & State Encapsulation]].
2. **Lifted State**: Shared between sibling components by passing props down and callbacks up.
3. **Global UI State**: App-wide configuration, modals, theme (Zustand, Redux, Context).
4. **Server Cache State**: Remote data fetching and caching (TanStack Query).

### When to choose Zustand or Redux?
- Avoid prop drilling across > 3 component layers.
- Decouple business logic and data stores from UI presentation.
- Fast atomic subscriptions avoid unnecessary component re-renders.`,
    codeSnippet: {
      language: 'typescript',
      code: `import { create } from 'zustand';

interface MeshStore {
  activeNoteId: string | null;
  filterTag: string | null;
  setActiveNote: (id: string | null) => void;
}

export const useMeshStore = create<MeshStore>((set) => ({
  activeNoteId: null,
  filterTag: null,
  setActiveNote: (id) => set({ activeNoteId: id }),
}));`,
    },
    tags: ['react', 'state', 'architecture', 'zustand', 'frontend'],
    manualLinks: [],
    flashcards: [
      {
        id: 'fc-state-1',
        front: 'What is the main danger of using React Context for frequently updating global state?',
        back: 'Every consumer component re-renders whenever the context value changes, potentially causing UI lag without memoization or selector stores.',
        repetition: 0,
        interval: 1,
        easeFactor: 2.5,
        dueDate: new Date(Date.now() - 1000).toISOString(), // Due now
        lapses: 0,
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    favorite: true,
  },
  {
    id: 'note-js-closures',
    title: 'JavaScript Closures and Scope Chains',
    type: 'code',
    content: `# Deep Dive: Closures in Modern JS

A closure is the combination of a function bundled together with references to its surrounding lexical state (**the lexical environment**).

## Why Closures Matter in React
When you call a React hook (like \`useEffect\` or \`useCallback\`), the callback function closes over the props and state from *that specific render*.

If dependencies aren't updated, the callback retains **stale closures** referencing old state values.`,
    codeSnippet: {
      language: 'javascript',
      code: `function createCounter(initialValue = 0) {
  let count = initialValue; // enclosed variable

  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11`,
    },
    tags: ['javascript', 'closures', 'react', 'hooks', 'scope'],
    manualLinks: [],
    flashcards: [
      {
        id: 'fc-closure-1',
        front: 'What is a "stale closure" in React components?',
        back: 'A function that captured variables from a previous render because its dependency array omitted updated state or prop variables.',
        repetition: 3,
        interval: 7,
        easeFactor: 2.6,
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), // Not due yet
        lapses: 0,
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'note-spaced-repetition',
    title: 'Spaced Repetition & Ebbinghaus Forgetting Curve',
    type: 'book',
    author: 'Hermann Ebbinghaus & Piotr Woźniak',
    content: `# The Science of Memory Retention

Human memory decays exponentially according to the **Forgetting Curve**. Without active recall, humans lose up to 70% of new information within 48 hours.

## The Spaced Repetition Solution
By reviewing the concept just before you are about to forget it, the memory trace is strengthened and the rate of forgetting flattens.

> "Repetition at expanding intervals converts fragile working memory into durable long-term storage."

### Key Algorithms:
- **SM-2**: SuperMemo 2 algorithm using Ease Factor ($EF \\ge 1.3$) and consecutive streak multipliers.
- **Active Recall**: Testing yourself forces memory retrieval pathways rather than passive re-reading.`,
    tags: ['learning', 'memory', 'spaced_repetition', 'retention', 'cognition'],
    manualLinks: [],
    flashcards: [
      {
        id: 'fc-srs-1',
        front: 'What is the mathematical relationship behind the Ebbinghaus Forgetting Curve?',
        back: 'Memory retention decays exponentially: R = e^(-t/S), where R is retention, t is elapsed time, and S is memory stability.',
        repetition: 4,
        interval: 14,
        easeFactor: 2.7,
        dueDate: new Date(Date.now() + 86400000 * 8).toISOString(),
        lapses: 0,
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    favorite: true,
  },
  {
    id: 'note-offline-first',
    title: 'Offline-First Architecture & Local Persistence',
    type: 'article',
    sourceUrl: 'https://offlinefirst.org',
    content: `# Building Offline-First Mobile Applications

An offline-first approach designs the app assuming **zero network availability** as the default baseline, treating connectivity as an opportunistic enhancement.

## Core Architectural Pillars
1. **Local Database as Source of Truth**: UI reads and writes exclusively to local storage (SQLite, AsyncStorage, or WatermelonDB).
2. **Optimistic Updates**: Instant UI feedback without waiting for server ACKs.
3. **Bidirectional Sync Engine**: Delta changes queued in an outbox queue with conflict resolution strategies (LWW or CRDTs).
4. **Local Search & Indexing**: Instant in-memory search without API latency.`,
    codeSnippet: {
      language: 'typescript',
      code: `export async function persistWithRetry(key: string, data: any): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    await AsyncStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Storage write failed:', error);
    // Queue to memory fallback
  }
}`,
    },
    tags: ['offline', 'architecture', 'database', 'storage', 'sync'],
    manualLinks: [],
    flashcards: [
      {
        id: 'fc-offline-1',
        front: 'In offline-first architecture, what should be the primary data source for the UI?',
        back: 'The local database or on-device storage. The remote server is only treated as a sync endpoint.',
        repetition: 1,
        interval: 2,
        easeFactor: 2.5,
        dueDate: new Date(Date.now() - 5000).toISOString(), // Due now
        lapses: 0,
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'note-database-indexing',
    title: 'B-Tree Indexing in Relational Databases',
    type: 'concept',
    content: `# How Database Indexes Accelerate Queries

A B-Tree (Balanced Tree) index maintains sorted data and provides logarithmic amortized search, insertion, and deletion times $O(\\log N)$.

## Clustered vs Non-Clustered Indexes
- **Clustered Index**: Determines the physical order of data on disk (usually Primary Key). Only one per table.
- **Secondary Index**: Stores indexed column values pointing to row identifiers or clustered keys.

Essential for offline databases and graph nodes retrieval!`,
    codeSnippet: {
      language: 'sql',
      code: `CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  updated_at INTEGER
);

CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_title ON notes(title COLLATE NOCASE);`,
    },
    tags: ['database', 'indexing', 'sqlite', 'algorithms', 'storage'],
    manualLinks: [],
    flashcards: [
      {
        id: 'fc-btree-1',
        front: 'What is the time complexity of searching a B-Tree index with N records?',
        back: 'O(log N) operations due to the balanced branching structure.',
        repetition: 2,
        interval: 4,
        easeFactor: 2.5,
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        lapses: 0,
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'note-continuous-learning',
    title: 'Personal Reflection: The Continuous Learning Loop',
    type: 'reflection',
    content: `# Building a Personal Second Brain

True learning isn't merely consuming articles or bookmarking links—it requires active synthesis, forming connections between seemingly distant topics, and spaced review.

## The 4-Step Knowledge Loop
1. **Capture**: Capture raw notes, code, and book highlights immediately with zero friction.
2. **Organize**: Tag and let semantic mesh links connect them to existing mental models.
3. **Distill**: Write clean summaries, extract atomic cards for spaced repetition.
4. **Express**: Apply concepts to write production code or create new solutions.

The mesh becomes more valuable the more concepts you link together.`,
    tags: ['reflection', 'learning', 'mindset', 'productivity'],
    manualLinks: [],
    flashcards: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    favorite: true,
  },
  {
    id: 'note-knowledge-mesh-idea',
    title: 'Idea: Graph-Powered Bidirectional Associative Memory',
    type: 'idea',
    content: `# Idea: Associative Memory in Mobile Apps

Standard note apps use hierarchical folders which mirror rigid file systems. But human memory is associative:
- Thinking about *React Hooks* evokes *State Management*.
- Thinking about *State Management* evokes *Offline-First Architecture* and *Cache Syncing*.

## Proposed Solution
A dynamic, force-directed knowledge graph where nodes automatically form synaptic bonds based on shared conceptual density.
Reviewing one node illuminates adjacent nodes in the mesh!`,
    tags: ['idea', 'graph', 'knowledge', 'ai', 'ux'],
    manualLinks: [],
    flashcards: [],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now()).toISOString(),
  }
];
