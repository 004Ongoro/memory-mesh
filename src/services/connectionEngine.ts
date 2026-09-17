import { Note, DiscoveredConnection, GraphNode, GraphEdge } from '../types/note';
import { Colors, NoteTypeMeta } from '../theme/colors';

// Common English stopwords to ignore in keyword extraction
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot',
  'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
  'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while',
  'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

// Conceptual domain map for smart semantic linking (e.g. Hooks <-> State Management)
const CONCEPT_CLUSTERS: Record<string, string[]> = {
  react: ['hooks', 'state', 'usestate', 'useeffect', 'usereducer', 'redux', 'zustand', 'context', 're-render', 'component', 'props', 'lifecycle', 'virtual dom', 'ui'],
  state_management: ['hooks', 'react', 'redux', 'zustand', 'store', 'reducer', 'action', 'immutability', 'cache', 'reactive', 'signals', 'atoms'],
  spaced_repetition: ['memory', 'recall', 'flashcard', 'forgetting curve', 'ebbinghaus', 'sm-2', 'retention', 'learning', 'anki', 'interval', 'card'],
  database: ['sqlite', 'offline', 'storage', 'index', 'query', 'sql', 'cache', 'sync', 'persistence', 'acid', 'transaction', 'b-tree'],
  algorithms: ['tree', 'graph', 'dfs', 'bfs', 'time complexity', 'big-o', 'sorting', 'hash', 'data structure', 'dynamic programming'],
  javascript: ['typescript', 'closure', 'async', 'promise', 'prototype', 'event loop', 'callback', 'scope', 'node'],
  design: ['ux', 'ui', 'typography', 'color', 'contrast', 'layout', 'design system', 'tokens', 'gestures', 'mobile'],
};

/**
 * Extract distinct meaningful tokens and concepts from text.
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase().replace(/[`#*_\[\]\(\)\{\}:;,.\?!/\\<>\-\+]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return Array.from(new Set(words));
}

/**
 * Extract `[[Target Title]]` wikilinks from markdown text.
 */
export function extractWikilinks(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\[\[(.*?)\]\]/g);
  if (!matches) return [];
  return matches.map(m => m.slice(2, -2).trim());
}

/**
 * Find automatic connections for a specific note among all notes in the mesh.
 */
