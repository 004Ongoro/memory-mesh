import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/note';
import { SEED_NOTES } from './seedData';

const NOTES_STORAGE_KEY = '@memory_mesh_notes_v1';
const SETTINGS_STORAGE_KEY = '@memory_mesh_settings_v1';

/**
 * Loads all notes from AsyncStorage.
 * In production (__DEV__ is false), the app starts with a clean, empty knowledge base (no mock data).
 * In development mode (__DEV__ is true), seed notes can be used for initial testing.
 */
export async function loadAllNotes(): Promise<Note[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      // In production, no mock data is used; users start with an empty offline knowledge base
      const initialNotes: Note[] = __DEV__ ? SEED_NOTES : [];
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(initialNotes));
      return initialNotes;
    }
    const parsed: Note[] = JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.error('Error loading notes from storage:', error);
    return [];
  }
}

export async function saveAllNotes(notes: Note[]): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes to storage:', error);
    throw error;
  }
}

export async function createNote(newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const notes = await loadAllNotes();
  const id = 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const noteToSave: Note = {
    ...newNote,
    id,
    createdAt: now,
    updatedAt: now,
  };

  const updatedNotes = [noteToSave, ...notes];
  await saveAllNotes(updatedNotes);
  return noteToSave;
}

export async function updateNote(updatedNote: Note): Promise<Note> {
  const notes = await loadAllNotes();
  const index = notes.findIndex(n => n.id === updatedNote.id);
  const now = new Date().toISOString();

  const refreshedNote = {
    ...updatedNote,
    updatedAt: now,
  };

  if (index !== -1) {
    notes[index] = refreshedNote;
  } else {
    notes.unshift(refreshedNote);
  }

  await saveAllNotes(notes);
  return refreshedNote;
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await loadAllNotes();
  const filtered = notes.filter(n => n.id !== id);
  await saveAllNotes(filtered);
}

export async function resetToSeedData(): Promise<Note[]> {
  await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(SEED_NOTES));
  return SEED_NOTES;
}

export async function clearAllNotes(): Promise<Note[]> {
  await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([]));
  return [];
}
