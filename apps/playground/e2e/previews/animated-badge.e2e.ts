// animated-badge previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("animated-badge/status-flow", async (f) => {
	// Stepping Queued → Building → Deploying → Live
	await f.tap("next-step");
	await f.wait(900);
	await f.tap("next-step");
	await f.wait(900);
	await f.tap("next-step");
	await f.wait(1100);
	// A fourth step wraps back to Queued, so the clip loops without a jump cut
	await f.tap("next-step");
	await f.wait(900);
});

capture("animated-badge/statuses", async (f) => {
	// Nothing to touch — the loading glyph is the motion, so this only holds the camera on it
	await f.wait(2000);
});

capture("animated-badge/sizes");

capture("animated-badge/custom-icon");

capture("animated-badge/inline-text", async (f) => {
	// Growing the count so the badge widens and the sentence reflows around it
	await f.tap("more-reviews");
	await f.wait(800);
	await f.tap("more-reviews");
	await f.wait(800);
	await f.tap("more-reviews");
	await f.wait(1000);
	// A fourth press wraps back to 8, so the clip loops without a jump cut
	await f.tap("more-reviews");
	await f.wait(800);
});
