import React, { useState } from 'react';
import { Download, Upload } from "lucide-react";
import exampleJson from "./mesh7-example.json";

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

// Color palette for paths
const PATH_COLORS = [
  '#e64980', '#cc5de8', '#845ef7',
  '#5c7cfa', '#339af0', '#22b8cf', '#20c997', '#f06595',
  '#51cf66', '#94d82d', '#fcc419', '#ff922b'
];

const MeshGraph = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [obstacles, setObstacles] = useState<Rectangle[]>([]);
  const [paths, setPaths] = useState<number[][]>([]);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PATH_OFFSET = 2; // Base offset for paths

  const handleDownload = () => {
    const graphData: GraphData = {
      nodes,
      edges,
      obstacles,
      paths
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

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: GraphData = JSON.parse(e.target?.result as string);
        setNodes(data.nodes);
        setEdges(data.edges);
        setObstacles(data.obstacles);
        setPaths(data.paths || []);
        setError('');
        setJsonInput('');
      } catch (error) {
        setError('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    setError('');
  };

  const handleJsonSubmit = () => {
    try {
      const data: GraphData = JSON.parse(jsonInput);
      setNodes(data.nodes);
      setEdges(data.edges);
      setObstacles(data.obstacles);
      setPaths(data.paths || []);
      setError('');
    } catch (error) {
      setError('Invalid JSON format');
    }
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
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleUpload}
                className="hidden"
              />
              <Upload className="h-4 w-4" />
              Upload JSON
            </label>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download JSON
            </button>
            <button
              onClick={() => setJsonInput(JSON.stringify(exampleJson, null, 2))}
              className="flex items-center gap-2"
            >
              Example JSON
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {paths.length} paths loaded
          </p>
        </div>

        <div className="space-y-2">
          <textarea
            value={jsonInput}
            onChange={handleJsonInputChange}
            placeholder="Paste your JSON here..."
            className="w-full h-32 p-2 border border-gray-300 rounded font-mono text-sm"
          />
          <div className="flex justify-between items-center">
            <button
              onClick={handleJsonSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Load JSON
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
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