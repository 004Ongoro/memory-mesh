import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Note, NoteType, Flashcard, DiscoveredConnection } from '../../types/note';
import { Colors, NoteTypeMeta } from '../../theme/colors';
import { MarkdownRenderer } from '../markdown/MarkdownRenderer';
import { findConnectionsForNote } from '../../services/connectionEngine';

interface NoteEditorModalProps {
  visible: boolean;
  initialNote?: Note | null;
  allNotes: Note[];
  onClose: () => void;
  onSave: (noteData: Partial<Note>) => void;
}

const NOTE_TYPES: NoteType[] = [
  'concept',
  'code',
  'article',
  'book',
  'idea',
  'reflection',
  'screenshot',
];

export function NoteEditorModal({
  visible,
  initialNote,
  allNotes,
  onClose,
  onSave,
}: NoteEditorModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<NoteType>('concept');
  const [content, setContent] = useState('');
  const [code, setCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [author, setAuthor] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Flashcard creation states
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [showCardInput, setShowCardInput] = useState(false);

  // Editor mode: 'edit' | 'preview'
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title || '');
      setType(initialNote.type || 'concept');
      setContent(initialNote.content || '');
      setCode(initialNote.codeSnippet?.code || '');
      setCodeLanguage(initialNote.codeSnippet?.language || 'typescript');
      setImageUri(initialNote.imageUri);
      setTags(initialNote.tags || []);
      setAuthor(initialNote.author || '');
      setSourceUrl(initialNote.sourceUrl || '');
      setFlashcards(initialNote.flashcards || []);
    } else {
      // New note defaults
      setTitle('');
      setType('concept');
      setContent('');
      setCode('');
      setCodeLanguage('typescript');
      setImageUri(undefined);
      setTags([]);
      setAuthor('');
      setSourceUrl('');
      setFlashcards([]);
    }
    setViewMode('edit');
    setShowCardInput(false);
  }, [initialNote, visible]);

  // Quick tag adder
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Image Picker
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setType('screenshot');
      }
    } catch (e) {
      Alert.alert('Image Picker Error', 'Could not open image library.');
    }
  };

  // Flashcard adder
  const handleAddFlashcard = () => {
    if (!cardFront.trim() || !cardBack.trim()) {
      Alert.alert('Missing Content', 'Please provide both a prompt/question and an answer.');
      return;
    }

    const newCard: Flashcard = {
      id: 'fc-' + Date.now(),
      front: cardFront.trim(),
      back: cardBack.trim(),
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      dueDate: new Date().toISOString(),
      lapses: 0,
    };

    setFlashcards([...flashcards, newCard]);
    setCardFront('');
    setCardBack('');
    setShowCardInput(false);
  };

  const handleRemoveCard = (cardId: string) => {
    setFlashcards(flashcards.filter(c => c.id !== cardId));
  };

  // Quick inserter for wikilinks
  const handleInsertWikilink = () => {
    setContent(c => c + ' [[New Concept]]');
  };

  // Preview automatic connection calculation
  const mockTempNote: Note = {
    id: initialNote?.id || 'temp',
    title: title || 'Untitled',
    type,
    content,
    tags,
    manualLinks: [],
    flashcards,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const previewConnections = title.trim() ? findConnectionsForNote(mockTempNote, allNotes) : [];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for this note.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const notePayload: Partial<Note> = {
      title: title.trim(),
      type,
      content,
      codeSnippet: code.trim() ? { code: code.trim(), language: codeLanguage } : undefined,
      imageUri,
      tags,
      author: author.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      flashcards,
      manualLinks: initialNote?.manualLinks || [],
    };

    onSave(notePayload);
    onClose();
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, styles.safeArea]} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          {/* Mode Switcher */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              onPress={() => setViewMode('edit')}
              style={[styles.modeTab, viewMode === 'edit' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, viewMode === 'edit' && styles.modeTabTextActive]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('preview')}
              style={[styles.modeTab, viewMode === 'preview' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, viewMode === 'preview' && styles.modeTabTextActive]}>
                Preview
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.7}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'edit' ? (
          <ScrollView contentContainerStyle={styles.scrollArea}>
            {/* Note Type Selector */}
            <Text style={styles.inputLabel}>NOTE TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {NOTE_TYPES.map(t => {
                const meta = NoteTypeMeta[t];
                const isSelected = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[
                      styles.typeSelector,
                      isSelected && {
                        backgroundColor: meta.bgColor,
                        borderColor: meta.color,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={meta.icon as any}
                      size={13}
                      color={isSelected ? meta.color : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.typeSelectorText,
                        isSelected && { color: meta.color, fontWeight: '700' },
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Title Input */}
            <Text style={styles.inputLabel}>TITLE</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. React Hooks & State Encapsulation"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Author or Source if relevant */}
            {(type === 'book' || type === 'article') && (
              <View style={styles.extraFieldsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>AUTHOR / SOURCE</Text>
                  <TextInput
                    style={styles.subInput}
                    value={author}
                    onChangeText={setAuthor}
                    placeholder="e.g. Dan Abramov"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>URL</Text>
                  <TextInput
                    style={styles.subInput}
                    value={sourceUrl}
                    onChangeText={setSourceUrl}
                    placeholder="https://..."
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>
            )}

            {/* Image / Screenshot Picker */}
            <View style={styles.imageActionRow}>
              <TouchableOpacity onPress={handlePickImage} style={styles.pickerBtn} activeOpacity={0.7}>
                <Ionicons name="image-outline" size={16} color={Colors.cyan} />
                <Text style={styles.pickerBtnText}>
                  {imageUri ? 'Change Attached Image' : 'Attach Screenshot / Diagram'}
                </Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity onPress={() => setImageUri(undefined)}>
                  <Ionicons name="close-circle" size={20} color={Colors.rose} />
                </TouchableOpacity>
              )}
            </View>

            {imageUri && (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              </View>
            )}

            {/* Content Toolbar */}
            <View style={styles.contentToolbar}>
              <Text style={styles.inputLabel}>MARKDOWN CONTENT</Text>
              <TouchableOpacity
                onPress={handleInsertWikilink}
                style={styles.toolBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="link" size={13} color={Colors.primaryLight} />
                <Text style={styles.toolBtnText}>+ [[Wikilink]]</Text>
              </TouchableOpacity>
            </View>

            {/* Markdown Text Area */}
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Write your thoughts, concepts, bullet points... Supports markdown # Headers, `code`, **bold**, [[Wikilinks]]"
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            {/* Code Snippet Box (Optional or for code notes) */}
            <View style={styles.codeHeaderRow}>
              <Text style={styles.inputLabel}>CODE SNIPPET (OPTIONAL)</Text>
              <TextInput
                style={styles.langInput}
                value={codeLanguage}
                onChangeText={setCodeLanguage}
                placeholder="language (ts, js, py, sql)"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              placeholder="// Paste syntax-highlighted code here..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            {/* Tags Manager */}
            <Text style={styles.inputLabel}>TAGS</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagInputField}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                placeholder="Add tag and press +"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity onPress={handleAddTag} style={styles.addTagBtn} activeOpacity={0.7}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map(t => (
                  <View key={t} style={styles.tagPill}>
                    <Text style={styles.tagPillText}>#{t}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(t)}>
                      <Ionicons name="close" size={12} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Spaced Repetition Flashcards Manager */}
            <View style={styles.srsHeaderRow}>
              <View>
                <Text style={styles.inputLabel}>SPACED REPETITION FLASHCARDS</Text>
                <Text style={styles.srsHelperText}>
                  Convert key insights into recall cards ({flashcards.length} cards)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCardInput(!showCardInput)}
                style={styles.addCardToggle}
                activeOpacity={0.7}
              >
                <Ionicons name={showCardInput ? 'close' : 'add'} size={14} color={Colors.emerald} />
                <Text style={styles.addCardToggleText}>{showCardInput ? 'Close' : 'Add Card'}</Text>
              </TouchableOpacity>
            </View>

            {showCardInput && (
              <View style={styles.newCardBox}>
                <Text style={styles.cardBoxSubLabel}>Question / Recall Prompt</Text>
                <TextInput
                  style={styles.cardInput}
                  value={cardFront}
                  onChangeText={setCardFront}
                  placeholder="e.g. Why must hooks be called at the top level?"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
                <Text style={styles.cardBoxSubLabel}>Answer / Key Takeaway</Text>
                <TextInput
                  style={styles.cardInput}
                  value={cardBack}
                  onChangeText={setCardBack}
                  placeholder="e.g. React relies on the call order across re-renders."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
                <TouchableOpacity onPress={handleAddFlashcard} style={styles.addCardConfirmBtn}>
                  <Text style={styles.addCardConfirmText}>Add Flashcard</Text>
                </TouchableOpacity>
              </View>
            )}

            {flashcards.length > 0 && (
              <View style={styles.cardsList}>
                {flashcards.map((c, i) => (
                  <View key={c.id || i} style={styles.savedCardItem}>
                    <View style={styles.savedCardTop}>
                      <Text style={styles.savedCardTitle} numberOfLines={1}>
                        Q: {c.front}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveCard(c.id)}>
                        <Ionicons name="trash-outline" size={14} color={Colors.rose} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.savedCardAns} numberOfLines={1}>
                      A: {c.back}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Dynamic Mesh Connection Live Preview */}
            {previewConnections.length > 0 && (
              <View style={styles.liveMeshBox}>
                <View style={styles.liveMeshHeader}>
                  <Ionicons name="git-network-outline" size={14} color={Colors.cyan} />
                  <Text style={styles.liveMeshTitle}>
                    Will connect to {previewConnections.length} existing note(s):
                  </Text>
                </View>
                {previewConnections.slice(0, 3).map((conn: DiscoveredConnection) => (
                  <Text key={conn.targetNoteId} style={styles.liveMeshItem} numberOfLines={1}>
                    • {conn.targetNoteTitle} ({conn.reason})
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          /* Live Markdown Preview */
          <ScrollView contentContainerStyle={styles.scrollArea}>
            <View style={styles.previewContainer}>
              <Text style={styles.previewHeading}>Live Preview</Text>
              <Text style={styles.previewTitle}>{title || 'Untitled Note'}</Text>
              <MarkdownRenderer content={content} />
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              )}
            </View>
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
  cancelBtn: {
    padding: 6,
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 2,
  },
  modeTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollArea: {
    padding: 16,
    paddingBottom: 60,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  typeSelectorText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  titleInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    padding: 12,
    marginBottom: 16,
  },
  extraFieldsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  subInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 13,
    padding: 9,
  },
  imageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerBtnText: {
    fontSize: 12,
    color: Colors.cyan,
    fontWeight: '600',
  },
  imagePreviewWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 180,
  },
  contentToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toolBtnText: {
    fontSize: 11,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  contentInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    minHeight: 140,
    marginBottom: 16,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  langInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.cyan,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    width: 110,
  },
  codeInput: {
    backgroundColor: '#070A12',
    fontFamily: 'monospace',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.cyan,
    fontSize: 12,
    padding: 12,
    minHeight: 100,
    marginBottom: 16,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tagInputField: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 13,
    padding: 9,
  },
  addTagBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  srsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 8,
  },
  srsHelperText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  addCardToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addCardToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald,
  },
  newCardBox: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  cardBoxSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  cardInput: {
    backgroundColor: '#0F1524',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 13,
    padding: 8,
    marginBottom: 8,
  },
  addCardConfirmBtn: {
    backgroundColor: Colors.emerald,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addCardConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardsList: {
    gap: 6,
    marginBottom: 16,
  },
  savedCardItem: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
  },
  savedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  savedCardAns: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
  liveMeshBox: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    padding: 12,
    marginTop: 8,
  },
  liveMeshHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveMeshTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.cyan,
  },
  liveMeshItem: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  previewContainer: {
    padding: 4,
  },
  previewHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryLight,
    letterSpacing: 1,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
});
