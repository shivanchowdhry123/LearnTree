'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  ChevronRight,
  ExternalLink,
  Edit2,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  HelpCircle,
  FolderGit2,
  Layers,
  ArrowRightLeft,
  Info,
  X,
} from 'lucide-react';
import type { SyllabusNode, SyllabusNodeStatus } from '../types/syllabus';

interface HierarchyDatum {
  id: string;
  title: string;
  url?: string;
  tags: string[];
  status: SyllabusNodeStatus | 'root';
  depth: number;
  isDue: boolean;
  interval?: number;
  repetition?: number;
  easeFactor?: number;
  rawNode?: SyllabusNode;
  children?: HierarchyDatum[];
  _children?: HierarchyDatum[];
}

interface SyllabusTreeGraphProps {
  repoName: string;
  repoCode?: string;
  nodes: SyllabusNode[];
  searchQuery?: string;
  selectedTag?: string | null;
  filterMode?: 'all' | 'due' | 'in_progress' | 'mastered' | 'unstarted' | 'tags';
  onEditNode?: (node: SyllabusNode) => void;
  onAddChildNode?: (parentId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onNodeStatusChange?: (nodeId: string, status: SyllabusNodeStatus) => void;
  onMarkDueNow?: (nodeId: string) => void;
  onOpenReview?: () => void;
}

export const SyllabusTreeGraph: React.FC<SyllabusTreeGraphProps> = ({
  repoName,
  repoCode,
  nodes,
  searchQuery = '',
  selectedTag = null,
  filterMode = 'all',
  onEditNode,
  onAddChildNode,
  onDeleteNode,
  onNodeStatusChange,
  onMarkDueNow,
  onOpenReview,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Layout settings
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [selectedNode, setSelectedNode] = useState<HierarchyDatum | null>(null);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Zoom transform tracking
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Check if a node is due for review
  const checkIsDue = useCallback((node: SyllabusNode): boolean => {
    if (node.sm2State?.nextReviewAt) {
      return new Date(node.sm2State.nextReviewAt).getTime() <= Date.now();
    }
    return node.status !== 'unstarted';
  }, []);

  // Convert SyllabusNode tree to D3 HierarchyDatum
  const buildHierarchyData = useCallback((): HierarchyDatum => {
    function mapNode(node: SyllabusNode): HierarchyDatum {
      const isCollapsed = collapsedNodeIds.has(node.id);
      const mappedChildren = node.children && node.children.length > 0 
        ? node.children.map(mapNode) 
        : undefined;

      return {
        id: node.id,
        title: node.title,
        url: node.url,
        tags: node.tags || [],
        status: node.status,
        depth: node.depth,
        isDue: checkIsDue(node),
        interval: node.sm2State?.interval,
        repetition: node.sm2State?.repetition,
        easeFactor: node.sm2State?.easeFactor,
        rawNode: node,
        // D3 collapsible logic: keep in _children if collapsed
        children: isCollapsed ? undefined : mappedChildren,
        _children: mappedChildren,
      };
    }

    return {
      id: 'repo-root',
      title: repoName || 'Syllabus Repository',
      tags: repoCode ? [repoCode] : [],
      status: 'root',
      depth: 0,
      isDue: false,
      children: nodes.map(mapNode),
      _children: nodes.map(mapNode),
    };
  }, [nodes, repoName, repoCode, collapsedNodeIds, checkIsDue]);

  // Compute stats for legend
  const treeStats = useMemo(() => {
    let total = 0;
    let mastered = 0;
    let due = 0;
    let inProgress = 0;
    let maxDepth = 0;

    function traverse(items: SyllabusNode[]) {
      for (const item of items) {
        total++;
        if (item.depth > maxDepth) maxDepth = item.depth;
        if (item.status === 'mastered') mastered++;
        else if (item.status === 'in_progress') inProgress++;
        if (checkIsDue(item)) due++;
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    }
    traverse(nodes);

    return { total, mastered, due, inProgress, maxDepth };
  }, [nodes, checkIsDue]);

  // Toggle node collapse
  const handleToggleCollapse = useCallback((nodeId: string) => {
    if (nodeId === 'repo-root') return;
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Expand all
  const handleExpandAll = useCallback(() => {
    setCollapsedNodeIds(new Set());
  }, []);

  // Collapse children to level 1
  const handleCollapseToLevel1 = useCallback(() => {
    const collapsed = new Set<string>();
    function collectLevel1(items: SyllabusNode[]) {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          collapsed.add(item.id);
        }
      }
    }
    collectLevel1(nodes);
    setCollapsedNodeIds(collapsed);
  }, [nodes]);

  // Reset zoom / fit to view
  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const { clientWidth, clientHeight } = containerRef.current;

    svg.transition()
      .duration(650)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(clientWidth / 4, clientHeight / 2).scale(0.85)
      );
  }, []);

