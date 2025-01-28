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
				pointsToConnect: [
					{ x: 0, y: 0, layer: "1" },
					{
						x: 10,
						y: 10,
						layer: "1",
					},
				],
			},
		],
		obstacles: [
			{
				type: "rect",
				layers: ["1"],
				center: { x: 3, y: 3 },
				width: 3,
				height: 3,
				connectedTo: [],
			},
		],
		minTraceWidth: 0.1,
		traces: [
			{
				type: "pcb_trace",
				pcb_trace_id: "trace1",
				route: [
					{
						route_type: "wire",
						x: 0,
						y: 0,
						width: 0.1,
						layer: "1",
					},
					{
						route_type: "wire",
						x: 0,
						y: 5,
						width: 0.1,
						layer: "1",
					},
					{
						route_type: "wire",
						x: 6,
						y: 5,
						width: 0.1,
						layer: "1",
					},
					{
						route_type: "wire",
						x: 10,
						y: 10,
						width: 0.1,
						layer: "1",
					},
				],
			},
		],
	};

	expect(getSvgFromGraphicsObject(srjToGd(problem))).toMatchSvgSnapshot(
		import.meta.path,
	);
});
