// image-viewer previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("image-viewer/gallery-grid", async (f) => {
	await f.visible({ id: "image-viewer-trigger-orchard" });
	// Opening the third tile, which flies out of its own frame
	await f.tap("image-viewer-trigger-orchard");
	await f.containsText("image-viewer-counter", "3 / 6");
	await f.wait(900);
	// Swiping to the next photo
	await f.swipe({ id: "image-viewer-page-2" }, { x: -0.5 }, { durationMs: 250 });
	await f.containsText("image-viewer-counter", "4 / 6");
	await f.wait(900);
	// Closing flies the new photo home to its own tile
	await f.tap("image-viewer-close");
	await f.hidden({ id: "image-viewer-counter" });
});

capture("image-viewer/zoom", async (f) => {
	await f.visible({ id: "image-viewer-trigger-map" });
	// Opening the photo
	await f.tap("image-viewer-trigger-map");
	await f.visible({ id: "image-viewer-close" });
	await f.wait(900);
	// Double-tapping zooms in about the tapped point
	await f.gesture([
		{ type: "down", x: 0.62, y: 0.46 },
		{ type: "up", x: 0.62, y: 0.46, delayMs: 60 },
		{ type: "down", x: 0.62, y: 0.46, delayMs: 90 },
		{ type: "up", x: 0.62, y: 0.46, delayMs: 60 },
	]);
	await f.wait(1200);
	// And again to zoom back out, so the chrome returns
	await f.gesture([
		{ type: "down", x: 0.5, y: 0.5 },
		{ type: "up", x: 0.5, y: 0.5, delayMs: 60 },
		{ type: "down", x: 0.5, y: 0.5, delayMs: 90 },
		{ type: "up", x: 0.5, y: 0.5, delayMs: 60 },
	]);
	await f.visible({ id: "image-viewer-close" });
	await f.wait(700);
	await f.tap("image-viewer-close");
	await f.hidden({ id: "image-viewer-counter" });
});

capture("image-viewer/drag-to-dismiss", async (f) => {
	await f.visible({ id: "image-viewer-trigger-lighthouse" });
	// Opening the photo
	await f.tap("image-viewer-trigger-lighthouse");
	await f.visible({ id: "image-viewer-close" });
	await f.wait(900);
	// A short drag springs back
	await f.swipe({ id: "image-viewer-page-0" }, { y: 0.07 }, { durationMs: 400, momentum: false });
	await f.wait(900);
	// A longer one sends it home to the thumbnail
	await f.swipe({ id: "image-viewer-page-0" }, { y: 0.3 }, { durationMs: 350, momentum: false });
	await f.hidden({ id: "image-viewer-close" });
});

capture("image-viewer/custom-thumbnail");
