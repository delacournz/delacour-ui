// qr-code previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("qr-code/anatomy");

capture("qr-code/module-styles", async (f) => {
	// Redrawing the same code rounded, then as dots
	await f.wait(700);
	await f.tap("qr-code-style-rounded");
	await f.wait(1100);
	await f.tap("qr-code-style-dots");
	await f.wait(1100);
	// And back to square, so the clip loops without a jump cut
	await f.tap("qr-code-style-square");
	await f.wait(700);
});

capture("qr-code/with-logo", async (f) => {
	// Taking the logo off — the code re-encodes at the requested level, sparser
	await f.wait(600);
	await f.tap("qr-code-logo-switch");
	await f.wait(1300);
	// And on again, so the clip loops without a jump cut
	await f.tap("qr-code-logo-switch");
	await f.wait(900);
});

capture("qr-code/error-correction");

capture("qr-code/colours");
