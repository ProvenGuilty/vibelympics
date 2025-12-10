import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface Dependency {
  name: string;
  version: string;
  ecosystem: string;
  direct: boolean;
  parent?: string;
  vulnerabilityCount: number;
  maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none';
}

interface DependencyGraphProps {
  dependencies: Dependency[];
  targetPackage: string;
  targetVersion?: string;
  onSelectDependency: (dep: Dependency) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  version: string;
  vulnerabilityCount: number;
  maxSeverity: string;
  direct: boolean;
  isRoot: boolean;
  depth: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

// Professional color palette
const COLORS = {
  bg: '#0f172a',
  nodeBg: '#1e293b',
  nodeStroke: '#334155',
  rootStroke: '#8b5cf6',
  link: '#475569',
  linkHover: '#8b5cf6',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  clean: '#10b981',
  low: '#22d3ee',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export default function DependencyGraph({ 
  dependencies, 
  targetPackage,
  onSelectDependency 
}: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [, setSelectedNode] = useState<string | null>(null);

  const getSeverityColor = useCallback((severity: string, vulnCount: number) => {
    if (vulnCount === 0) return COLORS.clean;
    switch (severity) {
      case 'critical': return COLORS.critical;
      case 'high': return COLORS.high;
      case 'medium': return COLORS.medium;
      case 'low': return COLORS.low;
      default: return COLORS.clean;
    }
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ 
          width: Math.max(800, rect.width), 
          height: 600 
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dependencies.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background', COLORS.bg);

    // Build hierarchy - root at center, direct deps in ring, transitive in outer ring
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Add root node
    const rootDep = dependencies.find(d => d.name === targetPackage);
    const rootNode: GraphNode = {
      id: targetPackage,
      name: targetPackage,
      version: rootDep?.version || '',
      vulnerabilityCount: rootDep?.vulnerabilityCount || 0,
      maxSeverity: rootDep?.maxSeverity || 'none',
      direct: true,
      isRoot: true,
      depth: 0,
      x: width / 2,
      y: height / 2,
      fx: width / 2,
      fy: height / 2,
    };
    nodes.push(rootNode);
    nodeMap.set(targetPackage, rootNode);

    // Separate direct and transitive
    const directDeps = dependencies.filter(d => d.direct && d.name !== targetPackage);
    const transitiveDeps = dependencies.filter(d => !d.direct && d.name !== targetPackage);

    // Position direct deps in inner ring
    const innerRadius = Math.min(width, height) * 0.25;
    directDeps.forEach((dep, i) => {
      const angle = (2 * Math.PI * i) / directDeps.length - Math.PI / 2;
      const node: GraphNode = {
        id: dep.name,
        name: dep.name,
        version: dep.version,
        vulnerabilityCount: dep.vulnerabilityCount,
        maxSeverity: dep.maxSeverity,
        direct: true,
        isRoot: false,
        depth: 1,
        x: width / 2 + innerRadius * Math.cos(angle),
        y: height / 2 + innerRadius * Math.sin(angle),
      };
      nodes.push(node);
      nodeMap.set(dep.name, node);
      links.push({ source: targetPackage, target: dep.name });
    });

    // Position transitive deps in outer ring
    const outerRadius = Math.min(width, height) * 0.42;
    transitiveDeps.forEach((dep, i) => {
      const angle = (2 * Math.PI * i) / transitiveDeps.length - Math.PI / 2;
      const node: GraphNode = {
        id: dep.name,
        name: dep.name,
        version: dep.version,
        vulnerabilityCount: dep.vulnerabilityCount,
        maxSeverity: dep.maxSeverity,
        direct: false,
        isRoot: false,
        depth: 2,
        x: width / 2 + outerRadius * Math.cos(angle),
        y: height / 2 + outerRadius * Math.sin(angle),
      };
      nodes.push(node);
      nodeMap.set(dep.name, node);
      
      // Link to parent or to a random direct dep
      if (dep.parent && nodeMap.has(dep.parent)) {
        links.push({ source: dep.parent, target: dep.name });
      } else if (directDeps.length > 0) {
        const parentIdx = i % directDeps.length;
        links.push({ source: directDeps[parentIdx].name, target: dep.name });
      } else {
        links.push({ source: targetPackage, target: dep.name });
      }
    });

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2.5])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Gradient definitions
    const defs = svg.append('defs');
    
    // Glow filter for root
    const glow = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glow.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Container for zoom/pan
    const container = svg.append('g');

    // Force simulation with radial positioning
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => {
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
          if (source.isRoot) return innerRadius;
          if (target.depth === 2) return outerRadius - innerRadius;
          return 100;
        })
        .strength(0.8))
      .force('charge', d3.forceManyBody()
        .strength(d => (d as GraphNode).isRoot ? -500 : -150))
      .force('radial', d3.forceRadial<GraphNode>(
        d => d.isRoot ? 0 : d.direct ? innerRadius : outerRadius,
        width / 2,
        height / 2
      ).strength(0.8))
      .force('collision', d3.forceCollide<GraphNode>()
        .radius(d => d.isRoot ? 50 : 35));

