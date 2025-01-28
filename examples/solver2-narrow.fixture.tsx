import MeshGrid from '../lib/components/MeshGrid'
import { convertObjectiveSolutionsToPaths } from '../lib/convertObjectiveSolutionsToPaths'
import { getClosestNode } from '../lib/getClosestNode'
import type { GraphData, Problem } from '../lib/solver-types'
import { solveMultiObjective } from '../lib/solvers/solver2'
import solver2GraphRaw from './solver1-narrow-graph.json'

const solver2Graph = solver2GraphRaw as unknown as GraphData

const problem: Problem = {
  objectives: [
    {
      start: getClosestNode(solver2Graph, { x: 300, y: 0}),
      end: getClosestNode(solver2Graph, { x: 600, y: 800 })
    },
    {
      start: getClosestNode(solver2Graph, { x: 400, y: 0}),
      end: getClosestNode(solver2Graph, { x: 600, y: 800 })
    },
    {
      start: getClosestNode(solver2Graph, { x: 450, y: 0}),
      end: getClosestNode(solver2Graph, { x: 500, y: 800 })
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
