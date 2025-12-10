import { useEffect, useRef, useState } from 'react';
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
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export default function DependencyGraph({ 
  dependencies, 
  targetPackage,
  onSelectDependency 
}: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Get color based on severity
  const getSeverityColor = (severity: string, vulnCount: number) => {
    if (vulnCount === 0) return '#22c55e'; // green
    switch (severity) {
      case 'critical': return '#ef4444'; // red
      case 'high': return '#f97316'; // orange
      case 'medium': return '#eab308'; // yellow
      case 'low': return '#22c55e'; // green
      default: return '#6b7280'; // gray
    }
  };

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(600, width), height: 500 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dependencies.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create nodes
    const nodes: GraphNode[] = dependencies.map(dep => ({
      id: `${dep.name}@${dep.version}`,
      name: dep.name,
      version: dep.version,
      vulnerabilityCount: dep.vulnerabilityCount,
      maxSeverity: dep.maxSeverity,
      direct: dep.direct,
      isRoot: dep.name === targetPackage,
    }));

    // Create links (from parent to child)
    const links: GraphLink[] = [];
    const rootNode = nodes.find(n => n.isRoot);
    
    dependencies.forEach(dep => {
      if (dep.parent) {
        const parentNode = nodes.find(n => n.name === dep.parent);
        if (parentNode) {
          links.push({
            source: parentNode.id,
            target: `${dep.name}@${dep.version}`,
          });
        }
      } else if (!dep.direct && rootNode && dep.name !== targetPackage) {
        // Connect transitive deps to root if no parent specified
        links.push({
          source: rootNode.id,
          target: `${dep.name}@${dep.version}`,
        });
      } else if (dep.direct && dep.name !== targetPackage && rootNode) {
        // Connect direct deps to root
        links.push({
          source: rootNode.id,
          target: `${dep.name}@${dep.version}`,
        });
      }
    });

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create container group for zoom/pan
    const g = svg.append('g');

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    // Create arrow marker for links
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#64748b');

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#64748b')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

    // Create node groups
    const node = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
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
          d.fx = null;
          d.fy = null;
        }));

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => d.isRoot ? 25 : 18)
      .attr('fill', d => getSeverityColor(d.maxSeverity, d.vulnerabilityCount))
      .attr('stroke', d => d.isRoot ? '#8b5cf6' : '#1e293b')
      .attr('stroke-width', d => d.isRoot ? 4 : 2)
      .on('click', (_event, d) => {
        const dep = dependencies.find(dep => dep.name === d.name && dep.version === d.version);
        if (dep) onSelectDependency(dep);
      });

    // Add vulnerability count badge
    node.filter(d => d.vulnerabilityCount > 0)
      .append('circle')
      .attr('r', 10)
      .attr('cx', 12)
      .attr('cy', -12)
      .attr('fill', '#ef4444')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1);

    node.filter(d => d.vulnerabilityCount > 0)
      .append('text')
      .attr('x', 12)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(d => d.vulnerabilityCount);

    // Add labels
    node.append('text')
      .attr('dy', d => d.isRoot ? 40 : 32)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', d => d.isRoot ? '12px' : '10px')
      .attr('font-weight', d => d.isRoot ? 'bold' : 'normal')
      .text(d => d.name.length > 15 ? d.name.slice(0, 12) + '...' : d.name);

    // Add version labels
    node.append('text')
      .attr('dy', d => d.isRoot ? 52 : 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '8px')
      .text(d => d.version);

    // Add icons to nodes
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', d => d.isRoot ? '16px' : '12px')
      .text(d => {
        if (d.isRoot) return '🎯';
        if (d.vulnerabilityCount > 0) return '⚠️';
        return '📦';
      });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Initial zoom to fit
    const initialScale = Math.min(
      width / (nodes.length * 30),
      height / (nodes.length * 30),
      1
    );
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(Math.max(0.5, initialScale))
      .translate(-width / 2, -height / 2));

    return () => {
      simulation.stop();
    };
  }, [dependencies, targetPackage, dimensions, onSelectDependency]);

  return (
    <div ref={containerRef} className="bg-slate-900 rounded-lg overflow-hidden">
      <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <span>🕸️</span> Dependency Graph
        </h4>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> Clean
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Critical
          </span>
        </div>
      </div>
      <div className="text-xs text-slate-500 p-2 text-center">
        Drag to move nodes • Scroll to zoom • Click node for details
      </div>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}
