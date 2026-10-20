// flow previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("flow/pipeline", async (f) => {
	// Dragging Enrich down and out, so its two edges reroute on the same frame
	await f.swipe({ id: "flow-node-enrich" }, { x: 0.08, y: 0.07 }, { durationMs: 800, momentum: false });
	await f.wait(500);
	// And back by the same distance, so the clip loops without a jump cut
	await f.swipe({ id: "flow-node-enrich" }, { x: -0.08, y: -0.07 }, { durationMs: 800, momentum: false });
});

capture("flow/edge-variants");

capture("flow/groups", async (f) => {
	// Dragging the Ingest group by its label, so both riders and the edge out to Report follow
	await f.gesture(
		[
			{ type: "down", x: 0.21, y: 0.449 },
			{ type: "move", x: 0.27, y: 0.42, delayMs: 400 },
			{ type: "move", x: 0.33, y: 0.39, delayMs: 400 },
			{ type: "up", x: 0.33, y: 0.39, delayMs: 120 },
		],
		{ interpolate: 10 }
	);
	await f.wait(600);
	// And back by the same vector, so the clip loops without a jump cut
	await f.gesture(
		[
			{ type: "down", x: 0.32, y: 0.392 },
			{ type: "move", x: 0.26, y: 0.422, delayMs: 400 },
			{ type: "move", x: 0.2, y: 0.452, delayMs: 400 },
			{ type: "up", x: 0.2, y: 0.452, delayMs: 120 },
		],
		{ interpolate: 10 }
	);
});

capture("flow/connect", async (f) => {
	// Drawing a connection from Trigger's out handle to Notify's in handle, and holding it there
	await f.gesture(
		[
			{ type: "down", x: 0.44, y: 0.492 },
			{ type: "move", x: 0.5, y: 0.53, delayMs: 400 },
			{ type: "move", x: 0.558, y: 0.554, delayMs: 400 },
			{ type: "move", x: 0.558, y: 0.555, delayMs: 700 },
			{ type: "move", x: 0.5, y: 0.53, delayMs: 350 },
			{ type: "move", x: 0.44, y: 0.492, delayMs: 350 },
			{ type: "up", x: 0.44, y: 0.492, delayMs: 120 },
		],
		{ interpolate: 10 }
	);
});

capture("flow/controls-minimap", async (f) => {
	// Zooming out twice, so more of the graph comes on screen and the minimap's window grows to frame it
	await f.tap("flow-zoom-out");
	await f.wait(450);
	await f.tap("flow-zoom-out");
	await f.wait(800);
	// And in by the same two steps, so the clip loops at the zoom it began at
	await f.tap("flow-zoom-in");
	await f.wait(450);
	await f.tap("flow-zoom-in");
});

capture("flow/animated-edges", async (f) => {
	// Nothing to touch — the marching dashes are the motion, so the flow only holds the recording open
	await f.wait(2400);
});