    // Draw curved links
    const linkGroup = container.append('g').attr('class', 'links');
    const link = linkGroup.selectAll('path')
      .data(links)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', COLORS.link)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', d => {
        const target = typeof d.target === 'string' ? nodeMap.get(d.target) : d.target;
        return target && !target.direct ? '4,2' : 'none';
      });

    // Node groups
    const nodeGroup = container.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          if (!d.isRoot) {
            d.fx = null;
            d.fy = null;
          }
        }));

    // Node circles with gradient fill
    node.append('circle')
      .attr('r', d => d.isRoot ? 40 : d.direct ? 28 : 20)
      .attr('fill', d => {
        const baseColor = getSeverityColor(d.maxSeverity, d.vulnerabilityCount);
        return d.isRoot ? COLORS.nodeBg : baseColor;
      })
      .attr('stroke', d => d.isRoot ? COLORS.rootStroke : getSeverityColor(d.maxSeverity, d.vulnerabilityCount))
      .attr('stroke-width', d => d.isRoot ? 4 : 3)
      .attr('filter', d => d.isRoot ? 'url(#glow)' : 'none')
      .attr('opacity', d => d.direct || d.isRoot ? 1 : 0.85);

    // Inner circle for non-root nodes (creates ring effect)
    node.filter(d => !d.isRoot)
      .append('circle')
      .attr('r', d => d.direct ? 22 : 15)
      .attr('fill', COLORS.nodeBg);

    // Vulnerability badge
    node.filter(d => d.vulnerabilityCount > 0 && !d.isRoot)
      .append('circle')
      .attr('r', 12)
      .attr('cx', d => d.direct ? 20 : 14)
      .attr('cy', d => d.direct ? -20 : -14)
      .attr('fill', d => getSeverityColor(d.maxSeverity, d.vulnerabilityCount))
      .attr('stroke', COLORS.bg)
      .attr('stroke-width', 2);

    node.filter(d => d.vulnerabilityCount > 0 && !d.isRoot)
      .append('text')
      .attr('x', d => d.direct ? 20 : 14)
      .attr('y', d => d.direct ? -16 : -10)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(d => d.vulnerabilityCount);

    // Package name (truncated)
    node.append('text')
      .attr('y', d => d.isRoot ? 5 : d.direct ? 4 : 3)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text)
      .attr('font-size', d => d.isRoot ? '14px' : d.direct ? '11px' : '9px')
      .attr('font-weight', d => d.isRoot ? 'bold' : 'normal')
      .text(d => {
        const maxLen = d.isRoot ? 20 : d.direct ? 12 : 8;
        return d.name.length > maxLen ? d.name.slice(0, maxLen - 2) + '..' : d.name;
      });

    // Version below name for root and direct
    node.filter(d => d.isRoot || d.direct)
      .append('text')
      .attr('y', d => d.isRoot ? 22 : 18)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.textMuted)
      .attr('font-size', d => d.isRoot ? '11px' : '9px')
      .text(d => d.version);

    // Hover effects
    node.on('mouseenter', function(_event, d) {
      setHoveredNode(d.id);
      d3.select(this).select('circle').transition().duration(150)
        .attr('stroke-width', d.isRoot ? 6 : 5);
      
      // Highlight connected links
      link.transition().duration(150)
        .attr('stroke', l => {
          const sourceId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
          const targetId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
          return sourceId === d.id || targetId === d.id ? COLORS.linkHover : COLORS.link;
        })
        .attr('stroke-opacity', l => {
          const sourceId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
          const targetId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
          return sourceId === d.id || targetId === d.id ? 1 : 0.3;
        })
        .attr('stroke-width', l => {
          const sourceId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
          const targetId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
          return sourceId === d.id || targetId === d.id ? 2.5 : 1.5;
        });
    })
    .on('mouseleave', function(_event, d) {
      setHoveredNode(null);
      d3.select(this).select('circle').transition().duration(150)
        .attr('stroke-width', d.isRoot ? 4 : 3);
      
      link.transition().duration(150)
        .attr('stroke', COLORS.link)
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1.5);
    })
    .on('click', (_event, d) => {
      setSelectedNode(d.id);
      const dep = dependencies.find(dep => dep.name === d.name);
      if (dep) onSelectDependency(dep);
    });

    // Curved link paths
    const linkArc = (d: GraphLink) => {
      const source = d.source as GraphNode;
      const target = d.target as GraphNode;
      const dx = target.x! - source.x!;
      const dy = target.y! - source.y!;
      const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
      return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
    };

    simulation.on('tick', () => {
      link.attr('d', linkArc);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Run simulation
    simulation.alpha(1).restart();

    // Fit to view after simulation settles
    setTimeout(() => {
      const bounds = container.node()?.getBBox();
      if (bounds) {
        const scale = 0.85 * Math.min(width / bounds.width, height / bounds.height);
        const tx = (width - bounds.width * scale) / 2 - bounds.x * scale;
        const ty = (height - bounds.height * scale) / 2 - bounds.y * scale;
        svg.transition().duration(500).call(
          zoom.transform,
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
      }
    }, 1500);

    return () => { simulation.stop(); };
  }, [dependencies, targetPackage, dimensions, onSelectDependency, getSeverityColor]);

  // Stats
  const vulnCount = dependencies.filter(d => d.vulnerabilityCount > 0).length;
  const directCount = dependencies.filter(d => d.direct).length;
  const transitiveCount = dependencies.filter(d => !d.direct).length;

  return (
    <div ref={containerRef} className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-lg text-white flex items-center gap-2">
              Dependency Graph
            </h4>
            <p className="text-sm text-slate-400 mt-1">
              {directCount} direct · {transitiveCount} transitive · {vulnCount > 0 ? (
                <span className="text-amber-400">{vulnCount} vulnerable</span>
              ) : (
                <span className="text-emerald-400">all clean</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></span>
              <span className="text-slate-300">Clean</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/30"></span>
              <span className="text-slate-300">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-500/30"></span>
              <span className="text-slate-300">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-500/30"></span>
              <span className="text-slate-300">Critical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="relative">
        <svg ref={svgRef} className="w-full" style={{ minHeight: '600px' }} />
        
        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-slate-800/95 backdrop-blur border border-slate-600 rounded-lg px-4 py-3 shadow-xl">
            <div className="font-medium text-white">{hoveredNode}</div>
            <div className="text-xs text-slate-400 mt-1">Click for details</div>
          </div>
        )}

        {/* Controls hint */}
        <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-slate-900/80 px-3 py-2 rounded-lg">
          Scroll to zoom · Drag to pan · Click node for details
        </div>
      </div>
    </div>
  );
}
