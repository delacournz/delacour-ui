// list-group previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("list-group/variants", async (f) => {
	// Pressing down the first row of each variant, so the highlight reads on every surface
	await f.longPress("row-default", 300);
	await f.wait(150);
	await f.longPress("row-secondary", 300);
	await f.wait(150);
	await f.longPress("row-tertiary", 300);
	await f.wait(150);
	await f.longPress("row-transparent", 300);
});

capture("list-group/sizes");

capture("list-group/dividers");

capture("list-group/custom-suffix", async (f) => {
	// Pressing down each row, so the row highlight reads
	await f.longPress("row-language", 300);
	await f.wait(150);
	await f.longPress("row-notifications", 300);
	await f.wait(150);
	await f.longPress("row-syncing", 300);
	await f.wait(150);
	await f.longPress("row-chevron", 300);
});
