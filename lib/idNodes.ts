export const idNodes = (graph: GraphData) => {
  graph.nodes = graph.nodes.map((node, index) => ({
    ...node,
    id: index.toString()
  }));
  return graph
};