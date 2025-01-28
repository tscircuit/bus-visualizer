import React, { useState, useEffect } from 'react';

const MeshGraph = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const INITIAL_GRID_SIZE = 600;
  const MAX_LEVEL = 6;

  const doRectsOverlap = (rect1, rect2) => {
    const r1HalfWidth = rect1.width / 2;
    const r1HalfHeight = rect1.height / 2;
    const r2HalfWidth = rect2.width / 2;
    const r2HalfHeight = rect2.height / 2;
    
    return Math.abs(rect1.center.x - rect2.center.x) < (r1HalfWidth + r2HalfWidth) &&
           Math.abs(rect1.center.y - rect2.center.y) < (r1HalfHeight + r2HalfHeight);
  };
  
  const generateNodes = (x, y, width, height, level = 0) => {
    const nodeRect = { center: { x, y }, width, height };
    const hasObstacle = obstacles.some(obstacle => doRectsOverlap(nodeRect, obstacle));
    
    if (level === MAX_LEVEL && hasObstacle) {
      return [];
    }
    
    if (hasObstacle && level < MAX_LEVEL) {
      const newWidth = width / 2;
      const newHeight = height / 2;
      
      const childNodes = [
        generateNodes(x - newWidth/2, y - newHeight/2, newWidth, newHeight, level + 1),
        generateNodes(x + newWidth/2, y - newHeight/2, newWidth, newHeight, level + 1),
        generateNodes(x - newWidth/2, y + newHeight/2, newWidth, newHeight, level + 1),
        generateNodes(x + newWidth/2, y + newHeight/2, newWidth, newHeight, level + 1)
      ];
      
      const flattenedChildren = childNodes.flat();
      
      if (flattenedChildren.length === 0) {
        return [];
      }
      
      const node = {
        x,
        y,
        width,
        height,
        level,
        containsObstacle: hasObstacle
      };
      
      return flattenedChildren.filter((child: any) => !child.containsObstacle);
    }
    
    const node = {
      x,
      y,
      width,
      height,
      level,
      containsObstacle: hasObstacle
    };
    
    return hasObstacle ? [] : [node];
  };
  
  const areNodesBordering = (node1, node2) => {
    const n1Left = node1.x - node1.width/2;
    const n1Right = node1.x + node1.width/2;
    const n1Top = node1.y - node1.height/2;
    const n1Bottom = node1.y + node1.height/2;
    
    const n2Left = node2.x - node2.width/2;
    const n2Right = node2.x + node2.width/2;
    const n2Top = node2.y - node2.height/2;
    const n2Bottom = node2.y + node2.height/2;
    
    // Check if nodes share a vertical border
    const shareVerticalBorder = 
      (Math.abs(n1Right - n2Left) < 1 || Math.abs(n1Left - n2Right) < 1) &&
      !(n1Bottom < n2Top || n1Top > n2Bottom);
    
    // Check if nodes share a horizontal border
    const shareHorizontalBorder = 
      (Math.abs(n1Bottom - n2Top) < 1 || Math.abs(n1Top - n2Bottom) < 1) &&
      !(n1Right < n2Left || n1Left > n2Right);
    
    return shareVerticalBorder || shareHorizontalBorder;
  };
  
  const generateEdges = (nodes) => {
    const edges = [];
    const processed = new Set();

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Skip if either node contains an obstacle
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
  
  useEffect(() => {
    const initialNodes = generateNodes(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, INITIAL_GRID_SIZE, INITIAL_GRID_SIZE);
    setNodes(initialNodes);
    setEdges(generateEdges(initialNodes));
  }, [obstacles]);
  
  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing(true);
    setStartPoint({ x, y });
  };
  
  const handleMouseMove = (e) => {
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
    
    setNodes(prevNodes => {
      const tempObstacle = { center, width, height };
      const newNodes = generateNodes(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, INITIAL_GRID_SIZE, INITIAL_GRID_SIZE);
      return newNodes;
    });
  };
  
  const handleMouseUp = (e) => {
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
    
    setObstacles(prev => [...prev, { center, width, height }]);
    setDrawing(false);
    setStartPoint(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <p className="text-sm text-gray-600">Click and drag to draw obstacles. The mesh will automatically subdivide around them.</p>
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

export default MeshGraph;