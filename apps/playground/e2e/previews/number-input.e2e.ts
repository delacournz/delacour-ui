// number-input previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("number-input/basic", async (f) => {
	// Stepping up three times
	await f.tap("basic-increment");
	await f.wait(350);
	await f.tap("basic-increment");
	await f.wait(350);
	await f.tap("basic-increment");
	await f.wait(700);
	// And back down three, so the clip loops at 2 without a jump cut
	await f.tap("basic-decrement");
	await f.wait(350);
	await f.tap("basic-decrement");
	await f.wait(350);
	await f.tap("basic-decrement");
});

capture("number-input/bounds", async (f) => {
	// Stepping up to the maximum, where the plus dims
	await f.tap("bounds-increment");
	await f.wait(350);
	await f.tap("bounds-increment");
	await f.wait(350);
	await f.tap("bounds-increment");
	await f.wait(800);
	// And back down to the minimum, so the clip loops without a jump cut
	await f.tap("bounds-decrement");
	await f.wait(350);
	await f.tap("bounds-decrement");
	await f.wait(350);
	await f.tap("bounds-decrement");
});

capture("number-input/currency", async (f) => {
	// Stepping the price up twice
	await f.tap("currency-increment");
	await f.wait(400);
	await f.tap("currency-increment");
	await f.wait(700);
	// And back down twice, so the clip loops at $1,249.50
	await f.tap("currency-decrement");
	await f.wait(400);
	await f.tap("currency-decrement");
});

capture("number-input/hold-to-repeat", async (f) => {
	// Holding the plus until the repeat speeds up and jumps by tens
	await f.longPress("repeat-increment", 3600);
	await f.wait(500);
	// Holding the minus longer than the plus was held, so it stops at 0 and the clip loops
	await f.longPress("repeat-decrement", 4400);
});

capture("number-input/sizes-variants");

capture("number-input/in-field");
