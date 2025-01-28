import { test, expect } from "bun:test";
import type { SimpleRouteJson } from "../lib/types";
import { srjToGd } from "../lib/srj-to-gd";
import { getSvgFromGraphicsObject } from "graphics-debug";

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

	expect(getSvgFromGraphicsObject(srjToGd(problem))).toMatchSvgSnapshot(
		import.meta.path,
	);
});
