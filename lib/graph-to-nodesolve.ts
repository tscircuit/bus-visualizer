interface NodeSolveInput {
  center: { x: number, y: number }
  width: number
  height: number
  segmentsToConnect: Array<{
    segment1: { start: { x: number, y: number }, end: { x: number, y: number } }
    segment2: { start: { x: number, y: number }, end: { x: number, y: number } }
    traceId: string
  }>,
}

interface NodeSolveOutput extends NodeSolveInput {
  ports: Array<{ x: number, y: number, traceId: string }>
}

/**
Please draw a visualization for this input output data structure with input on the left and output on the right

The idea is that we have an input that solves a problem where we need to select points along each segment to connect to each other, while minimizing the number of intersections from different segments

The input is a square, and all segments are along the border of the square. Sometimes segments are overlapping on the board of the square.

```
interface NodeSolveInput {
  center: { x: number, y: number }
  width: number
  height: number
  segmentsToConnect: Array<{
    segment1: { start: { x: number, y: number }, end: { x: number, y: number } }
    segment2: { start: { x: number, y: number }, end: { x: number, y: number } }
    traceId: string
  }>,
}

interface NodeSolveOutput extends NodeSolveInput {
  ports: Array<{ x: number, y: number, traceId: string }>
}
```

Here is some example data:

```
const input = {
  center: {x:0,y:0},
  width: 10,
  height: 10,
  segmentsToConnect: [{
    segment1: { start: { x: -5, y: -5 }, end: { x: -5, y: 0 } },
    segment2: { start: { x: 5, y: 0 }, end: { x: 5, y: 5} },
    traceId: "trace1"
  }, {
    segment1: { start: { x: -5, y: -5}, end{ x: -5, y: 0} },
    segment2: { start: { x: 5, y: -5}, end: { x: 5, y: 0} },
    traceId: "trace2"
  }
]
}
```
 */