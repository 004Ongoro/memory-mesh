import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  onPressWikilink?: (targetTitle: string) => void;
}

export function MarkdownRenderer({ content, onPressWikilink }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code fence
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim() || 'code';
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <CodeBlock
            key={`code-${i}`}
            code={codeBuffer.join('\n')}
            language={codeLanguage}
          />
        );
        codeBuffer = [];
        codeLanguage = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <Text key={`h1-${i}`} style={styles.h1}>
          {line.slice(2).trim()}
        </Text>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <Text key={`h2-${i}`} style={styles.h2}>
          {line.slice(3).trim()}
        </Text>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <Text key={`h3-${i}`} style={styles.h3}>
          {line.slice(4).trim()}
        </Text>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <View key={`quote-${i}`} style={styles.blockquote}>
          <Text style={styles.quoteText}>{renderInlineText(line.slice(2), onPressWikilink, `q-${i}`)}</Text>
        </View>
      );
      continue;
    }

    // Bullet list
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletContent = line.trim().slice(2);
      elements.push(
        <View key={`bullet-${i}`} style={styles.listRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.listText}>
            {renderInlineText(bulletContent, onPressWikilink, `b-${i}`)}
          </Text>
        </View>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <View key={`num-${i}`} style={styles.listRow}>
          <Text style={styles.numPrefix}>{numMatch[1]}.</Text>
          <Text style={styles.listText}>
            {renderInlineText(numMatch[2], onPressWikilink, `num-${i}`)}
          </Text>
        </View>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<View key={`space-${i}`} style={styles.spacer} />);
      continue;
    }

    // Standard paragraph
    elements.push(
      <Text key={`p-${i}`} style={styles.paragraph}>
        {renderInlineText(line, onPressWikilink, `p-${i}`)}
      </Text>
    );
  }

  // Handle unclosed code block gracefully
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <CodeBlock
        key={`code-unclosed`}
        code={codeBuffer.join('\n')}
        language={codeLanguage}
      />
    );
  }

  return <View style={styles.container}>{elements}</View>;
}

/**
 * Render inline markdown tokens: `code`, **bold**, *italic*, and [[Wikilinks]]
 */
function renderInlineText(
  text: string,
  onPressWikilink?: (title: string) => void,
  keyPrefix = 'inline'
): React.ReactNode[] {
  // Regex pattern matching:
  // 1. [[Wikilink]]
  // 2. `code`
  // 3. **bold**
  // 4. *italic*
  const pattern = /(\[\[.*?\]\]|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith('[[') && part.endsWith(']]')) {
      const linkTitle = part.slice(2, -2).trim();
      return (
        <Text
          key={key}
          onPress={() => onPressWikilink?.(linkTitle)}
          style={styles.wikilinkInline}
        >
          {` 🔗 [[${linkTitle}]] `}
        </Text>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <Text key={key} style={styles.inlineCode}>
          {part.slice(1, -1)}
        </Text>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <Text key={key} style={styles.boldText}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={key} style={styles.italicText}>
          {part.slice(1, -1)}
        </Text>
      );
    }

    return <Text key={key}>{part}</Text>;
  });
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  h1: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  spacer: {
    height: 8,
  },
  blockquote: {
    marginVertical: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingVertical: 6,
    borderRadius: 4,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primaryLight,
    marginTop: 8,
    marginRight: 10,
  },
  numPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryLight,
    width: 20,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 12.5,
    backgroundColor: '#1E293B',
    color: Colors.cyan,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  boldText: {
    fontWeight: '700',
    color: Colors.text,
  },
  italicText: {
    fontStyle: 'italic',
    color: Colors.text,
  },
  wikilinkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  wikilinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  wikilinkInline: {
    color: Colors.cyan,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    fontWeight: '700',
    fontSize: 13.5,
  },
});
