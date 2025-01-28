import MeshGrid from "../lib/components/MeshGrid";
import {convertObjectiveSolutionsToPaths} from "../lib/convertObjectiveSolutionsToPaths";
import {getClosestNode} from "../lib/getClosestNode";
import type {GraphData, Problem} from "../lib/solver-types";
import {solveMultiObjective} from "../lib/solvers/solver1";
import solver1GraphRaw from "./solver1-graph.json";
import {idNodes} from "../lib/idNodes";

const solver1Graph = idNodes(solver1GraphRaw as unknown as GraphData)

const problem: Problem = {
  objectives: [
    {
      start: getClosestNode(solver1Graph, { x: 0, y: 200}),
      end: getClosestNode(solver1Graph, { x: 800, y: 200 })
    }
  ]
};

const objectiveSolutions = solveMultiObjective(problem, solver1Graph);

export default () => {
  return <MeshGrid graphData={
    {
      ...solver1Graph,
      paths: convertObjectiveSolutionsToPaths(solver1Graph, objectiveSolutions)
    } as any
  } />;
};
