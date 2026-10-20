// scroll-canvas previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("scroll-canvas/parallax", async (f) => {
	// A slow drag up raises the canvas through its window — the picture drifts down through the still frame
	await f.swipe({ id: "scroll-canvas-parallax" }, { y: -0.35 }, { durationMs: 1400, momentum: false });
	await f.wait(500);
	// And a slightly longer drag back down, which settles at offset 0 so the clip loops without a jump cut
	await f.swipe({ id: "scroll-canvas-parallax" }, { y: 0.45 }, { durationMs: 1400, momentum: false });
	await f.wait(800);
});

capture("scroll-canvas/zoom", async (f) => {
	// A slow drag up raises the canvas through its window — the picture settles from oversized to its natural size
	await f.swipe({ id: "scroll-canvas-zoom" }, { y: -0.35 }, { durationMs: 1400, momentum: false });
	await f.wait(500);
	// And a slightly longer drag back down, which settles at offset 0 so the clip loops without a jump cut
	await f.swipe({ id: "scroll-canvas-zoom" }, { y: 0.45 }, { durationMs: 1400, momentum: false });
	await f.wait(800);
});

capture("scroll-canvas/reveal", async (f) => {
	// A slow drag up raises the canvas through its window — the cover retreats upward and uncovers the picture from the bottom edge
	await f.swipe({ id: "scroll-canvas-reveal" }, { y: -0.35 }, { durationMs: 1400, momentum: false });
	await f.wait(500);
	// And a slightly longer drag back down, which settles at offset 0 so the clip loops without a jump cut
	await f.swipe({ id: "scroll-canvas-reveal" }, { y: 0.45 }, { durationMs: 1400, momentum: false });
	await f.wait(800);
});

capture("scroll-canvas/sequence", async (f) => {
	// A slow drag up raises the canvas through its window — the dial scrubs forward through its 24 frames
	await f.swipe({ id: "scroll-canvas-sequence" }, { y: -0.35 }, { durationMs: 1400, momentum: false });
	await f.wait(500);
	// And a slightly longer drag back down, which settles at offset 0 so the clip loops without a jump cut
	await f.swipe({ id: "scroll-canvas-sequence" }, { y: 0.45 }, { durationMs: 1400, momentum: false });
	await f.wait(800);
});

capture("scroll-canvas/reduced-motion");
