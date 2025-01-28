import type {GraphData, Node, Problem, ObjectiveSolution} from "../solver-types";

// Helper function to calculate heuristic (Manhattan distance)
function heuristic(node: Node, goal: Node): number {
  return Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y)
}

// Helper function to check if two nodes are the same based on x and y coordinates
function isSameNode(a: Node, b: Node): boolean {
  return a.x === b.x && a.y === b.y
}

// Helper function to find neighbors of a node
function getNeighbors(node: Node, graph: GraphData): Node[] {
  console.log(`Finding neighbors for node at (${node.x}, ${node.y})`)

  return graph.edges
    .filter((edge) => {
      // Check if the edge contains our node as either from or to
      const isFromCurrent = isSameNode(edge.from, node)
      const isToCurrent = isSameNode(edge.to, node)

      // Get the neighbor node
      const neighborNode = isFromCurrent
        ? edge.to
        : isToCurrent
        ? edge.from
        : null

      // Only include edges where:
      // 1. The edge connects to our current node
      // 2. The neighbor node has rc >= 1
      return (
        (isFromCurrent || isToCurrent) && neighborNode && neighborNode.rc >= 1
      )
    })
    .map((edge) => (isSameNode(edge.from, node) ? edge.to : edge.from))
}

// Helper function to get node index from graph.nodes array
function getNodeIndex(node: Node, graph: GraphData): number {
  return graph.nodes.findIndex((n) => isSameNode(n, node))
}

// Helper function to reconstruct path from came_from map
function reconstructPath(
  cameFrom: Map<string, Node>,
  current: Node,
  graph: GraphData
): number[] {
  const path: number[] = []
  let currentNode = current

  while (currentNode) {
    // Add current node's index to the path
    path.unshift(getNodeIndex(currentNode, graph))

    // Decrement rc value of the node we're using
    const nodeInGraph = graph.nodes[path[0]]
    nodeInGraph.rc--
    console.log(
      `Decremented rc for node at (${nodeInGraph.x}, ${nodeInGraph.y}) to ${nodeInGraph.rc}`
    )

    // Get the next node in the path
    const nodeKey = `${currentNode.x},${currentNode.y}`
    currentNode = cameFrom.get(nodeKey)
  }

  return path
}

export function findPath(
  start: Node,
  end: Node,
  graph: GraphData
): number[] | null {
  console.log(
    `Starting pathfinding from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`
  )

  // Initialize the open and closed sets
  const openSet: Node[] = [start]
  const closedSet: Set<string> = new Set()

  // For node-to-node scoring
  const gScore: Map<string, number> = new Map()
  const fScore: Map<string, number> = new Map()

  // For reconstructing the path
  const cameFrom: Map<string, Node> = new Map()

  // Set initial scores for start node
  gScore.set(`${start.x},${start.y}`, 0)
  fScore.set(`${start.x},${start.y}`, heuristic(start, end))

  while (openSet.length > 0) {
    // Find node in openSet with lowest fScore
    let current = openSet.reduce((lowest, node) => {
      const nodeKey = `${node.x},${node.y}`
      return fScore.get(nodeKey) < fScore.get(`${lowest.x},${lowest.y}`)
        ? node
        : lowest
    }, openSet[0])

    console.log(`Current node: (${current.x}, ${current.y})`)

    // If we've reached the end, reconstruct and return the path
    if (isSameNode(current, end)) {
      console.log('Found path to end node!')
      return reconstructPath(cameFrom, current, graph)
    }

    // Move current node from open to closed set
    openSet.splice(openSet.indexOf(current), 1)
    closedSet.add(`${current.x},${current.y}`)

    // Check all neighbors
    const neighbors = getNeighbors(current, graph)
    console.log(`Found ${neighbors.length} valid neighbors`)

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`

      // Skip if neighbor is in closed set
      if (closedSet.has(neighborKey)) continue

      // Calculate tentative gScore
      const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1

      // If neighbor is not in openSet, add it
      if (!openSet.some((node) => isSameNode(node, neighbor))) {
        openSet.push(neighbor)
      }
      // Skip if this path to neighbor is not better than previous one
      else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
        continue
      }

      // This path is the best until now, record it
      cameFrom.set(neighborKey, current)
      gScore.set(neighborKey, tentativeGScore)
      fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, end))
    }
  }

  console.log('No path found!')
  return null // No path found
}


/**
 * Calculates the Euclidean distance between two points
 * @param point1 First point
 * @param point2 Second point
 * @returns The Euclidean distance between the points
 */
function calculateDistance(point1: Node, point2: Node): number {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Sorts a list of edges by their Euclidean distance (shortest to longest)
 * @param edges Array of edges between points
 * @returns New array of edges sorted by distance
 */
export function sortEdgesByDistance(edges: { start: Node, end: Node }[]): { start: Node, end: Node }[] {
  return [...edges].sort((a, b) => {
    const distanceA = calculateDistance(a.start, a.end)
    const distanceB = calculateDistance(b.start, b.end)
    return distanceA - distanceB
  })
}



  // const graph: Graph = meshGraph
  // // graph.nodes[1]
  // // const startNode: Node = graph.nodes[1]
  // // const endNode: Node = graph.nodes[10]
  // graph.paths = []
  // console.log(graph.nodes.length)
  // let pointsToConnect = [
  //   { from: graph.nodes[1], to: graph.nodes[91] },
  //   { from: graph.nodes[59], to: graph.nodes[30] },
  //   { from: graph.nodes[49], to: graph.nodes[55] },
  //   { from: graph.nodes[15], to: graph.nodes[72] },
  // ]
  // pointsToConnect = sortEdgesByDistance(pointsToConnect)

  // for (const { from, to } of pointsToConnect) {
  //   const startNode: Node = from
  //   const endNode: Node = to
  //   const path = findPath(startNode, endNode, graph)

  //   if (path !== null) {
  //     console.log('Path found:', path)
  //     graph.paths.push(path)
  //   } else {
  //     console.log('No path found')
  //   }
  // }


  // Main function to solve all objectives
function solveMultiObjective(problem: Problem, graph: GraphData): number[][] {
  // Initialize capacity map

  let pointsToConnect = problem.objectives
  problem.objectives = sortEdgesByDistance(pointsToConnect)
  const solutions: number[][] = [];

  for (const { start, end } of pointsToConnect) {
    const startNode: Node = start
    const endNode: Node = end
    const path = findPath(startNode, endNode, graph)

    if (path !== null) {
      console.log('Path found:', path)
      solutions.push(path); // Push empty path if no solution found
    } else {
      console.log('No path found')
    }
  }
  return solutions
}

export { solveMultiObjective, type ObjectiveSolution, type Problem, type GraphData };