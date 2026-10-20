// text-animation previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("text-animation/reveal-words", async (f) => {
	// Replaying the reveal — every word drops out and slides back up in turn
	await f.tap("text-animation-reveal-words-replay");
	await f.wait(1800);
});

capture("text-animation/reveal-characters", async (f) => {
	// Replaying the reveal — the letters scale in from the middle outwards
	await f.tap("text-animation-reveal-characters-replay");
	await f.wait(1200);
});

capture("text-animation/typing", async (f) => {
	// Nothing to touch — Typing cycles on its own. One full cycle (25 + 29 characters typed at 22/s, held 1400 ms each, erased at 40/s ≈ 6604 ms, less the ~300 ms the recorder spends starting) with no lead or tail pad, so the clip ends where it began and loops without a jump cut
	await f.wait(6300);
});

capture("text-animation/rotating", async (f) => {
	// Nothing to touch — Rotating swaps on its own. One full cycle (four words × 2200 ms, less the ~300 ms the recorder spends starting) with no lead or tail pad, so the clip ends on the word it began on and loops without a jump cut
	await f.wait(8500);
});

capture("text-animation/counting", async (f) => {
	// Stepping through all four balances, so the last tap counts back to the first and the clip loops
	await f.tap("text-animation-counting-next");
	await f.wait(1200);
	await f.tap("text-animation-counting-next");
	await f.wait(1200);
	await f.tap("text-animation-counting-next");
	await f.wait(1200);
	await f.tap("text-animation-counting-next");
	await f.wait(1000);
});

capture("text-animation/rolling", async (f) => {
	// Stepping through all four readings, so the last tap rolls back to the first and the clip loops
	await f.tap("text-animation-rolling-next");
	await f.wait(1000);
	await f.tap("text-animation-rolling-next");
	await f.wait(1000);
	await f.tap("text-animation-rolling-next");
	await f.wait(1000);
	await f.tap("text-animation-rolling-next");
	await f.wait(900);
});
