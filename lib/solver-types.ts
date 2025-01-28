import type {Obstacle} from "./types";

export interface Problem {
  objectives: Array<{ start: Node, end: Node }>
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
}

export interface Edge {
  from: Node;
  to: Node;
}

export type NodeId = string;
export interface Objective {
  start: NodeId;
  end: NodeId;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  objectives?: Array<Objective>
  obstacles?: Obstacle[];
}