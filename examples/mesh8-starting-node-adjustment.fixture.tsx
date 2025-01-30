import { EditableMeshGraph, type GenerateEdgesParams, type GenerateNodesParams, MAX_LEVEL } from "../lib/components/EditableMeshGrid";
import {getClosestNode} from "../lib/getClosestNode";
import type {GraphData, Node, Edge} from "../lib/solver-types";
import {solveMultiObjective} from "../lib/solvers/solver1";
import type {Obstacle} from "../lib/types";

const generateNodes = (graphData: GraphData, { x, y, width, height, level = 0 }: GenerateNodesParams): Node[] => {
  const nodeRect = { center: { x, y }, width, height };
  const hasObstacle = graphData.obstacles?.some(obstacle => doRectsOverlap(nodeRect, obstacle)) ?? false;
  const hasTarget = graphData.initialTargets?.some(target => isPointInRect(target.start, nodeRect) || isPointInRect(target.end, nodeRect)) ?? false;

  // If we're at max level and have an obstacle (but no target), exclude the node
  if (level === MAX_LEVEL && hasObstacle && !hasTarget) {
    return [];
  }
  
  // If we have an obstacle or target and aren't at max level, subdivide
  if ((hasObstacle || hasTarget) && level < MAX_LEVEL) {
    const newWidth = width / 2;
    const newHeight = height / 2;
    
    const childNodes = [
      generateNodes(graphData, { x: x - newWidth/2, y: y - newHeight/2, width: newWidth, height: newHeight, level: level + 1 }),
      generateNodes(graphData, { x: x + newWidth/2, y: y - newHeight/2, width: newWidth, height: newHeight, level: level + 1 }),
      generateNodes(graphData, { x: x - newWidth/2, y: y + newHeight/2, width: newWidth, height: newHeight, level: level + 1 }),
      generateNodes(graphData, { x: x + newWidth/2, y: y + newHeight/2, width: newWidth, height: newHeight, level: level + 1 })
    ];
    
    // Filter out nodes that contain obstacles (unless they contain targets)
    return childNodes.flat().filter(child => !child.containsObstacle || child.containsTarget);
  }
  
  const node: Node = {
    id: `${x}-${y}-${level}`,
    x,
    y,
    width,
    height,
    level,
    rc: (MAX_LEVEL - level + 1)**2,
    containsObstacle: hasObstacle,
    containsTarget: hasTarget
  };
  
  // Include node if it either doesn't have an obstacle or if it has a target
  return (hasObstacle && !hasTarget) ? [] : [node];
};

const isPointInRect = (point: { x: number, y: number }, rect: Obstacle): boolean => {
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  
  return Math.abs(point.x - rect.center.x) <= halfWidth && 
         Math.abs(point.y - rect.center.y) <= halfHeight;
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
      
      // Allow edges to/from nodes with targets, even if they contain obstacles
      if ((node1.containsObstacle && !node1.containsTarget) || 
          (node2.containsObstacle && !node2.containsTarget)) continue;
      
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

  // Minimum overlap required (e.g., 1 pixel or appropriate unit)
  const minOverlap = 1;
  
  // For vertical borders, check horizontal distance and require minimum vertical overlap
  const shareVerticalBorder = 
    (Math.abs(n1Right - n2Left) < 1 || Math.abs(n1Left - n2Right) < 1) &&
    Math.min(n1Bottom, n2Bottom) - Math.max(n1Top, n2Top) >= minOverlap;
  
  // For horizontal borders, check vertical distance and require minimum horizontal overlap
  const shareHorizontalBorder = 
    (Math.abs(n1Bottom - n2Top) < 1 || Math.abs(n1Top - n2Bottom) < 1) &&
    Math.min(n1Right, n2Right) - Math.max(n1Left, n2Left) >= minOverlap;
  
  return shareVerticalBorder || shareHorizontalBorder;
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default () => {
  const initialTargets = [{start: { x: 150, y: 50 }, end: { x: 450, y: 450 }}];
  return (
    <EditableMeshGraph initialGraphData={{
      initialTargets,
      obstacles: [],
      nodes: [],
      edges: []
    }} generateNodes={generateNodes} generateEdges={generateEdges}
      solveCapacity={(graphData) => {
        const { objectiveSolutions, attemptedPaths } = solveMultiObjective({
           objectives: graphData.initialTargets?.map((t, i) => ({
            start: getClosestNode(graphData, t.start),
            end: getClosestNode(graphData, t.end),
            id: ALPHABET[i] ?? `objective${i}`
           })) ?? []
        }, graphData);
        
        return {
          ...graphData,
          objectiveSolutions
        }
      }}
    
    />
  )
}