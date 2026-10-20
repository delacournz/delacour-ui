// grid-item previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("grid-item/dashboard", async (f) => {
	// Switching tiles off and on, then putting every one back so the clip loops
	await f.tap("tile-wifi");
	await f.wait(450);
	await f.tap("tile-focus");
	await f.wait(450);
	await f.tap("tile-airplane");
	await f.wait(900);
	await f.tap("tile-airplane");
	await f.wait(450);
	await f.tap("tile-focus");
	await f.wait(450);
	await f.tap("tile-wifi");
});

capture("grid-item/variants");

capture("grid-item/interactive", async (f) => {
	// Unlocking the door and muting the bell, holding Lights, then putting both back so the clip loops
	await f.tap("tile-lock");
	await f.wait(500);
	await f.tap("tile-bell");
	await f.wait(500);
	await f.longPress("tile-lights", 400);
	await f.wait(400);
	await f.tap("tile-lock");
	await f.wait(500);
	await f.tap("tile-bell");
});

capture("grid-item/backgrounds");

capture("grid-item/quick-actions");