export function findConnectionsForNote(currentNote: Note, allNotes: Note[]): DiscoveredConnection[] {
  const connections: DiscoveredConnection[] = [];
  const otherNotes = allNotes.filter(n => n.id !== currentNote.id);

  // Gather current note's concepts
  const currentWikilinks = new Set(extractWikilinks(currentNote.content).map(w => w.toLowerCase()));
  const currentTitleWords = extractKeywords(currentNote.title);
  const currentTags = new Set(currentNote.tags.map(t => t.toLowerCase()));
  const currentKeywords = new Set([
    ...currentTitleWords,
    ...extractKeywords(currentNote.content).slice(0, 50),
    ...currentTags,
  ]);

  // Check manual links
  const manualLinkTargetIds = new Set(currentNote.manualLinks.map(ml => ml.targetNoteId));

  for (const other of otherNotes) {
    let score = 0;
    const reasons: string[] = [];
    const matchedWords: string[] = [];

    // 1. Explicit Manual Link
    if (manualLinkTargetIds.has(other.id)) {
      score += 1.0;
      reasons.push('Direct link');
    }

    // 2. Wikilink Check: current refers to other, or other refers to current
    const otherTitleLower = other.title.toLowerCase();
    const otherWikilinks = new Set(extractWikilinks(other.content).map(w => w.toLowerCase()));
    if (currentWikilinks.has(otherTitleLower) || otherWikilinks.has(currentNote.title.toLowerCase())) {
      score += 0.85;
      reasons.push(`Referenced via [[${other.title}]]`);
    }

    // 3. Shared Tags
    const otherTags = new Set(other.tags.map(t => t.toLowerCase()));
    const commonTags = [...currentTags].filter(tag => otherTags.has(tag));
    if (commonTags.length > 0) {
      score += commonTags.length * 0.25;
      reasons.push(`Shared tags: ${commonTags.join(', ')}`);
      matchedWords.push(...commonTags);
    }

    // 4. Title Keyword Overlap (strong semantic signal)
    const otherTitleWords = extractKeywords(other.title);
    const sharedTitleWords = currentTitleWords.filter(w => otherTitleWords.includes(w));
    if (sharedTitleWords.length > 0) {
      score += sharedTitleWords.length * 0.4;
      reasons.push(`Title overlap: ${sharedTitleWords.join(', ')}`);
      matchedWords.push(...sharedTitleWords);
    }

    // 5. Keyword & Conceptual Co-occurrence
    const otherKeywords = new Set([
      ...otherTitleWords,
      ...extractKeywords(other.content).slice(0, 50),
      ...otherTags,
    ]);

    const sharedContentWords = [...currentKeywords].filter(w => otherKeywords.has(w));
    if (sharedContentWords.length > 0) {
      const denominator = currentKeywords.size + otherKeywords.size - sharedContentWords.length;
      const jaccard = denominator > 0 ? sharedContentWords.length / denominator : 0;
      score += jaccard * 0.5;
      sharedContentWords.slice(0, 4).forEach(w => {
        if (!matchedWords.includes(w)) matchedWords.push(w);
      });
    }

    // 6. Domain Cluster Matching (e.g. React Hooks <-> State Management)
    for (const [domain, clusterKeywords] of Object.entries(CONCEPT_CLUSTERS)) {
      const currentHasCluster = clusterKeywords.some(k => currentKeywords.has(k) || currentNote.title.toLowerCase().includes(k));
      const otherHasCluster = clusterKeywords.some(k => otherKeywords.has(k) || other.title.toLowerCase().includes(k));
      if (currentHasCluster && otherHasCluster) {
        score += 0.35;
        const clusterName = domain.replace('_', ' ');
        if (!reasons.some(r => r.includes(clusterName))) {
          reasons.push(`Related domain: ${clusterName}`);
        }
        break;
      }
    }

    const safeScore = Number.isFinite(score) ? Math.min(Math.max(score, 0), 1.0) : 0;

    // Threshold for valid connection
    if (safeScore >= 0.3) {
      connections.push({
        targetNoteId: other.id,
        targetNoteTitle: other.title,
        score: safeScore,
        matchedKeywords: Array.from(new Set(matchedWords)),
        reason: reasons.length > 0 ? reasons.join(' • ') : 'Contextual similarity',
      });
    }
  }

  return connections.sort((a, b) => b.score - a.score);
}

/**
 * Builds the entire knowledge graph (nodes + edges) for visualization.
 */
export function buildKnowledgeGraph(notes: Note[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  // Map to count degree
  const degrees: Record<string, number> = {};
  notes.forEach(n => {
    degrees[n.id] = 0;
  });

  // Calculate all connections
  for (const note of notes) {
    const connections = findConnectionsForNote(note, notes);
    for (const conn of connections) {
      const u = note.id;
      const v = conn.targetNoteId;
      const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;

      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          id: edgeKey,
          source: u,
          target: v,
          strength: conn.score,
          isExplicit: conn.reason.includes('Direct') || conn.reason.includes('Referenced'),
          label: conn.matchedKeywords.slice(0, 2).join(', '),
        });
        degrees[u] = (degrees[u] || 0) + 1;
        degrees[v] = (degrees[v] || 0) + 1;
      }
    }
  }

  // Position nodes radially or randomly around center
  const total = notes.length;
  const radiusBase = 160;

  notes.forEach((note, index) => {
    const angle = (index / Math.max(total, 1)) * 2 * Math.PI;
    const dist = radiusBase + (index % 2 === 0 ? 30 : -25);
    const degree = degrees[note.id] || 0;

    // Sizing: node radius scales with connections
    const nodeRadius = Math.min(14 + degree * 2.0, 26);

    nodes.push({
      id: note.id,
      title: note.title,
      type: note.type,
      tagCount: note.tags.length,
      connectionsCount: degree,
      x: 200 + dist * Math.cos(angle),
      y: 200 + dist * Math.sin(angle),
      radius: nodeRadius,
      color: NoteTypeMeta[note.type]?.color || Colors.primary,
    });
  });

  return { nodes, edges };
}

