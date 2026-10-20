// item previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("item/variants", async (f) => {
	// Pressing and holding each variant in turn, so the press feedback reads
	await f.longPress("item-default", 400);
	await f.wait(200);
	await f.longPress("item-outline", 400);
	await f.wait(200);
	await f.longPress("item-muted", 400);
});

capture("item/media");

capture("item/in-a-list-group", async (f) => {
	// Airplane mode on, which disables the Wi-Fi row
	await f.tap("item-airplane");
	await f.wait(900);
	await f.tap("item-notifications");
	await f.wait(700);
	// And both back, so the clip loops without a jump cut
	await f.tap("item-notifications");
	await f.wait(500);
	await f.tap("item-airplane");
});

capture("item/selection", async (f) => {
	// Moving the selection down the list and back
	await f.tap("item-lifetime");
	await f.wait(600);
	await f.tap("item-monthly");
	await f.wait(600);
	await f.tap("item-yearly");
});

capture("item/controls-in-actions");

capture("item/header-and-footer");
