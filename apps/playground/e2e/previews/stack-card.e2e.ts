// stack-card previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("stack-card/review-queue", async (f) => {
	// Dragging Aria slowly right, so the Keep stamp fades in, and letting go past the threshold
	await f.swipe({ id: "review-card-aria" }, { x: 0.45 }, { durationMs: 900, momentum: false });
	await f.wait(700);
	// Answering Tomasi with the Skip button instead of a drag
	await f.tap("review-skip");
	await f.wait(800);
	// Undoing both, so each card flies back from the side it left and the clip loops on Aria
	await f.tap("review-undo");
	await f.wait(600);
	await f.tap("review-undo");
	await f.wait(600);
});

capture("stack-card/layouts", async (f) => {
	// Fanning the cards behind the top one
	await f.tap("layout-fan");
	await f.wait(900);
	// Hiding them
	await f.tap("layout-flat");
	await f.wait(900);
	// And back to the stack, so the clip loops
	await f.tap("layout-stack");
	await f.wait(600);
});

capture("stack-card/undo", async (f) => {
	// Throwing the first card right and the second left
	await f.swipe({ id: "undo-card-0" }, { x: 0.45 }, { durationMs: 400 });
	await f.wait(600);
	await f.swipe({ id: "undo-card-1" }, { x: -0.45 }, { durationMs: 400 });
	await f.wait(700);
	// Undoing both — each returns from the side it left — so the clip loops on the first card
	await f.tap("undo-undo");
	await f.wait(700);
	await f.tap("undo-undo");
	await f.wait(600);
});

capture("stack-card/controlled-decline", async (f) => {
	// Throwing holiday.mov left, which the deck declines while it asks
	await f.swipe({ id: "decline-card-holiday" }, { x: -0.45 }, { durationMs: 400 });
	await f.wait(1000);
	// Answering No — the card stays, the question goes, and the clip loops where it began
	await f.tap("decline-no");
	await f.wait(700);
});

capture("stack-card/large-deck");