export const GRAPH_VIRTUAL_WIDTH = 420;
export const GRAPH_VIRTUAL_HEIGHT = 350;

/**
 * Force-directed physics layout calculation for Knowledge Graph nodes.
 */
export function computeGraphLayout(
  rawGraph: { nodes: GraphNode[]; edges: GraphEdge[] },
  virtualWidth = GRAPH_VIRTUAL_WIDTH,
  virtualHeight = GRAPH_VIRTUAL_HEIGHT
): GraphNode[] {
  if (!rawGraph || rawGraph.nodes.length === 0) return [];

  const centerX = virtualWidth / 2;
  const centerY = virtualHeight / 2;
  const total = rawGraph.nodes.length;
  const radiusBase = Math.min(virtualWidth * 0.35, 125);

  const currentNodes: GraphNode[] = rawGraph.nodes.map((n, index) => {
    const angle = (index / Math.max(total, 1)) * 2 * Math.PI;
    const dist = radiusBase + (index % 2 === 0 ? 20 : -20);
    return {
      ...n,
      x: centerX + dist * Math.cos(angle),
      y: centerY + dist * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const iterations = 45;
  const kRepulsion = 11000;
  const kAttraction = 0.035;
  const idealLength = 95;
  const damping = 0.82;

  for (let step = 0; step < iterations; step++) {
    // 1. Repulsion between all node pairs
    for (let i = 0; i < currentNodes.length; i++) {
      for (let j = i + 1; j < currentNodes.length; j++) {
        const n1 = currentNodes[i];
        const n2 = currentNodes[j];
        let dx = n2.x - n1.x;
        let dy = n2.y - n1.y;
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
          dx = (Math.random() - 0.5) * 2;
          dy = (Math.random() - 0.5) * 2;
        }
        const distSq = Math.max(dx * dx + dy * dy, 150);
        const dist = Math.sqrt(distSq);

        const force = kRepulsion / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        n1.vx = (n1.vx || 0) - fx;
        n1.vy = (n1.vy || 0) - fy;
        n2.vx = (n2.vx || 0) + fx;
        n2.vy = (n2.vy || 0) + fy;
      }
    }

    // 2. Spring attraction along edges
    for (const edge of rawGraph.edges) {
      const source = currentNodes.find(n => n.id === edge.source);
      const target = currentNodes.find(n => n.id === edge.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const edgeStrength = Number.isFinite(edge.strength) ? edge.strength : 0.5;
      const force = (dist - idealLength) * kAttraction * edgeStrength;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx = (source.vx || 0) + fx;
      source.vy = (source.vy || 0) + fy;
      target.vx = (target.vx || 0) - fx;
      target.vy = (target.vy || 0) - fy;
    }

    // 3. Center gravity and update positions
    for (const node of currentNodes) {
      const gravityX = (centerX - node.x) * 0.02;
      const gravityY = (centerY - node.y) * 0.02;

      node.vx = ((node.vx || 0) + gravityX) * damping;
      node.vy = ((node.vy || 0) + gravityY) * damping;

      const maxV = 7;
      const v = Math.sqrt((node.vx * node.vx) + (node.vy * node.vy));
      if (v > maxV) {
        node.vx = (node.vx / v) * maxV;
        node.vy = (node.vy / v) * maxV;
      }

      node.x += node.vx;
      node.y += node.vy;

      // Bound within canvas
      node.x = Math.max(38, Math.min(virtualWidth - 38, node.x));
      node.y = Math.max(38, Math.min(virtualHeight - 38, node.y));
    }
  }

  return currentNodes;
}
