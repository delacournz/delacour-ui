// flip-card previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("flip-card/anatomy", async (f) => {
	// Tapping the card over to its back
	await f.tap("flip-card");
	await f.wait(1200);
	// And over again, so the clip loops on the front without a jump cut
	await f.tap("flip-card");
	await f.wait(1000);
});

capture("flip-card/swipe", async (f) => {
	// Dragging the card a little under half way — it settles back on the front
	await f.swipe({ id: "flip-card-swipe" }, { x: 0.15 }, { durationMs: 900, momentum: false });
	await f.wait(800);
	// Then past half way — it settles on the back
	await f.swipe({ id: "flip-card-swipe" }, { x: 0.45 }, { durationMs: 900, momentum: false });
	await f.wait(900);
	// A flick the other way brings the front back for the loop
	await f.swipe({ id: "flip-card-swipe" }, { x: -0.4 }, { durationMs: 200 });
	await f.wait(900);
});

capture("flip-card/flashcard", async (f) => {
	// Revealing the answer
	await f.tap("flip-card-trigger");
	await f.wait(1400);
	// And back to the question for the loop
	await f.tap("flip-card-trigger");
	await f.wait(1000);
});

capture("flip-card/vertical-axis", async (f) => {
	// Turning the left/right card, then the top/bottom one
	await f.tap("flip-card-axis-y");
	await f.wait(700);
	await f.tap("flip-card-axis-x");
	await f.wait(1200);
	// Both back to the front for the loop
	await f.tap("flip-card-axis-y");
	await f.wait(300);
	await f.tap("flip-card-axis-x");
	await f.wait(1000);
});

capture("flip-card/faces");
