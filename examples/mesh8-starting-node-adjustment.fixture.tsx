import { EditableMeshGraph, type GenerateEdgesParams, type GenerateNodesParams, MAX_LEVEL } from "../lib/components/EditableMeshGrid";
import type {GraphData, Node, Edge} from "../lib/solver-types";
import type {Obstacle} from "../lib/types";

const generateNodes = (graphData: GraphData, { x, y, width, height, level = 0 }: GenerateNodesParams): Node[] => {
  const nodeRect = { center: { x, y }, width, height };
  const hasObstacle = graphData.obstacles.some(obstacle => doRectsOverlap(nodeRect, obstacle));
  
  if (level === MAX_LEVEL && hasObstacle) {
    return [];
  }
  
  if (hasObstacle && level < MAX_LEVEL) {
    const newWidth = width / 2;
    const newHeight = height / 2;
    
    const childNodes = [
      generateNodes(graphData, { x: x - newWidth/2, y: y - newHeight/2, width: newWidth, height: newHeight, level: level + 1 }),
      generateNodes(graphData, { x: x + newWidth/2, y: y - newHeight/2, width: newWidth, height: newHeight, level: level + 1 }),
      generateNodes(graphData, { x: x - newWidth/2, y: y + newHeight/2, width: newWidth, height: newHeight, level: level + 1 }),
      generateNodes(graphData, { x: x + newWidth/2, y: y + newHeight/2, width: newWidth, height: newHeight, level: level + 1 })
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

const generateEdges = (graphData: GraphData, { nodes }: GenerateEdgesParams): Edge[] => {
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


export default () => {
  return (
    <EditableMeshGraph generateNodes={generateNodes} generateEdges={generateEdges} />
  )
}