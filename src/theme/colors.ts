export const Colors = {
  // Base backgrounds
  background: '#0B0F19', // Deep obsidian midnight
  surface: '#131B2E',    // Elevated card surface
  surfaceHover: '#1B243B',
  surfaceActive: '#222E4C',
  surfaceLight: '#1C2438',
  border: '#232D48',
  borderLight: '#323E62',

  // Primary brand / Mesh accents
  primary: '#6366F1',     // Indigo glow
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  primaryMuted: 'rgba(99, 102, 241, 0.15)',

  // Secondary
  cyan: '#06B6D4',
  cyanMuted: 'rgba(6, 182, 212, 0.15)',
  emerald: '#10B981',
  emeraldMuted: 'rgba(16, 185, 129, 0.15)',
  amber: '#F59E0B',
  amberMuted: 'rgba(245, 158, 11, 0.15)',
  rose: '#F43F5E',
  roseMuted: 'rgba(244, 63, 94, 0.15)',
  purple: '#A855F7',
  purpleMuted: 'rgba(168, 85, 247, 0.15)',

  // Text
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',

  // Semantic Note Type Colors
  types: {
    concept: '#A855F7',    // Purple
    code: '#06B6D4',       // Cyan
    article: '#10B981',    // Emerald
    book: '#F59E0B',       // Amber
    idea: '#F43F5E',       // Rose
    reflection: '#6366F1', // Indigo
    screenshot: '#EC4899', // Pink
  },

  // Spaced Repetition Rating Colors
  srs: {
    again: '#EF4444', // Red
    hard: '#F97316',  // Orange
    good: '#10B981',  // Green
    easy: '#3B82F6',  // Blue
  },

  // Overlay
  backdrop: 'rgba(5, 7, 13, 0.85)',
};

export const NoteTypeMeta: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  concept: {
    label: 'Concept',
    icon: 'bulb-outline',
    color: Colors.types.concept,
    bgColor: Colors.purpleMuted,
  },
  code: {
    label: 'Code Snippet',
    icon: 'code-slash-outline',
    color: Colors.types.code,
    bgColor: Colors.cyanMuted,
  },
  article: {
    label: 'Article',
    icon: 'newspaper-outline',
    color: Colors.types.article,
    bgColor: Colors.emeraldMuted,
  },
  book: {
    label: 'Book Note',
    icon: 'book-outline',
    color: Colors.types.book,
    bgColor: Colors.amberMuted,
  },
  idea: {
    label: 'Idea',
    icon: 'sparkles-outline',
    color: Colors.types.idea,
    bgColor: Colors.roseMuted,
  },
  reflection: {
    label: 'Reflection',
    icon: 'journal-outline',
    color: Colors.types.reflection,
    bgColor: Colors.primaryMuted,
  },
  screenshot: {
    label: 'Visual / Capture',
    icon: 'image-outline',
    color: Colors.types.screenshot,
    bgColor: 'rgba(236, 72, 153, 0.15)',
  },
};
