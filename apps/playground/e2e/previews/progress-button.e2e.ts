// progress-button previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("progress-button/hold-to-erase", async (f) => {
	// A short hold, released early, so the fill plays back at the rate it went in
	await f.longPress("hold-to-erase", 800);
	await f.wait(1000);
	// A full hold — the fill reaches the end and the tick replaces the label
	await f.longPress("hold-to-erase", 2300);
	// isAutoReset rewinds it after a second, travelling back to empty, so the clip loops
	await f.wait(1800);
});

capture("progress-button/variants", async (f) => {
	// Holding each variant half way and letting go, so the wipe crosses its label and plays back
	await f.longPress("variant-primary", 1000);
	await f.longPress("variant-secondary", 1000);
	await f.longPress("variant-destructive", 1000);
	await f.longPress("variant-success", 1000);
	// The last fill drains to empty, so the clip loops without a jump cut
	await f.wait(1200);
});

capture("progress-button/sizes");

capture("progress-button/shape-rounded");

capture("progress-button/custom-done", async (f) => {
	// A full hold — the custom done mark, a lock and "Paid", fades in over the fill
	await f.longPress("custom-done", 2300);
	// isAutoReset rewinds it after a second, so the clip loops without a jump cut
	await f.wait(1800);
});
