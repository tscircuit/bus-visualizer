import { NodeSolveViz, type NodeSolveOutput } from "../lib/components/NodeSegmentSolveViz"

const input = {
  center: {x: 0, y: 0},
  width: 10,
  height: 10,
  segmentsToConnect: [{
    segment1: { start: { x: -5, y: -5 }, end: { x: -5, y: 0 } },
    segment2: { start: { x: 5, y: 0 }, end: { x: 5, y: 5} },
    traceId: "trace1"
  }, {
    segment1: { start: { x: -5, y: -5}, end: { x: -5, y: 0} },
    segment2: { start: { x: 5, y: -5}, end: { x: 5, y: 0} },
    traceId: "trace2"
  }]
};

const output:NodeSolveOutput  = {
  ...input,
  ports: [
    {
      traceId: "trace1",
      x: -5,
      y: -5/3
    },
    {
      traceId: "trace1",
      x: 5,
      y: 5/3 * 2
    },
    {
      traceId: "trace2",
      x: -5,
      y: -5/3 * 2
    },
    {
      traceId: "trace2",
      x: 5,
      y: -5/3 * 2
    }
  ]
}

export default () => {
  return <NodeSolveViz input={input} output={output} />
}