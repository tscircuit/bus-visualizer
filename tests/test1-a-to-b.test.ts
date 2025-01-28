import { test, expect } from "bun:test";
import type { SimpleRouteJson } from "../lib/types";

test("simple a to b test", () => {
	const problem: SimpleRouteJson = {
		layerCount: 1,
		bounds: {
			minX: 0,
			maxX: 10,
			minY: 0,
			maxY: 10,
		},
		connections: [
			{
				name: "a-to-b",
				pointsToConnect: [{ x: 0, y: 0, layer: "1" }],
			},
		],
		obstacles: [],
		minTraceWidth: 0.1,
	};

	// expect(
});