  // Zoom In
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
  }, []);

  // Zoom Out
  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.77);
  }, []);

  // Render D3 Tree
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 650;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs: Gradients, filters, dot grid
    const defs = svg.append('defs');

    // Background Dot Grid Pattern
    const pattern = defs
      .append('pattern')
      .attr('id', 'tree-dot-grid')
      .attr('width', 24)
      .attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern
      .append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 1)
      .attr('fill', '#202538')
      .attr('opacity', 0.6);

    // Glow filter for highlighted nodes & due items
    const filter = defs
      .append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');
    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    filter
      .append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Background rect with grid
    svg
      .append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#090a0f');

    svg
      .append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#tree-dot-grid)');

    // Main graph group for pan & zoom
    const g = svg.append('g').attr('class', 'tree-main-group');

    // Setup zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Build hierarchy
    const rootData = buildHierarchyData();
    const root = d3.hierarchy<HierarchyDatum>(rootData);

    // Node sizing & spacing
    // Horizontal: [height, width], Vertical: [width, height]
    const nodeWidth = 220;
    const nodeHeight = 70;

    let treeLayout: d3.TreeLayout<HierarchyDatum>;

    if (orientation === 'horizontal') {
      treeLayout = d3.tree<HierarchyDatum>().nodeSize([nodeHeight + 32, nodeWidth + 80]);
    } else {
      treeLayout = d3.tree<HierarchyDatum>().nodeSize([nodeWidth + 40, nodeHeight + 60]);
    }

    treeLayout(root);

    // Links group
    const linkGroup = g.append('g').attr('class', 'links-group');
    // Nodes group
    const nodeGroup = g.append('g').attr('class', 'nodes-group');

    // Generate links
    const links = root.links();

    // Link generator
    let linkGenerator: any;
    if (orientation === 'horizontal') {
      linkGenerator = d3
        .linkHorizontal<any, d3.HierarchyPointNode<HierarchyDatum>>()
        .x((d) => d.y)
        .y((d) => d.x);
    } else {
      linkGenerator = d3
        .linkVertical<any, d3.HierarchyPointNode<HierarchyDatum>>()
        .x((d) => d.x)
        .y((d) => d.y);
    }

    // Render Links
    linkGroup
      .selectAll('path.tree-link')
      .data(links)
      .join('path')
      .attr('class', 'tree-link')
      .attr('d', (d) => linkGenerator(d))
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        const target = d.target.data;
        if (target.isDue) return '#f59e0b';
        if (target.status === 'mastered') return '#10b981';
        if (target.status === 'in_progress') return '#06b6d4';
        return '#252a3d';
      })
      .attr('stroke-width', (d) => (d.target.data.status === 'mastered' ? 2 : 1.5))
      .attr('stroke-opacity', (d) => {
        const target = d.target.data;
        if (target.status === 'root') return 0.7;
        return target.status === 'unstarted' ? 0.35 : 0.75;
      })
      .attr('stroke-dasharray', (d) => (d.target.data.status === 'unstarted' ? '4,4' : 'none'));

    // Render Nodes
    const nodeEnter = nodeGroup
      .selectAll('g.tree-node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'tree-node')
      .attr('cursor', 'pointer')
      .attr('transform', (d) => {
        return orientation === 'horizontal'
          ? `translate(${d.y},${d.x})`
          : `translate(${d.x},${d.y})`;
      });

    // Check matching search or filter
    const matchesQuery = (d: HierarchyDatum) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = d.title.toLowerCase().includes(q);
      const tagMatch = d.tags.some((t) => t.toLowerCase().includes(q));
      return titleMatch || tagMatch;
    };

    const matchesFilter = (d: HierarchyDatum) => {
      if (filterMode === 'all') return true;
      if (filterMode === 'due') return d.isDue;
      if (filterMode === 'in_progress') return d.status === 'in_progress';
      if (filterMode === 'mastered') return d.status === 'mastered';
      if (filterMode === 'unstarted') return d.status === 'unstarted';
      if (filterMode === 'tags' && selectedTag) return d.tags.includes(selectedTag);
      return true;
    };

    // Card dimensions
    const cardW = 200;
    const cardH = 56;
    const halfW = cardW / 2;
    const halfH = cardH / 2;

    // Node Card Rectangle
    nodeEnter
      .append('rect')
      .attr('x', -halfW)
      .attr('y', -halfH)
      .attr('width', cardW)
      .attr('height', cardH)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d) => {
        if (d.data.status === 'root') return '#0f172a';
        if (d.data.isDue) return '#17120a';
        if (d.data.status === 'mastered') return '#081711';
        if (d.data.status === 'in_progress') return '#08161d';
        return '#10121a';
      })
      .attr('stroke', (d) => {
        const isMatched = matchesQuery(d.data) && matchesFilter(d.data);
        if (!isMatched && (searchQuery || filterMode !== 'all')) return '#1e2230';
        if (selectedNode?.id === d.data.id) return '#6366f1';
        if (d.data.status === 'root') return '#3b82f6';
        if (d.data.isDue) return '#f59e0b';
        if (d.data.status === 'mastered') return '#10b981';
        if (d.data.status === 'in_progress') return '#06b6d4';
        return '#252a3d';
      })
      .attr('stroke-width', (d) => (selectedNode?.id === d.data.id ? 2.5 : 1.5))
      .attr('opacity', (d) => {
        const isMatched = matchesQuery(d.data) && matchesFilter(d.data);
        if (!isMatched && (searchQuery || filterMode !== 'all')) return 0.35;
        return 1;
      })
      .style('transition', 'all 0.2s ease');

    // Status Pill Indicator (Left side bar)
    nodeEnter
      .append('rect')
      .attr('x', -halfW)
      .attr('y', -halfH)
      .attr('width', 4)
      .attr('height', cardH)
      .attr('rx', 2)
      .attr('fill', (d) => {
        if (d.data.status === 'root') return '#3b82f6';
        if (d.data.isDue) return '#f59e0b';
        if (d.data.status === 'mastered') return '#10b981';
        if (d.data.status === 'in_progress') return '#06b6d4';
        return '#475569';
      });

    // Node Title Text
    nodeEnter
      .append('text')
      .attr('x', -halfW + 12)
      .attr('y', -halfH + 20)
      .attr('font-size', '11px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .attr('font-weight', '600')
      .attr('fill', (d) => (d.data.status === 'root' ? '#93c5fd' : '#f1f5f9'))
      .text((d) => {
        const full = d.data.title;
        return full.length > 22 ? full.slice(0, 20) + '…' : full;
      });

    // Subtext / Tags / Status Badge
    nodeEnter
      .append('text')
      .attr('x', -halfW + 12)
      .attr('y', -halfH + 38)
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .attr('fill', (d) => {
        if (d.data.status === 'root') return '#60a5fa';
        if (d.data.isDue) return '#fbbf24';
        if (d.data.status === 'mastered') return '#34d399';
        if (d.data.status === 'in_progress') return '#38bdf8';
        return '#94a3b8';
      })
      .text((d) => {
        if (d.data.status === 'root') return `Repository Root (${nodes.length} sections)`;
        if (d.data.isDue) return `⚡ Due for SM-2 review`;
        if (d.data.status === 'mastered') return `✓ Mastered (Int: ${d.data.interval || 1}d)`;
        if (d.data.status === 'in_progress') return `⟳ In Progress (L${d.data.depth})`;
        return `○ Unstarted (L${d.data.depth})`;
      });

    // Child count / Collapse button badge (Right side)
    const hasChildrenNodes = nodeEnter.filter((d) => {
      const datum = d.data;
      return !!(datum._children && datum._children.length > 0);
    });

    const badgeGroup = hasChildrenNodes
      .append('g')
      .attr('class', 'collapse-badge')
      .attr('transform', `translate(${halfW - 14}, 0)`)
      .on('click', (event, d) => {
        event.stopPropagation();
        handleToggleCollapse(d.data.id);
      });

    badgeGroup
      .append('circle')
      .attr('r', 10)
      .attr('fill', '#181b26')
      .attr('stroke', '#333b52')
      .attr('stroke-width', 1);

    badgeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '3.5px')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('fill', '#94a3b8')
      .text((d) => {
        const isCollapsed = collapsedNodeIds.has(d.data.id);
        const count = d.data._children ? d.data._children.length : 0;
        return isCollapsed ? `+${count}` : `${count}`;
      });

    // Node Click Handlers
    nodeEnter.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d.data);
      setIsConfirmingDelete(false);
    });

    // Initial View Transform
    if (orientation === 'horizontal') {
      const initialTransform = d3.zoomIdentity
        .translate(80, height / 2)
        .scale(0.85);
      svg.call(zoom.transform, initialTransform);
    } else {
      const initialTransform = d3.zoomIdentity
        .translate(width / 2, 60)
        .scale(0.85);
      svg.call(zoom.transform, initialTransform);
    }

  }, [
    nodes,
    orientation,
    collapsedNodeIds,
    searchQuery,
    selectedTag,
    filterMode,
    selectedNode?.id,
    buildHierarchyData,
    handleToggleCollapse,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[640px] sm:h-[700px] bg-[#090a0f] rounded-lg border border-[#1e2230] overflow-hidden flex flex-col select-none"
    >
      {/* Top Floating Controls Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Title & Quick Stats */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#12141c]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1e2230] shadow-lg">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#6366f1]" />
            <span className="font-mono text-xs font-semibold text-[#f1f5f9]">
              D3 Hierarchy Graph
            </span>
          </div>
          <span className="text-[#3c445c]">|</span>
          <div className="text-[11px] font-mono text-[#94a3b8] flex items-center gap-2">
            <span>{treeStats.total} Concepts</span>
            <span className="text-[#10b981]">✓ {treeStats.mastered}</span>
            <span className="text-[#f59e0b]">⚡ {treeStats.due}</span>
            <span className="text-[#06b6d4]">Max Depth {treeStats.maxDepth}</span>
          </div>
        </div>

        {/* Right: Interactive Zoom & Layout Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#12141c]/90 backdrop-blur-md p-1 rounded-lg border border-[#1e2230] shadow-lg">
          {/* Layout Orientation Toggle */}
          <button
            type="button"
            onClick={() => setOrientation((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'))}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded bg-[#181b26] hover:bg-[#222738] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
            title={`Switch to ${orientation === 'horizontal' ? 'Vertical (Top-to-Bottom)' : 'Horizontal (Left-to-Right)'} Layout`}
          >
            <ArrowRightLeft className="w-3 h-3 text-[#06b6d4]" />
            <span className="capitalize hidden sm:inline">{orientation}</span>
          </button>

          {/* Expand All */}
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-2 py-1 text-[11px] font-mono rounded hover:bg-[#1e2230] text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer hidden sm:block"
            title="Expand All Nodes"
          >
            Expand All
          </button>

          {/* Collapse to Level 1 */}
          <button
            type="button"
            onClick={handleCollapseToLevel1}
            className="px-2 py-1 text-[11px] font-mono rounded hover:bg-[#1e2230] text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer hidden sm:block"
            title="Collapse Subtrees"
          >
            Collapse L1
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-[#1e2230] text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-[#1e2230] text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Fit */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-[#1e2230] text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer"
            title="Fit to View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas for D3 Tree */}
      <svg
        ref={svgRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing outline-none"
        onClick={() => setSelectedNode(null)}
      />

      {/* Bottom Floating Legend Bar */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-3 bg-[#12141c]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1e2230] text-[11px] font-mono text-[#94a3b8] shadow-lg">
          <span className="text-[#475569] font-medium hidden sm:inline">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            Mastered
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#06b6d4]" />
            In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
            Due Now
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#475569]" />
            Unstarted
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            Root Repo
          </span>
        </div>

        <div className="pointer-events-auto text-[10px] font-mono text-[#64748b] bg-[#12141c]/80 backdrop-blur-md px-2 py-1 rounded border border-[#1e2230] hidden md:block">
          Scroll to Zoom • Drag to Pan • Click Node for Details
        </div>
      </div>

      {/* Selected Node Details Drawer / Popover */}
      {selectedNode && (
        <div className="absolute top-14 right-3 z-30 w-80 sm:w-88 bg-[#10121a]/95 backdrop-blur-md border border-[#2d3246] rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-right-4 duration-150">
          <div className="flex items-start justify-between gap-2 border-b border-[#1e2230] pb-2.5 mb-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-[#6366f1] uppercase tracking-wider font-semibold">
                {selectedNode.status === 'root' ? 'Repository Root' : `Level ${selectedNode.depth} Concept`}
              </span>
              <h4 className="text-sm font-bold text-[#f1f5f9] truncate font-sans">
                {selectedNode.title}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#181b26] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Node Metadata Badges */}
          <div className="space-y-2.5 text-xs font-mono">
            {/* Status Pill */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#94a3b8]">Status:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedNode.status === 'mastered'
                    ? 'bg-[#10b981]/20 text-[#10b981]'
                    : selectedNode.status === 'in_progress'
                    ? 'bg-[#06b6d4]/20 text-[#06b6d4]'
                    : selectedNode.status === 'root'
                    ? 'bg-[#3b82f6]/20 text-[#3b82f6]'
                    : 'bg-[#475569]/20 text-[#94a3b8]'
                }`}
              >
                {selectedNode.status}
              </span>
            </div>

            {/* SM-2 Recall Stats (for non-root nodes) */}
            {selectedNode.status !== 'root' && (
              <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-[#090a0f] border border-[#1e2230] text-[11px]">
                <div>
                  <div className="text-[#64748b] text-[10px]">Interval</div>
                  <div className="text-[#f1f5f9] font-bold">{selectedNode.interval ?? 0} days</div>
                </div>
                <div>
                  <div className="text-[#64748b] text-[10px]">Repetitions</div>
                  <div className="text-[#f1f5f9] font-bold">{selectedNode.repetition ?? 0}</div>
                </div>
                <div>
                  <div className="text-[#64748b] text-[10px]">Ease Factor</div>
                  <div className="text-[#f1f5f9] font-bold">{selectedNode.easeFactor ?? 2.5}</div>
                </div>
                <div>
                  <div className="text-[#64748b] text-[10px]">Review Status</div>
                  <div className={selectedNode.isDue ? 'text-[#f59e0b] font-bold' : 'text-[#10b981]'}>
                    {selectedNode.isDue ? '⚡ Due Now' : '✓ Scheduled'}
                  </div>
                </div>
              </div>
            )}

            {/* Primary Source URL */}
            {selectedNode.url && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94a3b8]">Source:</span>
                <a
                  href={selectedNode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6366f1] hover:underline flex items-center gap-1 truncate max-w-[180px]"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{selectedNode.url}</span>
                </a>
              </div>
            )}

            {/* Tags */}
            {selectedNode.tags && selectedNode.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedNode.tags.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-[#181b26] text-[#c0c1ff] border border-[#2d3246]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {selectedNode.rawNode && (
            <div className="mt-4 pt-3 border-t border-[#1e2230] flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                {/* Cycle Status */}
                {onNodeStatusChange && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextStatus: SyllabusNodeStatus =
                        selectedNode.status === 'unstarted'
                          ? 'in_progress'
                          : selectedNode.status === 'in_progress'
                          ? 'mastered'
                          : 'unstarted';
                      onNodeStatusChange(selectedNode.id, nextStatus);
                      setSelectedNode((prev) => (prev ? { ...prev, status: nextStatus } : null));
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded bg-[#181b26] hover:bg-[#222738] text-[#f1f5f9] border border-[#2d3246] text-xs font-mono transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>Next Status</span>
                  </button>
                )}

                {/* Mark Due Now / Start Review */}
                {selectedNode.isDue && onOpenReview ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNode(null);
                      onOpenReview();
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded bg-[#f59e0b] hover:bg-[#d97706] text-[#090a0f] font-bold text-xs font-mono transition-colors cursor-pointer shadow-sm"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Review Card</span>
                  </button>
                ) : onMarkDueNow ? (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkDueNow(selectedNode.id);
                      setSelectedNode((prev) => (prev ? { ...prev, isDue: true } : null));
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded bg-[#181b26] hover:bg-[#222738] text-[#f59e0b] border border-[#2d3246] text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mark Due</span>
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Edit Node */}
                {onEditNode && (
                  <button
                    type="button"
                    onClick={() => {
                      const raw = selectedNode.rawNode;
                      setSelectedNode(null);
                      if (raw) onEditNode(raw);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded bg-[#181b26] hover:bg-[#222738] text-[#f1f5f9] border border-[#2d3246] text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Edit Concept</span>
                  </button>
                )}

                {/* Add Child Node */}
                {onAddChildNode && (
                  <button
                    type="button"
                    onClick={() => {
                      const parentId = selectedNode.id;
                      setSelectedNode(null);
                      onAddChildNode(parentId);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded bg-[#181b26] hover:bg-[#222738] text-[#f1f5f9] border border-[#2d3246] text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>Add Child</span>
                  </button>
                )}
              </div>

              {/* Delete Node (with inline confirmation) */}
              {onDeleteNode && (
                <div className="pt-1">
                  {!isConfirmingDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-mono text-[#f43f5e] hover:bg-[#f43f5e]/10 rounded border border-transparent hover:border-[#f43f5e]/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Concept</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteNode(selectedNode.id);
                          setSelectedNode(null);
                        }}
                        className="flex-1 px-2 py-1 bg-[#f43f5e] text-[#090a0f] font-bold rounded text-[11px] font-mono hover:bg-[#e11d48] transition-colors cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1 bg-[#181b26] text-[#94a3b8] rounded text-[11px] font-mono hover:text-[#f1f5f9] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
