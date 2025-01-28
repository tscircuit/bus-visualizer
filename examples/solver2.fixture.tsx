import MeshGrid from '../lib/components/MeshGrid'
import { convertObjectiveSolutionsToPaths } from '../lib/convertObjectiveSolutionsToPaths'
import { getClosestNode } from '../lib/getClosestNode'
import type { GraphData, Problem } from '../lib/solver-types'
import { solveMultiObjective } from '../lib/solvers/solver2'
import solver2GraphRaw from './solver2-graph.json'
import { idNodes } from '../lib/idNodes'

const solver2Graph = idNodes(solver2GraphRaw as unknown as GraphData)

const problem: Problem = {
  objectives: [
    {
      start: getClosestNode(solver2Graph, { x: 0, y: 200 }),
      end: getClosestNode(solver2Graph, { x: 600, y: 200 }),
    },
  ],
}
const solutions = solveMultiObjective(problem, solver2Graph)

export default () => {
  return (
    <MeshGrid
      graphData={
        {
          ...solver2Graph,
          objectives: problem.objectives.map((o) => ({
            start: o.start.id,
            end: o.end.id,
          })),
          paths: solutions,
        } as any
      }
    />
  )
}
