// selection-mode previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("selection-mode/inbox-mode", async (f) => {
	// A long press enters the mode with the pressed message picked
	await f.longPress("message-m2", 700);
	await f.visible({ id: "inbox-close" });
	await f.wait(500);
	// Taps now toggle
	await f.tap("message-m3");
	await f.wait(400);
	await f.tap("message-m5");
	await f.wait(900);
	// Close leaves the mode and clears, so the clip loops without a jump cut
	await f.tap("inbox-close");
	await f.hidden({ id: "inbox-close" });
	await f.wait(400);
});

capture("selection-mode/share-picker", async (f) => {
	// Picking two more
	await f.tap("person-aria");
	await f.wait(400);
	await f.tap("person-kenji");
	await f.wait(800);
	// And unpicking them, so the clip loops without a jump cut
	await f.tap("person-kenji");
	await f.wait(400);
	await f.tap("person-aria");
	await f.wait(400);
});

capture("selection-mode/swatch-grid", async (f) => {
	// Ringing two more swatches
	await f.tap("swatch-flame");
	await f.wait(400);
	await f.tap("swatch-violet");
	await f.wait(800);
	// And clearing them, so the clip loops without a jump cut
	await f.tap("swatch-violet");
	await f.wait(400);
	await f.tap("swatch-flame");
	await f.wait(400);
});

capture("selection-mode/max-limit", async (f) => {
	// Select all stops at the cap of three and flips to Deselect all
	await f.tap("toppings-select-all");
	await f.wait(700);
	// A fourth does not go on
	await f.tap("topping-pepper");
	await f.wait(700);
	// But a pick still comes off, back to where the clip began
	await f.tap("topping-mushroom");
	await f.wait(600);
});

capture("selection-mode/floating-bar", async (f) => {
	// Picking two albums
	await f.tap("album-a1");
	await f.wait(400);
	await f.tap("album-a3");
	await f.wait(800);
	// And unpicking them, so the clip loops without a jump cut
	await f.tap("album-a3");
	await f.wait(400);
	await f.tap("album-a1");
	await f.wait(400);
});

capture("selection-mode/in-a-sheet", async (f) => {
	// Opening the sheet
	await f.tap("open-sheet");
	await f.visible({ id: "channel-design" });
	await f.wait(600);
	// Picking two channels
	await f.tap("channel-design");
	await f.wait(400);
	await f.tap("channel-releases");
	await f.wait(800);
	// Unpicking them and dragging the sheet away, so the clip loops without a jump cut
	await f.tap("channel-releases");
	await f.wait(300);
	await f.tap("channel-design");
	await f.wait(400);
	await f.swipe({ text: "Post to" }, { y: 0.3 }, { durationMs: 250 });
	await f.hidden({ id: "channel-design" });
	await f.wait(400);
});
