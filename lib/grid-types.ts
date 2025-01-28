import type {Obstacle} from "./types"

export interface GridCell {
  depth: number
  row: number
  col: number
  center: { x: number, y: number }
  width: number
  height: number
}

export interface GridCellWithTraces extends GridCell {
  traceNamesInCell: string[]
}

export interface GridProblem {
  depth: number
  totalGridCells: number
  rows: number
  cols: number
  /** Grid cell size in mm */
  gridCellSize: number
  obstaclesInGrid: Obstacle[]
  cells: GridCell[]
}

export interface ABGridPathSolution {
  path: GridCellWithTraces[]
}

export interface SolvedGridProblem extends GridProblem {
  cells: GridCellWithTraces[]
}

export type CheckStraightLinePathFn = (params: {
  grid: GridProblem,
  cellA: { row: number, col: number },
  cellB: { row: number, col: number },
}) => boolean

export type SolveABGridPathFn = (params: {
  grid: GridProblem,
  cellA: { row: number, col: number },
  cellB: { row: number, col: number },
}) => ABGridPathSolution

export type GetNextLevelGridProblemsFn = (params: {
  grid: SolvedGridProblem,
}) => GridProblem[]
