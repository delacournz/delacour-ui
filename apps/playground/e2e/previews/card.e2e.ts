// card previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("card/anatomy");

capture("card/variants");

capture("card/footer-band", async (f) => {
	// Switching the footer to Default and back to Band
	await f.tap("card-band-footer-default");
	await f.wait(1000);
	await f.tap("card-band-footer-band");
});

capture("card/media", async (f) => {
	// Saving it and un-saving it, so the heart fills and clears
	await f.tap("card-media-save");
	await f.wait(900);
	await f.tap("card-media-save");
});

capture("card/plan-picker", async (f) => {
	// Picking Hobby, then back to Pro
	await f.tap("card-plan-hobby");
	await f.wait(900);
	await f.tap("card-plan-pro");
});

capture("card/sign-in");
