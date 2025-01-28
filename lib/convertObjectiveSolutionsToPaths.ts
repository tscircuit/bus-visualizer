import type {GraphData, ObjectiveSolution} from "./solver-types";

// Convert objective solutions to paths (array of node indexes)
export const convertObjectiveSolutionsToPaths = (graph: GraphData, objectiveSolutions: ObjectiveSolution[]):  number[][] => {
  return objectiveSolutions.map((solution) => solution.path.map((node) => graph.nodes.findIndex((n) => n.x === node.x && n.y === node.y)));
};
