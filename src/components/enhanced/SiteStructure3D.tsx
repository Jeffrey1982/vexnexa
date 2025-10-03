"use client";

import React, { useRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, ZoomIn, ZoomOut, Move3d, Eye } from 'lucide-react';

interface PageNode {
  id: string;
  url: string;
  title: string;
  level: number;
  issues: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  score: number;
  children: PageNode[];
}

interface SiteStructure3DProps {
  siteData: PageNode;
  className?: string;
}

// Simple 3D visualization using CSS transforms (since we can't use three.js due to React 18 conflicts)
function Node3D({
  node,
  x,
  y,
  z,
  rotation,
  scale,
  onNodeClick
}: {
  node: PageNode;
  x: number;
  y: number;
  z: number;
  rotation: { x: number; y: number; z: number };
  scale: number;
  onNodeClick: (node: PageNode) => void;
}) {
  const getNodeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getNodeSize = (level: number) => {
    return Math.max(20 - level * 3, 10);
  };

  const totalIssues = node.issues.critical + node.issues.serious + node.issues.moderate + node.issues.minor;

  return (
    <motion.div
      className="absolute cursor-pointer transform-gpu"
      style={{
        transform: `
          translate3d(${x * scale}px, ${y * scale}px, ${z * scale}px)
          rotateX(${rotation.x}deg)
          rotateY(${rotation.y}deg)
          rotateZ(${rotation.z}deg)
        `,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.2 }}
      onClick={() => onNodeClick(node)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: node.level * 0.1 }}
    >
      <div
        className={`
          rounded-full border-2 border-white shadow-lg
          ${getNodeColor(node.score)}
          flex items-center justify-center text-white font-bold text-xs
        `}
        style={{
          width: getNodeSize(node.level),
          height: getNodeSize(node.level),
        }}
      >
        {totalIssues > 0 ? totalIssues : '✓'}
      </div>

      {/* Connection lines to children */}
      {node.children.map((child, index) => (
        <div
          key={child.id}
          className="absolute bg-gray-400 opacity-60"
          style={{
            width: '2px',
            height: `${50 * scale}px`,
            left: '50%',
            top: '100%',
            transformOrigin: 'top',
            transform: `
              translateX(-50%)
              rotateZ(${index * (360 / node.children.length) - 90}deg)
            `,
          }}
        />
      ))}
    </motion.div>
  );
}

