import type {GraphData, Node, Problem, ObjectiveSolution} from "../solver-types";

type NodeMap = Map<string, Node>;
type NodeSet = Set<string>;

interface PQItem {
  node: Node;
  priority: number;
  path: Node[];
  cost: number;
}

class PriorityQueue {
  private items: PQItem[] = [];

  enqueue(item: PQItem): void {
    this.items.push(item);
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): PQItem | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// Helper function to get node key
function getNodeKey(node: Node): string {
  return `${node.x},${node.y}`;
}

// Helper function to calculate heuristic (Manhattan distance)
function heuristic(node: Node, goal: Node): number {
  return Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y);
}

// Helper function to find neighbors of a node
function getNeighbors(node: Node, graph: GraphData, capacityMap: Map<string, number>): Node[] {
  return graph.edges
    .filter(edge => edge.from.id === node.id || edge.to.id === node.id)
    .map(edge => edge.from.id === node.id ? edge.to : edge.from)
    .filter(neighbor => {
      const key = getNodeKey(neighbor);
      const remainingCapacity = capacityMap.get(key) ?? 0;
      return remainingCapacity > 0;
    });
}

const MAX_ITERATIONS = 100

// A* implementation for a single objective
function astar(
  start: Node,
  goal: Node,
  graph: GraphData,
  capacityMap: Map<string, number>
): Node[] | null {
  const frontier = new PriorityQueue();
  const cameFrom: Map<string, Node> = new Map();
  const costSoFar: Map<string, number> = new Map();
  
  frontier.enqueue({
    node: start,
    priority: 0,
    path: [start],
    cost: 0
  });
  
  costSoFar.set(getNodeKey(start), 0);

  let iterations = 0;
  while (!frontier.isEmpty()) {
    iterations++
    console.log("frontier.items", frontier.items);
    const current = frontier.dequeue()!;
    
    if (current.node === goal) {
      return current.path;
    }

    if (iterations > MAX_ITERATIONS) {
      return current.path
    }

    console.log("neighbors", getNeighbors(current.node, graph, capacityMap))

    for (const next of getNeighbors(current.node, graph, capacityMap)) {
      const newCost = costSoFar.get(getNodeKey(current.node))! + 1;

      if (!costSoFar.has(next.id) || newCost < costSoFar.get(next.id)!) {
        costSoFar.set(next.id, newCost);
        const priority = newCost + heuristic(next, goal);
        frontier.enqueue({
          node: next,
          priority,
          path: [...current.path, next],
          cost: newCost
        });
        cameFrom.set(next.id, current.node);
      }
    }
  }

  console.log("no path found");
  return null; // No path found
}

// Function to update capacity after finding a path
function updateCapacity(path: Node[], capacityMap: Map<string, number>): void {
  path.forEach(node => {
    const key = getNodeKey(node);
    const currentCapacity = capacityMap.get(key)!;
    capacityMap.set(key, currentCapacity - 1);
  });
}

// Main function to solve all objectives
function solveMultiObjective(problem: Problem, graph: GraphData): ObjectiveSolution[] {
  // Initialize capacity map
  const capacityMap = new Map<string, number>();
  graph.nodes.forEach(node => {
    capacityMap.set(getNodeKey(node), node.rc);
  });

  const solutions: ObjectiveSolution[] = [];

  // Try to solve each objective
  for (const objective of problem.objectives) {
    const path = astar(objective.start, objective.end, graph, capacityMap);
    
    if (path) {
      solutions.push({ path });
      updateCapacity(path, capacityMap);
    } else {
      solutions.push({ path: [] }); // Push empty path if no solution found
    }
  }

  return solutions;
}


export { solveMultiObjective, type ObjectiveSolution, type Problem, type GraphData };