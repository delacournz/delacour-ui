// frame previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("frame/settings", async (f) => {
	// Flipping each row in the tray, top to bottom
	await f.tap("switch-push");
	await f.wait(450);
	await f.tap("switch-email");
	await f.wait(450);
	await f.tap("switch-quiet");
	await f.wait(800);
	// And back, so the clip loops without a jump cut
	await f.tap("switch-quiet");
	await f.wait(450);
	await f.tap("switch-email");
	await f.wait(450);
	await f.tap("switch-push");
});

capture("frame/variants");

capture("frame/sections");

capture("frame/decision-footer", async (f) => {
	// Changing both settings, then saving
	await f.tap("switch-archive");
	await f.wait(400);
	await f.tap("switch-notify");
	await f.wait(500);
	await f.tap("frame-save");
	await f.wait(900);
	// Putting both back and cancelling, so the clip loops without a jump cut
	await f.tap("switch-notify");
	await f.wait(400);
	await f.tap("switch-archive");
	await f.wait(500);
	await f.tap("frame-cancel");
	await f.wait(400);
});

capture("frame/members", async (f) => {
	// Pressing each row, so the grouped rows' fade feedback shows
	await f.longPress("member-0", 300);
	await f.wait(350);
	await f.longPress("member-1", 300);
	await f.wait(350);
	await f.longPress("member-2", 300);
	await f.wait(500);
});
