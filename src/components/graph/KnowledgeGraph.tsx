import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Note, GraphNode, GraphEdge, NoteType } from '../../types/note';
import {
  buildKnowledgeGraph,
  computeGraphLayout,
  GRAPH_VIRTUAL_WIDTH as VIRTUAL_WIDTH,
  GRAPH_VIRTUAL_HEIGHT as VIRTUAL_HEIGHT,
} from '../../services/connectionEngine';
import { Colors, NoteTypeMeta } from '../../theme/colors';

interface KnowledgeGraphProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onOpenNoteDetail: (noteId: string) => void;
  filterType?: NoteType | 'all';
}

const CANVAS_HEIGHT = 350;

export function KnowledgeGraph({
  notes,
  selectedNoteId,
  onSelectNote,
  onOpenNoteDetail,
  filterType = 'all',
}: KnowledgeGraphProps) {
  // Graph topology
  const rawGraph = useMemo(() => buildKnowledgeGraph(notes), [notes]);

  // Synchronously compute node positions with force layout
  const nodePositions = useMemo(() => computeGraphLayout(rawGraph), [rawGraph]);

  // Filter nodes if specified
  const filteredNoteIds = useMemo(() => {
    if (!filterType || filterType === 'all') return new Set(notes.map(n => n.id));
    return new Set(notes.filter(n => n.type === filterType).map(n => n.id));
  }, [notes, filterType]);

  // Simulation state
  const [scale, setScale] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [canvasLayout, setCanvasLayout] = useState({ width: 360, height: CANVAS_HEIGHT });

  // References for latest state in pan handlers
  const panStartOffset = useRef({ x: 0, y: 0 });
  const latestRef = useRef({
    offset,
    scale,
    nodePositions,
    filteredNoteIds,
    canvasLayout,
    onSelectNote,
  });
  latestRef.current = {
    offset,
    scale,
    nodePositions,
    filteredNoteIds,
    canvasLayout,
    onSelectNote,
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6,
      onPanResponderGrant: () => {
        panStartOffset.current = { ...latestRef.current.offset };
      },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        setOffset({
          x: panStartOffset.current.x + gestureState.dx,
          y: panStartOffset.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // If movement was small, treat as a tap on the canvas
        if (Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8) {
          const {
            offset: curOffset,
            scale: curScale,
            nodePositions: curNodes,
            filteredNoteIds: curFiltered,
            canvasLayout: curLayout,
            onSelectNote: curOnSelect,
          } = latestRef.current;

          const locX = e.nativeEvent.locationX;
          const locY = e.nativeEvent.locationY;
          const cWidth = curLayout.width || 360;
          const cHeight = curLayout.height || CANVAS_HEIGHT;

          // Project touch coordinate into SVG virtual space
          const svgX = -curOffset.x / curScale + (locX / cWidth) * (VIRTUAL_WIDTH / curScale);
          const svgY = -curOffset.y / curScale + (locY / cHeight) * (VIRTUAL_HEIGHT / curScale);

          // Find closest node within 55 virtual units
          let closestNode: GraphNode | null = null;
          let minDistance = 55;

          for (const node of curNodes) {
            if (!curFiltered.has(node.id)) continue;
            const dx = node.x - svgX;
            const dy = node.y - svgY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) {
              minDistance = dist;
              closestNode = node;
            }
          }

          if (closestNode) {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            curOnSelect(closestNode.id);
          }
        }
      },
    })
  ).current;

  // Selected node details with reliable fallback to first note
  const effectiveSelectedId = selectedNoteId || (notes.length > 0 ? notes[0].id : null);
  const selectedNode = nodePositions.find(n => n.id === effectiveSelectedId);
  const selectedNote = notes.find(n => n.id === effectiveSelectedId);

  // Filtered edges
  const visibleEdges = rawGraph.edges.filter(
    e => filteredNoteIds.has(e.source) && filteredNoteIds.has(e.target)
  );

  if (notes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="git-network-outline" size={38} color={Colors.primaryLight} />
        </View>
        <Text style={styles.emptyTitle}>Knowledge Mesh is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Capture your first note, article, code snippet, or reflection. Memory Mesh will automatically connect related concepts and weave an interactive graph.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Interactive SVG Canvas */}
      <View
        style={styles.svgWrapper}
        {...panResponder.panHandlers}
        onLayout={e => setCanvasLayout(e.nativeEvent.layout)}
      >
        <Svg
          width="100%"
          height={CANVAS_HEIGHT}
          viewBox={`${-offset.x / scale} ${-offset.y / scale} ${VIRTUAL_WIDTH / scale} ${VIRTUAL_HEIGHT / scale}`}
        >
          {/* Background grid subtle dots */}
          <G opacity={0.15}>
            {Array.from({ length: 15 }).map((_, r) =>
              Array.from({ length: 15 }).map((__, c) => (
                <Circle
                  key={`dot-${r}-${c}`}
                  cx={r * 45}
                  cy={c * 45}
                  r={1}
                  fill={Colors.textSecondary}
                />
              ))
            )}
          </G>

          {/* Edges */}
          {visibleEdges.map(edge => {
            const source = nodePositions.find(n => n.id === edge.source);
            const target = nodePositions.find(n => n.id === edge.target);
            if (!source || !target) return null;

            const isConnectedToSelected =
              selectedNoteId === edge.source || selectedNoteId === edge.target;

            return (
              <Line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={
                  isConnectedToSelected
                    ? Colors.primaryLight
                    : edge.isExplicit
                    ? 'rgba(129, 140, 248, 0.5)'
                    : 'rgba(71, 85, 105, 0.35)'
                }
                strokeWidth={isConnectedToSelected ? 2.5 : Math.max(1, edge.strength * 2)}
                strokeDasharray={edge.isExplicit ? undefined : '4, 4'}
              />
            );
          })}

          {/* Nodes */}
          {nodePositions
            .filter(node => filteredNoteIds.has(node.id))
            .map(node => {
              const isSelected = node.id === selectedNoteId;
              const meta = NoteTypeMeta[node.type];
              const nodeColor = meta?.color || Colors.primary;

              return (
                <G
                  key={node.id}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    onSelectNote(node.id);
                  }}
                >
                  {/* Outer selection ring / glow */}
                  {isSelected && (
                    <Circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius + 8}
                      fill="none"
                      stroke={Colors.primaryLight}
                      strokeWidth={2}
                      opacity={0.8}
                    />
                  )}

                  {/* Main Node Circle */}
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={nodeColor}
                    opacity={isSelected ? 1 : 0.88}
                  />

                  {/* Degree badge */}
                  {node.connectionsCount > 0 && (
                    <G>
                      <Circle
                        cx={node.x + node.radius - 4}
                        cy={node.y - node.radius + 4}
                        r={8}
                        fill="#0F172A"
                        stroke={nodeColor}
                        strokeWidth={1.5}
                      />
                      <SvgText
                        x={node.x + node.radius - 4}
                        y={node.y - node.radius + 7}
                        fill={Colors.text}
                        fontSize={9}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {node.connectionsCount}
                      </SvgText>
                    </G>
                  )}

                  {/* Node Label */}
                  <SvgText
                    x={node.x}
                    y={node.y + node.radius + 14}
                    fill={isSelected ? Colors.text : Colors.textSecondary}
                    fontSize={10.5}
                    fontWeight={isSelected ? 'bold' : '500'}
                    textAnchor="middle"
                  >
                    {node.title.length > 16 ? node.title.slice(0, 14) + '…' : node.title}
                  </SvgText>
                </G>
              );
            })}
        </Svg>
      </View>

      {/* Zoom and Reset Controls Overlay (rendered on top of canvas) */}
      <View style={styles.controlsBar} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => setScale(s => Math.min(s + 0.25, 2.2))}
          style={styles.controlButton}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setScale(s => Math.max(s - 0.25, 0.6))}
          style={styles.controlButton}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={18} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setScale(1.0);
            setOffset({ x: 0, y: 0 });
          }}
          style={styles.controlButton}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={16} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Selected Node Bottom Card Inspector */}
      {selectedNote && selectedNode && (
        <View style={styles.inspectorCard}>
          <View style={styles.inspectorHeader}>
            <View style={styles.typeBadgeRow}>
              <View
                style={[
                  styles.typePill,
                  { backgroundColor: NoteTypeMeta[selectedNote.type]?.bgColor },
                ]}
              >
                <Ionicons
                  name={NoteTypeMeta[selectedNote.type]?.icon as any}
                  size={12}
                  color={NoteTypeMeta[selectedNote.type]?.color}
                />
                <Text
                  style={[
                    styles.typePillText,
                    { color: NoteTypeMeta[selectedNote.type]?.color },
                  ]}
                >
                  {NoteTypeMeta[selectedNote.type]?.label}
                </Text>
              </View>

              <View style={styles.connectionBadge}>
                <Ionicons name="git-network-outline" size={12} color={Colors.cyan} />
                <Text style={styles.connectionBadgeText}>
                  {selectedNode.connectionsCount} {selectedNode.connectionsCount === 1 ? 'connection' : 'connections'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => onOpenNoteDetail(selectedNote.id)}
              style={styles.openDetailButton}
              activeOpacity={0.7}
            >
              <Text style={styles.openDetailText}>Open Note</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.primaryLight} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inspectorTitle} numberOfLines={1}>
            {selectedNote.title}
          </Text>

          <Text style={styles.inspectorSnippet} numberOfLines={2}>
            {selectedNote.content.replace(/[#*`>]/g, '').trim()}
          </Text>

          {/* Tags */}
          {selectedNote.tags.length > 0 && (
            <View style={styles.tagRow}>
              {selectedNote.tags.slice(0, 4).map(tag => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#070B14',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  emptyContainer: {
    width: '100%',
    padding: 36,
    backgroundColor: '#070B14',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  emptyIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
  },
  controlsBar: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 100,
    elevation: 30,
    flexDirection: 'column',
    gap: 6,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrapper: {
    width: '100%',
    height: CANVAS_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inspectorCard: {
    padding: 16,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inspectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.cyanMuted,
  },
  connectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.cyan,
  },
  openDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  openDetailText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  inspectorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  inspectorSnippet: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
