// theme-selector previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("theme-selector/basic");

capture("theme-selector/controlled", async (f) => {
	// Choosing Light, then Dark
	await f.tap("theme-selector-controlled-light");
	await f.wait(700);
	await f.tap("theme-selector-controlled-dark");
	await f.wait(700);
	// And back to System, so the clip loops without a jump cut
	await f.tap("theme-selector-controlled-system");
	await f.wait(600);
});

capture("theme-selector/cards");

capture("theme-selector/sizes");

capture("theme-selector/persisted");

capture("theme-selector/in-field");
