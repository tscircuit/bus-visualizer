import React, { useState, useEffect } from 'react';
import { Download } from "lucide-react";
import type { Objective, GraphData, Node, Edge } from '../solver-types';
import type { Obstacle } from '../types';

type Point = { x: number, y: number };

interface EditableMeshGraphProps {
  initialGraphData?: GraphData;
  generateNodes?: (x: number, y: number, width: number, height: number, level: number) => Node[];
  generateEdges?: (nodes: Node[]) => Edge[];
  onGraphChange?: (graphData: GraphData) => void;
}

// Color palette for paths and objectives
const COLORS = [
  '#e64980', '#cc5de8', '#845ef7',
  '#5c7cfa', '#339af0', '#22b8cf', '#20c997', '#f06595',
  '#51cf66', '#94d82d', '#fcc419', '#ff922b'
];

export const EditableMeshGraph = ({ 
  initialGraphData = { nodes: [], edges: [], obstacles: [], objectives: [] },
  generateNodes: customGenerateNodes,
  generateEdges: customGenerateEdges,
  onGraphChange
}: EditableMeshGraphProps) => {
  const [nodes, setNodes] = useState<Node[]>(initialGraphData.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialGraphData.edges);
  const [obstacles, setObstacles] = useState<Obstacle[]>(initialGraphData.obstacles ?? []);
  const [objectives] = useState<Objective[]>(initialGraphData.objectives || []);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const INITIAL_GRID_SIZE = 600;
  const MAX_LEVEL = 6;

  const defaultGenerateNodes = (x: number, y: number, width: number, height: number, level = 0): Node[] => {
    const nodeRect = { center: { x, y }, width, height };
    const hasObstacle = obstacles.some(obstacle => doRectsOverlap(nodeRect, obstacle));
    
    if (level === MAX_LEVEL && hasObstacle) {
      return [];
    }
    
    if (hasObstacle && level < MAX_LEVEL) {
      const newWidth = width / 2;
      const newHeight = height / 2;
      
      const childNodes = [
        defaultGenerateNodes(x - newWidth/2, y - newHeight/2, newWidth, newHeight, level + 1),
        defaultGenerateNodes(x + newWidth/2, y - newHeight/2, newWidth, newHeight, level + 1),
        defaultGenerateNodes(x - newWidth/2, y + newHeight/2, newWidth, newHeight, level + 1),
        defaultGenerateNodes(x + newWidth/2, y + newHeight/2, newWidth, newHeight, level + 1)
      ];
      
      return childNodes.flat().filter(child => !child.containsObstacle);
    }
    
    const node: Node = {
      id: `${x}-${y}-${level}`,
      x,
      y,
      width,
      height,
      level,
      rc: (MAX_LEVEL - level + 1)**2,
      containsObstacle: hasObstacle
    };
    
    return hasObstacle ? [] : [node];
  };

  const doRectsOverlap = (rect1: Obstacle, rect2: Obstacle): boolean => {
    const r1HalfWidth = rect1.width / 2;
    const r1HalfHeight = rect1.height / 2;
    const r2HalfWidth = rect2.width / 2;
    const r2HalfHeight = rect2.height / 2;
    
    return Math.abs(rect1.center.x - rect2.center.x) < (r1HalfWidth + r2HalfWidth) &&
           Math.abs(rect1.center.y - rect2.center.y) < (r1HalfHeight + r2HalfHeight);
  };

  const defaultGenerateEdges = (nodes: Node[]): Edge[] => {
    const edges: Edge[] = [];
    const processed = new Set();

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        if (node1.containsObstacle || node2.containsObstacle) continue;
        
        const connectionKey = `${node1.x},${node1.y}-${node2.x},${node2.y}`;
        if (!processed.has(connectionKey) && areNodesBordering(node1, node2)) {
          edges.push({ from: node1, to: node2 });
          processed.add(connectionKey);
        }
      }
    }
    return edges;
  };

  const areNodesBordering = (node1: Node, node2: Node): boolean => {
    const n1Left = node1.x - node1.width/2;
    const n1Right = node1.x + node1.width/2;
    const n1Top = node1.y - node1.height/2;
    const n1Bottom = node1.y + node1.height/2;
    
    const n2Left = node2.x - node2.width/2;
    const n2Right = node2.x + node2.width/2;
    const n2Top = node2.y - node2.height/2;
    const n2Bottom = node2.y + node2.height/2;
    
    const shareVerticalBorder = 
      (Math.abs(n1Right - n2Left) < 1 || Math.abs(n1Left - n2Right) < 1) &&
      !(n1Bottom < n2Top || n1Top > n2Bottom);
    
    const shareHorizontalBorder = 
      (Math.abs(n1Bottom - n2Top) < 1 || Math.abs(n1Top - n2Bottom) < 1) &&
      !(n1Right < n2Left || n1Left > n2Right);
    
    return shareVerticalBorder || shareHorizontalBorder;
  };

  const generateGraph = () => {
    const genNodes = customGenerateNodes || defaultGenerateNodes;
    const genEdges = customGenerateEdges || defaultGenerateEdges;

    const newNodes = genNodes(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, INITIAL_GRID_SIZE, INITIAL_GRID_SIZE, 0);
    const newEdges = genEdges(newNodes);

    setNodes(newNodes);
    setEdges(newEdges);

    if (onGraphChange) {
      onGraphChange({
        nodes: newNodes,
        edges: newEdges,
        obstacles,
        objectives
      });
    }
  };

  useEffect(() => {
    generateGraph();
  }, [obstacles, customGenerateNodes, customGenerateEdges]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing(true);
    setStartPoint({ x, y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !startPoint) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);
    const center = {
      x: startPoint.x + (currentX - startPoint.x) / 2,
      y: startPoint.y + (currentY - startPoint.y) / 2
    };
    
    const tempObstacle = { center, width, height };
    const genNodes = customGenerateNodes || defaultGenerateNodes;
    const newNodes = genNodes(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, INITIAL_GRID_SIZE, INITIAL_GRID_SIZE, 0);
    setNodes(newNodes);
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawing || !startPoint) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);
    const center = {
      x: startPoint.x + (currentX - startPoint.x) / 2,
      y: startPoint.y + (currentY - startPoint.y) / 2
    };
    
    const newObstacles = [...obstacles, { center, width, height }];
    setObstacles(newObstacles);
    setDrawing(false);
    setStartPoint(null);
  };

  const handleDownload = () => {
    const graphData: GraphData = {
      nodes,
      edges,
      obstacles,
      objectives
    };
    
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mesh-graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">Click and drag to draw obstacles. The mesh will automatically subdivide around them.</p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download JSON
        </button>
      </div>
      <svg
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDrawing(false)}
      >
        <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#f8f9fa" />
        
        {obstacles.map((obstacle, i) => (
          <rect
            key={`obstacle-${i}`}
            x={obstacle.center.x - obstacle.width/2}
            y={obstacle.center.y - obstacle.height/2}
            width={obstacle.width}
            height={obstacle.height}
            fill="#ff0000"
            stroke="#cc0000"
            opacity={0.5}
          />
        ))}
        
        {edges.map((edge, i) => (
          <line
            key={`edge-${i}`}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            stroke="#adb5bd"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}
        
        {nodes.map((node, i) => (
          <g key={`node-${i}`}>
            <rect
              x={node.x - node.width/2}
              y={node.y - node.height/2}
              width={node.width}
              height={node.height}
              fill="none"
              stroke={`rgba(173, 181, 189, ${0.2 + node.level * 0.2})`}
              strokeWidth="1"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={4 - node.level * 0.5}
              fill={node.containsObstacle ? "#dc3545" : "#228be6"}
            />
          </g>
        ))}

        {objectives.map((objective, i) => {
          const startNode = nodes.find(node => objective.start === node.id);
          const endNode = nodes.find(node => objective.end === node.id);
          return (
            <g key={`objective-${i}`}>
              {startNode && (
                <circle
                  cx={startNode.x}
                  cy={startNode.y} 
                  r={8}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="2"
                  strokeDasharray="4"
                />
              )}
              {endNode && (
                <circle
                  cx={endNode.x}
                  cy={endNode.y} 
                  r={8}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="2"
                  strokeDasharray="4"
                />
              )}
            </g>
          );
        })}
        
        {drawing && startPoint && (
          <rect
            x={startPoint.x}
            y={startPoint.y}
            width={0}
            height={0}
            fill="none"
            stroke="#adb5bd"
            strokeDasharray="4"
          />
        )}
      </svg>
    </div>
  );
};

export default EditableMeshGraph;