import React, { useState, useEffect } from 'react';
import { Download } from "lucide-react";
import type { Objective, GraphData, Node, Edge } from '../solver-types';
import type { Obstacle } from '../types';

type Point = { x: number, y: number };

export interface GenerateNodesParams {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

export interface GenerateEdgesParams {
  nodes: Node[];
}

interface EditableMeshGraphProps {
  initialGraphData?: GraphData;
  generateNodes?: (graphData: GraphData, params: GenerateNodesParams) => Node[];
  generateEdges?: (graphData: GraphData, params: GenerateEdgesParams) => Edge[];
  onGraphChange?: (graphData: GraphData) => void;
}

// Color palette for paths and objectives
const COLORS = [
  '#e64980', '#cc5de8', '#845ef7',
  '#5c7cfa', '#339af0', '#22b8cf', '#20c997', '#f06595',
  '#51cf66', '#94d82d', '#fcc419', '#ff922b'
];

export const MAX_LEVEL = 6;

const defaultGenerateNodes = (graphData: GraphData, { x, y, width, height, level = 0 }: GenerateNodesParams): Node[] => {
  const nodeRect = { center: { x, y }, width, height };
  const hasObstacle = graphData.obstacles.some(obstacle => doRectsOverlap(nodeRect, obstacle));
  
  if (level === MAX_LEVEL && hasObstacle) {
    return [];
  }
  
  if (hasObstacle && level < MAX_LEVEL) {
    const newWidth = width / 2;
    const newHeight = height / 2;
    
    const childNodes = [
      defaultGenerateNodes(graphData, { x: x - newWidth/2, y: y - newHeight/2, width: newWidth, height: newHeight, level: level + 1 }),
      defaultGenerateNodes(graphData, { x: x + newWidth/2, y: y - newHeight/2, width: newWidth, height: newHeight, level: level + 1 }),
      defaultGenerateNodes(graphData, { x: x - newWidth/2, y: y + newHeight/2, width: newWidth, height: newHeight, level: level + 1 }),
      defaultGenerateNodes(graphData, { x: x + newWidth/2, y: y + newHeight/2, width: newWidth, height: newHeight, level: level + 1 })
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

const defaultGenerateEdges = (graphData: GraphData, { nodes }: GenerateEdgesParams): Edge[] => {
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

export const EditableMeshGraph = ({ 
  initialGraphData = { nodes: [], edges: [], obstacles: [], objectives: [], initialTargets: [] },
  generateNodes: customGenerateNodes,
  generateEdges: customGenerateEdges,
  onGraphChange
}: EditableMeshGraphProps) => {
  const [nodes, setNodes] = useState<Node[]>(initialGraphData.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialGraphData.edges);
  const [obstacles, setObstacles] = useState<Obstacle[]>(initialGraphData.obstacles ?? []);
  const [objectives] = useState<Objective[]>(initialGraphData.objectives || []);
  const [initialTargets, setInitialTargets] = useState<{start: { x:number,y: number }, end: { x:number,y: number }, name: string }[]>(initialGraphData.initialTargets || []);
  const [mode, setMode] = useState<'draw' | 'target'>('draw');
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [targetStart, setTargetStart] = useState<Point | null>(null);
  
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const INITIAL_GRID_SIZE = 600;

  const generateGraph = () => {
    const genNodes = customGenerateNodes || defaultGenerateNodes;
    const genEdges = customGenerateEdges || defaultGenerateEdges;

    const graphData = { nodes, edges, obstacles, objectives, initialTargets: initialTargets };
    const newNodes = genNodes(graphData, {
      x: CANVAS_WIDTH/2,
      y: CANVAS_HEIGHT/2,
      width: INITIAL_GRID_SIZE,
      height: INITIAL_GRID_SIZE,
      level: 0
    });
    const newEdges = genEdges(graphData, { nodes: newNodes }).map((e, i) => ({ ...e, id: `edge${i}` }));

    setNodes(newNodes);
    setEdges(newEdges);

    // Set objectives for nodes near initial targets
    if (initialTargets && initialTargets.length > 0) {
      const newObjectives: Objective[] = [];
      
      for (const target of initialTargets) {
        // Find nodes within INITIAL_GRID_SIZE distance of target
        const nearbyNodeStart = newNodes.find(node => {
          const dx = node.x - target.start.x;
          const dy = node.y - target.start.y;
          return Math.sqrt(dx*dx + dy*dy) < INITIAL_GRID_SIZE / (2**(MAX_LEVEL));
        });

        const nearbyNodeEnd = newNodes.find(node => {
          const dx = node.x - target.end.x;
          const dy = node.y - target.end.y;
          return Math.sqrt(dx*dx + dy*dy) < INITIAL_GRID_SIZE / (2**(MAX_LEVEL));
        });

        if (!nearbyNodeStart || !nearbyNodeEnd) continue;

        // Create objectives between all pairs of nearby nodes
        newObjectives.push({
          start: nearbyNodeStart.id,
          end: nearbyNodeEnd.id
        });
      }

      // Update objectives state
      objectives.splice(0, objectives.length, ...newObjectives);
    }

    if (onGraphChange) {
      onGraphChange({
        nodes: newNodes,
        edges: newEdges,
        obstacles,
        objectives: objectives.map((o, i) => ({ ...o, id: `objective${i}` }))
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
    
    if (mode === 'draw') {
      setDrawing(true);
      setStartPoint({ x, y });
    } else if (mode === 'target') {
      if (!targetStart) {
        setTargetStart({ x, y });
      } else {
        // Create new target with start and end points
        const newTarget = {
          start: targetStart,
          end: { x, y },
          name: `Target ${initialTargets.length + 1}`
        };
        setInitialTargets([...initialTargets, newTarget]);
        setTargetStart(null);
        generateGraph();
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode === 'target' || !drawing || !startPoint) return;
    
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
    const graphData = { nodes, edges, obstacles, objectives };
    const newNodes = genNodes(graphData, {
      x: CANVAS_WIDTH/2,
      y: CANVAS_HEIGHT/2,
      width: INITIAL_GRID_SIZE,
      height: INITIAL_GRID_SIZE,
      level: 0
    });
    setNodes(newNodes);
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (mode === 'target' || !drawing || !startPoint) return;
    
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

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const handleDownload = () => {
    const graphData: GraphData = {
      nodes,
      edges,
      obstacles,
      objectives: objectives.map((o, i) => ({ ...o, id: ALPHABET[i] ?? `objective${i}` })),
      initialTargets
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
        <div className="flex gap-4 items-center">
          <p className="text-sm text-gray-600">
            {mode === 'draw' 
              ? "Click and drag to draw obstacles. The mesh will automatically subdivide around them."
              : "Click to set start and end points for a target path."}
          </p>
          <button
            onClick={() => {
              setMode(mode === 'draw' ? 'target' : 'draw');
              setStartPoint(null);
              setTargetStart(null);
              setDrawing(false);
            }}
            className={`px-3 py-1 rounded ${
              mode === 'draw' 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {mode === 'draw' ? 'Switch to Target Mode' : 'Switch to Draw Mode'}
          </button>
        </div>
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
              opacity={0.2}
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
        
        {mode === 'draw' && drawing && startPoint && (
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

        {/* Show current target start point if in target mode */}
        {mode === 'target' && targetStart && (
          <g>
            <circle
              cx={targetStart.x}
              cy={targetStart.y}
              r={6}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
            />
            <line
              x1={targetStart.x - 6}
              y1={targetStart.y}
              x2={targetStart.x + 6}
              y2={targetStart.y}
              stroke="#22c55e"
              strokeWidth="2"
            />
            <line
              x1={targetStart.x}
              y1={targetStart.y - 6}
              x2={targetStart.x}
              y2={targetStart.y + 6}
              stroke="#22c55e"
              strokeWidth="2"
            />
          </g>
        )}

        {initialTargets?.map((target, i) => (
          <g key={`initial-target-${i}`}>
            {/* Start point X */}
            <line 
              x1={target.start.x - 4}
              y1={target.start.y - 4}
              x2={target.start.x + 4} 
              y2={target.start.y + 4}
              stroke="#dc3545"
              strokeWidth="2"
            />
            <line
              x1={target.start.x - 4}
              y1={target.start.y + 4}
              x2={target.start.x + 4}
              y2={target.start.y - 4}
              stroke="#dc3545" 
              strokeWidth="2"
            />
            
            {/* End point X */}
            <line
              x1={target.end.x - 4}
              y1={target.end.y - 4}
              x2={target.end.x + 4}
              y2={target.end.y + 4}
              stroke="#dc3545"
              strokeWidth="2"
            />
            <line
              x1={target.end.x - 4}
              y1={target.end.y + 4}
              x2={target.end.x + 4}
              y2={target.end.y - 4}
              stroke="#dc3545"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default EditableMeshGraph;
