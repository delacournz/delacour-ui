// surface previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("surface/variants");

capture("surface/padding");

capture("surface/nesting", async (f) => {
	// Adding two levels, so each new one steps from the last
	await f.tap("nesting-add");
	await f.wait(450);
	await f.tap("nesting-add");
	await f.wait(800);
	// And removing them again, so the clip loops without a jump cut
	await f.tap("nesting-remove");
	await f.wait(450);
	await f.tap("nesting-remove");
});

capture("surface/transparent", async (f) => {
	// Unwrapping the panel and wrapping it again — its fill does not change
	await f.tap("transparent-toggle");
	await f.wait(1000);
	await f.tap("transparent-toggle");
});

capture("surface/bleed");

capture("surface/security-card", async (f) => {
	// Turning two-factor on, so the status line follows the switch
	await f.tap("security-two-factor");
	await f.wait(1000);
	// And off again, so the clip loops without a jump cut
	await f.tap("security-two-factor");
});
