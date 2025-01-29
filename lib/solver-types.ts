import type {Obstacle} from "./types";

export interface Problem {
  objectives: Array<{ start: Node, end: Node, id: string }>
}

export interface ObjectiveSolution {
  path: Array<Node>
}

export interface Node {
  id: string
  x: number;
  y: number;
  width: number;
  height: number;
  /* capacity of the node, how many paths can go through it */
  rc: number

  containsObstacle?: boolean;
  containsTarget?: boolean;
}

export interface Edge {
  from: Node;
  to: Node;
  id: string
}

export interface BusEdge {
  fromCapacityNode: Node
  toCapacityNode: Node
  enteringTraceNameCwOrder: `trace${number}`[]
  exitingTraceNameCwOrder: `trace${number}`[]

  enterPoints?: Array<{ x: number, y: number, z: number, traceName: `trace${number}` }>,
  exitPoints?: Array<{ x: number, y: number, z: number, traceName: `trace${number}` }>,
}

export type NodeId = string;
export interface Objective {
  start: NodeId;
  end: NodeId;
  id: string
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  initialTargets?: Array<{start: { x:number,y: number }, end: { x:number,y: number } }>;
  objectives?: Array<Objective>
  obstacles?: Obstacle[];
}