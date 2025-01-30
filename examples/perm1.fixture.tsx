import EditableMeshGraph from "../lib/components/EditableMeshGrid"
import type {ObjectiveSolution, Node, GraphData} from "../lib/solver-types"
import initialGraphData from "./WED_SAMPLE1.json"


export const addPorts = (graphData: GraphData) => {
  const {nodes, edges, initialTargets, objectiveSolutions, objectives, obstacles} = graphData

  
  // watch node we need to add ports to
  for (const node of nodes) {
    const ports: Array<{ x: number, y: number, fromNodeId: string, objectiveId: string }> = []

    const myAdjacentNodes = edges.filter(e => e.from.id === node.id || e.to.id === node.id)

    const objectiveSolutionsPassingThroughMe = objectiveSolutions
      ?.filter(os => os.path.some(p => p.id === node.id)) ?? []

    const objectiveIdsPassingThroughMe = objectiveSolutionsPassingThroughMe?.map(os => os.objectiveId) ?? []

    // we need to compute the position of each port. For each objective passing
    // through this node, there will be a part at two adjacent nodes
    for (const { path, objectiveId } of objectiveSolutionsPassingThroughMe) {
      const adjacentNodesForObjective = myAdjacentNodes.filter(e => path.some(p => p.id === e.from.id || p.id === e.to.id))

    }



    // for (const adjNode of adjacentNodes) {
      
    // }
  }

  return graphData
}

export default () => {
  const graphDataWithPorts = addPorts(initialGraphData)
  return (
    <EditableMeshGraph initialGraphData={graphDataWithPorts} />
  )
}
