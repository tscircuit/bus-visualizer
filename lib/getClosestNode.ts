import type { GraphData, Node } from "./solver-types";

interface Point {
  x: number;
  y: number;
}

export function getClosestNode(graphData: GraphData, point: Point): Node {
  let closestNode = graphData.nodes[0];
  let minDistance = Number.POSITIVE_INFINITY;

  for (const node of graphData.nodes) {
    // Calculate Euclidean distance from point to node center
    const distance = Math.sqrt(
      Math.pow(node.x - point.x, 2) + 
      Math.pow(node.y - point.y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestNode = node;
    }
  }

  return closestNode;
}
