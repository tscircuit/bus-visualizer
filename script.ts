import { getSvgFromGraphicsObject } from "graphics-debug";
import { writeFileSync } from "node:fs";

writeFileSync(
	"./pic.svg",
	getSvgFromGraphicsObject({
		rects: [
			{
				center: { x: 0, y: 0 },
				width: 5,
				height: 5,
				fill: "blue",
			},
		],
		lines: [
			{
				strokeColor: "red",
				points: [
					{ x: 10, y: 10 },
					{ x: 1, y: 1 },
				],
			},
		],
	}),
);
