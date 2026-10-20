// label previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("label/basic");

capture("label/states");

capture("label/sizes");

capture("label/wrapping");

capture("label/beside-a-switch", async (f) => {
	// Tapping the label drives the switch off
	await f.tap("notifications-label");
	await f.wait(800);
	// And the switch itself turns it back on
	await f.tap("notifications");
});

capture("label/sign-up", { types: true }, async (f) => {
	// Submitting empty turns both required labels destructive
	await f.tap("submit");
	await f.wait(700);
	// A name clears its own error
	await f.tap("name");
	await f.wait(200);
	await f.type("name", "Ada");
	await f.wait(600);
	// Emptying the form starts it over, so every error goes
	await f.press("name", "Backspace", 3);
	await f.wait(300);
	// Return blurs the single-line field, so the clip loops unfocused
	await f.press("name", "Enter");
});
