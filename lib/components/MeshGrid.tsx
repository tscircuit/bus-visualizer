import React from 'react';
import { Download } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  center: Point;
  width: number;
  height: number;
}

interface Node {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  containsObstacle: boolean;
}

interface Edge {
  from: Node;
  to: Node;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  obstacles: Rectangle[];
  paths: number[][];
}

interface MeshGraphProps {
  graphData: GraphData;
  onDownload?: () => void;
}

// Color palette for paths
const PATH_COLORS = [
  '#e64980', '#cc5de8', '#845ef7',
  '#5c7cfa', '#339af0', '#22b8cf', '#20c997', '#f06595',
  '#51cf66', '#94d82d', '#fcc419', '#ff922b'
];

const MeshGraph = ({ graphData, onDownload }: MeshGraphProps) => {
  const { nodes = [], edges = [], obstacles = [], paths = [] } = graphData;
  
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PATH_OFFSET = 2; // Base offset for paths

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    
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

  // Generate a path SVG with offset
  const generatePathD = (pathIndexes: number[], pathIndex: number) => {
    if (pathIndexes.length < 2) return '';
    
    const points = pathIndexes.map(index => {
      const node = nodes[index];
      if (!node) return null;
      
      // Calculate offset based on path index
      const angle = (pathIndex * Math.PI * 2) / paths.length;
      const offsetX = Math.cos(angle) * PATH_OFFSET;
      const offsetY = Math.sin(angle) * PATH_OFFSET;
      
      return `${node.x + offsetX},${node.y + offsetY}`;
    });
    
    // Filter out any null points
    const validPoints = points.filter(point => point !== null);
    if (validPoints.length < 2) return '';
    
    return `M ${validPoints.join(' L ')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-4 space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download JSON
          </button>
          <p className="text-sm text-gray-600">
            {paths.length} paths loaded
          </p>
        </div>
      </div>
      
      <svg
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300"
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
        
        {paths.map((path, i) => (
          <path
            key={`path-${i}`}
            d={generatePathD(path, i)}
            fill="none"
            stroke={PATH_COLORS[i % PATH_COLORS.length]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
      </svg>
    </div>
  );
};

export default MeshGraph;