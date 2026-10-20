// sketch previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("sketch/default", async (f) => {
	// A freehand wave in the foreground ink, under the seeded drawing
	await f.gesture(
		[
			{ type: "down", x: 0.15, y: 0.53 },
			{ type: "move", x: 0.179, y: 0.549, delayMs: 40 },
			{ type: "move", x: 0.207, y: 0.559, delayMs: 40 },
			{ type: "move", x: 0.236, y: 0.557, delayMs: 40 },
			{ type: "move", x: 0.264, y: 0.543, delayMs: 40 },
			{ type: "move", x: 0.293, y: 0.523, delayMs: 40 },
			{ type: "move", x: 0.321, y: 0.507, delayMs: 40 },
			{ type: "move", x: 0.35, y: 0.5, delayMs: 40 },
			{ type: "move", x: 0.379, y: 0.507, delayMs: 40 },
			{ type: "move", x: 0.407, y: 0.523, delayMs: 40 },
			{ type: "move", x: 0.436, y: 0.543, delayMs: 40 },
			{ type: "move", x: 0.464, y: 0.557, delayMs: 40 },
			{ type: "move", x: 0.493, y: 0.559, delayMs: 40 },
			{ type: "move", x: 0.521, y: 0.549, delayMs: 40 },
			{ type: "up", x: 0.55, y: 0.53, delayMs: 40 },
		],
		{ interpolate: 4 }
	);
	await f.wait(250);
	// Red ink, and a loop drawn round the end of it
	await f.tap("sketch-swatch-destructive");
	await f.wait(400);
	await f.gesture(
		[
			{ type: "down", x: 0.79, y: 0.5 },
			{ type: "move", x: 0.782, y: 0.519, delayMs: 45 },
			{ type: "move", x: 0.758, y: 0.534, delayMs: 45 },
			{ type: "move", x: 0.724, y: 0.543, delayMs: 45 },
			{ type: "move", x: 0.686, y: 0.544, delayMs: 45 },
			{ type: "move", x: 0.65, y: 0.537, delayMs: 45 },
			{ type: "move", x: 0.623, y: 0.524, delayMs: 45 },
			{ type: "move", x: 0.611, y: 0.505, delayMs: 45 },
			{ type: "move", x: 0.614, y: 0.486, delayMs: 45 },
			{ type: "move", x: 0.634, y: 0.469, delayMs: 45 },
			{ type: "move", x: 0.666, y: 0.458, delayMs: 45 },
			{ type: "move", x: 0.704, y: 0.455, delayMs: 45 },
			{ type: "move", x: 0.741, y: 0.46, delayMs: 45 },
			{ type: "move", x: 0.771, y: 0.472, delayMs: 45 },
			{ type: "move", x: 0.788, y: 0.489, delayMs: 45 },
			{ type: "move", x: 0.788, y: 0.509, delayMs: 45 },
			{ type: "up", x: 0.773, y: 0.526, delayMs: 45 },
		],
		{ interpolate: 4 }
	);
	await f.wait(700);
	// Undo both and take the foreground ink back, so the clip loops on the seed
	await f.tap("sketch-undo");
	await f.wait(200);
	await f.tap("sketch-undo");
	await f.tap("sketch-swatch-foreground");
});

capture("sketch/shapes", async (f) => {
	// An arrow, dragged up and to the right
	await f.swipe({ id: "sketch-canvas" }, { x: 0.3, y: -0.2 }, { durationMs: 600, momentum: false });
	await f.wait(400);
	// Then a star
	await f.tap("sketch-shape-star");
	await f.wait(400);
	await f.swipe({ id: "sketch-canvas" }, { x: -0.25, y: 0.12 }, { durationMs: 600, momentum: false });
	await f.wait(600);
	// Undo both, and back to the arrow, so the clip loops where it began
	await f.tap("sketch-undo");
	await f.wait(200);
	await f.tap("sketch-undo");
	await f.tap("sketch-shape-arrow");
});

capture("sketch/eraser", async (f) => {
	// Erase down through all four lines
	await f.swipe({ id: "sketch-canvas" }, { y: -0.3 }, { durationMs: 700, momentum: false });
	await f.wait(300);
	// Pick up the pen and draw back over the erased gap — the new stroke is untouched
	await f.tap("sketch-tool-pen");
	await f.wait(400);
	await f.swipe({ id: "sketch-canvas" }, { y: -0.3 }, { durationMs: 700, momentum: false });
	await f.wait(600);
	// Undo the stroke and the erase, and take the eraser back, so the clip loops
	await f.tap("sketch-undo");
	await f.wait(200);
	await f.tap("sketch-undo");
	await f.tap("sketch-tool-eraser");
});

capture("sketch/colours");

capture("sketch/annotate", async (f) => {
	// Ring the croissant with the ellipse tool
	await f.tap("sketch-shape-ellipse");
	await f.wait(400);
	await f.swipe({ id: "sketch-canvas" }, { x: 0.35, y: 0.06 }, { durationMs: 600, momentum: false });
	await f.wait(250);
	// Then a freehand tick beside the total
	await f.tap("sketch-tool-pen");
	await f.wait(400);
	await f.gesture(
		[
			{ type: "down", x: 0.62, y: 0.5 },
			{ type: "move", x: 0.66, y: 0.53, delayMs: 45 },
			{ type: "move", x: 0.7, y: 0.56, delayMs: 45 },
			{ type: "move", x: 0.76, y: 0.49, delayMs: 45 },
			{ type: "up", x: 0.82, y: 0.42, delayMs: 45 },
		],
		{ interpolate: 4 }
	);
	await f.wait(700);
	// Undo both, so the clip loops on the clean receipt
	await f.tap("sketch-undo");
	await f.wait(200);
	await f.tap("sketch-undo");
});
