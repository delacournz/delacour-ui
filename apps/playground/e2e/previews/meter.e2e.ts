// meter previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("meter/anatomy");

capture("meter/regions", async (f) => {
	// Filling the disk past high, then draining the battery's reading up into its optimum
	await f.swipe({ id: "meter-region-disk-thumb" }, { x: 0.12 }, { durationMs: 500, momentum: false });
	await f.swipe({ id: "meter-region-battery-thumb" }, { x: 0.5 }, { durationMs: 700, momentum: false });
	await f.wait(400);
	// And both back by the same distance, so the clip loops near where it began
	await f.swipe({ id: "meter-region-battery-thumb" }, { x: -0.5 }, { durationMs: 700, momentum: false });
	await f.swipe({ id: "meter-region-disk-thumb" }, { x: -0.12 }, { durationMs: 500, momentum: false });
});

capture("meter/thresholds", async (f) => {
	// Stepping the load up past the warning threshold at 70 and the destructive one at 90
	await f.tap("meter-thresholds-increment");
	await f.wait(300);
	await f.tap("meter-thresholds-increment");
	await f.wait(300);
	await f.tap("meter-thresholds-increment");
	await f.wait(450);
	await f.tap("meter-thresholds-increment");
	await f.wait(300);
	await f.tap("meter-thresholds-increment");
	await f.wait(700);
	// Resetting to 45, so the clip loops where it began
	await f.tap("meter-thresholds-reset");
});

capture("meter/segments", { types: true }, async (f) => {
	// Clearing the password, which empties the meter
	await f.tap("meter-password-input");
	await f.wait(300);
	await f.press("meter-password-input", "Backspace", 8);
	await f.wait(300);
	// Retyping it, so the blocks light one by one back to Good, then submitting to blur
	await f.type("meter-password-input", "Harbour7");
	await f.wait(300);
	await f.press("meter-password-input", "Enter");
});

capture("meter/sizes");

capture("meter/plan-usage", async (f) => {
	// Simulating three days, which pushes the quotas past their warning and destructive marks
	await f.tap("meter-quota-simulate");
	await f.wait(450);
	await f.tap("meter-quota-simulate");
	await f.wait(450);
	await f.tap("meter-quota-simulate");
	await f.wait(800);
	// Resetting to day 24, so the clip loops where it began
	await f.tap("meter-quota-reset");
});
