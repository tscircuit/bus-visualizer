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

  const getDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };
  
  const isPointInRect = (px, py, rect) => {
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    return px >= rect.center.x - halfWidth &&
           px <= rect.center.x + halfWidth &&
           py >= rect.center.y - halfHeight &&
           py <= rect.center.y + halfHeight;
  };
  
  const doRectsOverlap = (rect1, rect2) => {
    const r1HalfWidth = rect1.width / 2;
    const r1HalfHeight = rect1.height / 2;
    const r2HalfWidth = rect2.width / 2;
    const r2HalfHeight = rect2.height / 2;
    
    return Math.abs(rect1.center.x - rect2.center.x) < (r1HalfWidth + r2HalfWidth) &&
           Math.abs(rect1.center.y - rect2.center.y) < (r1HalfHeight + r2HalfHeight);
  };
  
  // Modified generateNodes function to handle fully covered nodes
  const generateNodes = (x, y, width, height, level = 0) => {
    const nodeRect = { center: { x, y }, width, height };
    const hasObstacle = obstacles.some(obstacle => doRectsOverlap(nodeRect, obstacle));
    
    // If we're at max level and there's an obstacle, return empty array (node is removed)
    if (level === MAX_LEVEL && hasObstacle) {
      return [];
    }
    
    // If there's an obstacle and we're not at max level, subdivide
    if (hasObstacle && level < MAX_LEVEL) {
      const newWidth = width / 2;
      const newHeight = height / 2;
      
      // Generate all child nodes
      const childNodes = [
        generateNodes(x - newWidth/2, y - newHeight/2, newWidth, newHeight, level + 1),
        generateNodes(x + newWidth/2, y - newHeight/2, newWidth, newHeight, level + 1),
        generateNodes(x - newWidth/2, y + newHeight/2, newWidth, newHeight, level + 1),
        generateNodes(x + newWidth/2, y + newHeight/2, newWidth, newHeight, level + 1)
      ];
      
      // Flatten child nodes
      const flattenedChildren = childNodes.flat();
      
      // If all children were removed (fully covered by obstacles), return empty array
      if (flattenedChildren.length === 0) {
        return [];
      }
      
      // Create parent node
      const node = {
        x,
        y,
        width,
        height,
        level,
        containsObstacle: hasObstacle
      };
      
      return [node, ...flattenedChildren];
    }
    
    // If no obstacle or at max level without obstacle, return single node
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
  
  const generateEdges = (nodes) => {
    const edges = [];
    const processed = new Set();

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Skip if either node contains an obstacle
        if (node1.containsObstacle || node2.containsObstacle) continue;

        const distance = getDistance(node1.x, node1.y, node2.x, node2.y);
        const maxDistance = Math.max(node1.width, node2.width) * 1.5;
        
        if (distance <= maxDistance) {
          if (node1.level === node2.level) {
            if ((Math.abs(node1.x - node2.x) <= node1.width && Math.abs(node1.y - node2.y) === 0) ||
                (Math.abs(node1.y - node2.y) <= node1.height && Math.abs(node1.x - node2.x) === 0) ||
                (Math.abs(node1.x - node2.x) <= node1.width && 
                 Math.abs(node1.y - node2.y) <= node1.height)) {
              edges.push({ from: node1, to: node2 });
            }
          } else {
            const largerNode = node1.level < node2.level ? node1 : node2;
            const smallerNode = node1.level < node2.level ? node2 : node1;
            
            const connectionKey = `${largerNode.x},${largerNode.y}-${smallerNode.x},${smallerNode.y}`;
            if (!processed.has(connectionKey)) {
              const dx = Math.abs(largerNode.x - smallerNode.x);
              const dy = Math.abs(largerNode.y - smallerNode.y);
              
              if (dx <= largerNode.width && dy <= largerNode.height) {
                edges.push({ from: largerNode, to: smallerNode });
                processed.add(connectionKey);
              }
            }
          }
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