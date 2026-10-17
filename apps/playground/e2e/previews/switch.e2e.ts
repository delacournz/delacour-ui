// switch previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("switch/tap-or-drag", async (f) => {
	// Toggling all three off, largest first
	await f.tap("switch-lg");
	await f.wait(500);
	await f.tap("switch-md");
	await f.wait(500);
	await f.tap("switch-sm");
	await f.wait(800);
	// And back on, so the clip loops without a jump cut
	await f.tap("switch-sm");
	await f.wait(500);
	await f.tap("switch-md");
	await f.wait(500);
	await f.tap("switch-lg");
});

capture("switch/colours", async (f) => {
	// Switching every colour off, top to bottom
	await f.tap("switch-default");
	await f.wait(150);
	await f.tap("switch-primary");
	await f.wait(150);
	await f.tap("switch-success");
	await f.wait(150);
	await f.tap("switch-warning");
	await f.wait(150);
	await f.tap("switch-destructive");
	await f.wait(150);
	await f.tap("switch-info");
	await f.wait(150);
	await f.wait(500);
	// And on again, so the clip loops without a jump cut
	await f.tap("switch-default");
	await f.wait(150);
	await f.tap("switch-primary");
	await f.wait(150);
	await f.tap("switch-success");
	await f.wait(150);
	await f.tap("switch-warning");
	await f.wait(150);
	await f.tap("switch-destructive");
	await f.wait(150);
	await f.tap("switch-info");
	await f.wait(150);
});

capture("switch/sizes");

capture("switch/disabled-and-invalid");

capture("switch/start-and-end-content", async (f) => {
	// Switching each size off, largest first
	await f.tap("switch-lg");
	await f.wait(400);
	await f.tap("switch-md");
	await f.wait(400);
	await f.tap("switch-sm");
	await f.wait(700);
	// And back on, so the clip loops without a jump cut
	await f.tap("switch-sm");
	await f.wait(400);
	await f.tap("switch-md");
	await f.wait(400);
	await f.tap("switch-lg");
});
