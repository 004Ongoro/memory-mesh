import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';

interface CodeBlockProps {
  code: string;
  language?: string;
}

// Token types for custom lightweight syntax highlighter
type TokenType = 'keyword' | 'type' | 'string' | 'comment' | 'number' | 'operator' | 'plain';

interface Token {
  type: TokenType;
  text: string;
}

const KEYWORDS = new Set([
  'import', 'export', 'default', 'from', 'as', 'const', 'let', 'var', 'function', 'return',
  'class', 'extends', 'if', 'else', 'switch', 'case', 'break', 'for', 'while', 'do',
  'try', 'catch', 'finally', 'throw', 'new', 'typeof', 'instanceof', 'void', 'this',
  'async', 'await', 'yield', 'interface', 'type', 'enum', 'public', 'private', 'protected',
  'static', 'readonly', 'select', 'insert', 'update', 'delete', 'create', 'table', 'where',
  'def', 'class', 'elif', 'pass', 'lambda', 'with', 'true', 'false', 'null', 'undefined'
]);

const TYPES = new Set([
  'string', 'number', 'boolean', 'any', 'void', 'never', 'unknown', 'object', 'symbol',
  'Promise', 'Array', 'Record', 'Set', 'Map', 'Note', 'Flashcard', 'React', 'T', 'int', 'float'
]);

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const len = line.length;

  while (index < len) {
    // Comment line or inline comment
    if (line.substr(index, 2) === '//' || line.substr(index, 2) === '--' || line[index] === '#') {
      tokens.push({ type: 'comment', text: line.slice(index) });
      break;
    }

    // String literals: ", ', or `
    if (line[index] === '"' || line[index] === "'" || line[index] === '`') {
      const quote = line[index];
      let end = index + 1;
      while (end < len && line[end] !== quote) {
        if (line[end] === '\\') end++; // skip escaped
        end++;
      }
      tokens.push({ type: 'string', text: line.slice(index, end + 1) });
      index = end + 1;
      continue;
    }

    // Numbers
    if (/\d/.test(line[index])) {
      let end = index;
      while (end < len && /[\d.]/.test(line[end])) {
        end++;
      }
      tokens.push({ type: 'number', text: line.slice(index, end) });
      index = end;
      continue;
    }

    // Word tokens (identifiers, keywords, types)
    if (/[a-zA-Z_$]/.test(line[index])) {
      let end = index;
      while (end < len && /[a-zA-Z0-9_$]/.test(line[end])) {
        end++;
      }
      const word = line.slice(index, end);
      const lower = word.toLowerCase();

      if (KEYWORDS.has(lower)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (TYPES.has(word)) {
        tokens.push({ type: 'type', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      index = end;
      continue;
    }

    // Operators and symbols
    tokens.push({ type: 'plain', text: line[index] });
    index++;
  }

  return tokens;
}

export function CodeBlock({ code, language = 'code' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(code.trim());
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const lines = code.trimEnd().split('\n');

  return (
    <View style={styles.container}>
      {/* Header bar with language & copy button */}
      <View style={styles.header}>
        <View style={styles.langBadge}>
          <View style={styles.dot} />
          <Text style={styles.langText}>{language.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.7}
          style={[styles.copyButton, copied && styles.copyButtonActive]}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={copied ? Colors.emerald : Colors.textSecondary}
          />
          <Text style={[styles.copyText, copied && { color: Colors.emerald }]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Code body with line numbers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea}>
        <View style={styles.codeRow}>
          {/* Line numbers */}
          <View style={styles.lineNumbersCol}>
            {lines.map((_, i) => (
              <Text key={i} style={styles.lineNumber}>
                {i + 1}
              </Text>
            ))}
          </View>

          {/* Tokens */}
          <View style={styles.codeContentCol}>
            {lines.map((line, lineIdx) => {
              const tokens = tokenizeLine(line);
              return (
                <View key={lineIdx} style={styles.codeLine}>
                  {tokens.map((token, tIdx) => {
                    let color = Colors.text;
                    if (token.type === 'keyword') color = '#F43F5E'; // rose
                    else if (token.type === 'type') color = '#38BDF8'; // light cyan
                    else if (token.type === 'string') color = '#34D399'; // emerald
                    else if (token.type === 'number') color = '#FBBF24'; // amber
                    else if (token.type === 'comment') color = '#64748B'; // slate

                    return (
                      <Text
                        key={tIdx}
                        style={[
                          styles.tokenText,
                          { color },
                          token.type === 'comment' && styles.italic,
                          token.type === 'keyword' && styles.bold,
                        ]}
                      >
                        {token.text}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: '#070A12',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0F1524',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.cyan,
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.cyan,
    letterSpacing: 0.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  copyButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  copyText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scrollArea: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  codeRow: {
    flexDirection: 'row',
  },
  lineNumbersCol: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    marginRight: 10,
    alignItems: 'flex-end',
  },
  lineNumber: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  codeContentCol: {
    paddingRight: 16,
  },
  codeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  italic: {
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: '700',
  },
});