export function SiteStructure3D({ siteData, className }: SiteStructure3DProps) {
  const [selectedNode, setSelectedNode] = useState<PageNode | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'network' | 'hierarchy'>('tree');
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState(1);
  const [isRotating, setIsRotating] = useState(false);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [highlightIssues, setHighlightIssues] = useState<'all' | 'critical' | 'serious' | null>('all');
  const [showConnections, setShowConnections] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const positionedNodes = useMemo(() => {
    const nodes: Array<{ node: PageNode; x: number; y: number; z: number }> = [];

    const calculatePositions = (node: PageNode, level: number, parentX = 0, parentY = 0, parentZ = 0, angle = 0) => {
      // Filter by level if set
      if (filterLevel !== null && level > filterLevel) {
        return;
      }

      // Filter by issue severity
      if (highlightIssues === 'critical' && node.issues.critical === 0) {
        return;
      }
      if (highlightIssues === 'serious' && node.issues.serious === 0 && node.issues.critical === 0) {
        return;
      }

      let x, y, z;

      switch (viewMode) {
        case 'tree':
          x = parentX + (level * 100) * Math.cos(angle);
          y = parentY + (level * 100) * Math.sin(angle);
          z = level * -50;
          break;

        case 'network':
          const radius = 80 + level * 40;
          x = radius * Math.cos(angle) * Math.cos(level * 0.5);
          y = radius * Math.sin(angle) * Math.cos(level * 0.5);
          z = radius * Math.sin(level * 0.5);
          break;

        case 'hierarchy':
        default:
          x = parentX + (Math.random() - 0.5) * 100;
          y = level * 80;
          z = (Math.random() - 0.5) * 100;
      }

      nodes.push({ node, x, y, z });

      node.children.forEach((child, index) => {
        const childAngle = angle + (index - node.children.length / 2) * (Math.PI / 4);
        calculatePositions(child, level + 1, x, y, z, childAngle);
      });
    };

    calculatePositions(siteData, 0);
    return nodes;
  }, [siteData, viewMode, filterLevel, highlightIssues]);

  const handleRotate = () => {
    setIsRotating(!isRotating);
  };

  const resetView = () => {
    setRotation({ x: 0, y: 0, z: 0 });
    setScale(1);
    setIsRotating(false);
  };

  React.useEffect(() => {
    if (isRotating) {
      const interval = setInterval(() => {
        setRotation(prev => ({
          x: prev.x,
          y: (prev.y + animationSpeed) % 360,
          z: prev.z,
        }));
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isRotating, animationSpeed]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setRotation(prev => ({
        x: prev.x + deltaY * 0.5,
        y: prev.y + deltaX * 0.5,
        z: prev.z,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getTotalStats = (node: PageNode): { pages: number; issues: number } => {
    const stats = { pages: 1, issues: node.issues.critical + node.issues.serious + node.issues.moderate + node.issues.minor };

    node.children.forEach(child => {
      const childStats = getTotalStats(child);
      stats.pages += childStats.pages;
      stats.issues += childStats.issues;
    });

    return stats;
  };

  const totalStats = getTotalStats(siteData);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move3d className="h-5 w-5" />
          3D Site Structure
        </CardTitle>
        <CardDescription>
          Interactive visualization of your website&apos;s accessibility landscape
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tree">Tree View</SelectItem>
                <SelectItem value="network">Network View</SelectItem>
                <SelectItem value="hierarchy">Hierarchy View</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={highlightIssues || 'all'}
              onValueChange={(value: any) => setHighlightIssues(value === 'all' ? 'all' : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter issues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pages</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="serious">Serious+</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterLevel?.toString() || 'all'}
              onValueChange={(value: string) => setFilterLevel(value === 'all' ? null : parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Depth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="1">Level 1</SelectItem>
                <SelectItem value="2">Level 2</SelectItem>
                <SelectItem value="3">Level 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant={isRotating ? "default" : "outline"}
              size="sm"
              onClick={handleRotate}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
            >
              Reset
            </Button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`relative h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden border ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ perspective: '1000px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {positionedNodes.map(({ node, x, y, z }, index) => (
              <Node3D
                key={node.id}
                node={node}
                x={x}
                y={y}
                z={z}
                rotation={rotation}
                scale={scale}
                onNodeClick={setSelectedNode}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg shadow-sm">
            <div className="text-xs font-semibold mb-2">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Score 80+</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span>Score 60-79</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span>Score &lt;60</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg shadow-sm">
            <div className="text-xs font-semibold mb-2">Site Overview</div>
            <div className="space-y-1 text-xs">
              <div>Pages: {totalStats.pages}</div>
              <div>Total Issues: {totalStats.issues}</div>
              <div>Avg Score: {Math.round(siteData.score)}</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-sm">
            <div className="text-xs text-gray-600">
              • Click nodes for details<br/>
              • Drag to rotate manually<br/>
              • Use filters to focus<br/>
              • Numbers show issue count
            </div>
          </div>

          {/* Node count */}
          <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-lg shadow-sm">
            <div className="text-xs text-gray-600">
              Showing {positionedNodes.length} nodes
            </div>
          </div>
        </div>

        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">{selectedNode.title}</h4>
                <p className="text-sm text-gray-600">{selectedNode.url}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold">{selectedNode.score}</div>
                <div className="text-xs text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{selectedNode.issues.critical}</div>
                <div className="text-xs text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{selectedNode.issues.serious}</div>
                <div className="text-xs text-gray-600">Serious</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{selectedNode.issues.moderate}</div>
                <div className="text-xs text-gray-600">Moderate</div>
              </div>
            </div>

            {selectedNode.children.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm text-gray-600">
                  Connected to {selectedNode.children.length} child page{selectedNode.children.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}