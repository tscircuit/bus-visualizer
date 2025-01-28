import type { GraphicsObject, SimpleRouteJson } from "./types";

export const srjToGd = (srj: SimpleRouteJson): GraphicsObject => {
	const graphicsObject: GraphicsObject = {
		coordinateSystem: "cartesian",
		grid: { cellSize: 1, label: true },
		rects: [],
		points: [],
		lines: [],
		circles: [],
	};

	// Add obstacles as rectangles
	graphicsObject.rects = srj.obstacles.map((obstacle) => ({
		center: obstacle.center,
		width: obstacle.width,
		height: obstacle.height,
		fill: "rgba(200, 200, 200, 0.5)",
		stroke: "gray",
	}));

	// Add connection points
	graphicsObject.points = srj.connections.flatMap((conn) =>
		conn.pointsToConnect.map((point) => ({
			x: point.x,
			y: point.y,
			color: "blue",
			label: conn.name,
		})),
	);

	// Add traces if they exist
	if (srj.traces) {
		// biome-ignore lint/complexity/noForEach: <explanation>
		srj.traces.forEach((trace) => {
			const points: { x: number; y: number; stroke?: number }[] = [];

			// biome-ignore lint/complexity/noForEach: <explanation>
			trace.route.forEach((segment) => {
				if (segment.route_type === "wire") {
					points.push({
						x: segment.x,
						y: segment.y,
						stroke: segment.width,
					});
				} else if (segment.route_type === "via") {
					// Add via as circle
					graphicsObject.circles?.push({
						center: { x: segment.x, y: segment.y },
						radius: srj.minTraceWidth / 2,
						fill: "red",
						stroke: "darkred",
					});
				}
			});

			if (points.length > 0) {
				graphicsObject.lines?.push({ points });
			}
		});
	}

	return graphicsObject;
};
