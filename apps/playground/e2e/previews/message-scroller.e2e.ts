// message-scroller previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("message-scroller/basic", async (f) => {
	// Scrolling back through the conversation
	await f.swipe({ id: "message-scroller-basic" }, { y: 0.25 }, { durationMs: 500 });
	await f.wait(700);
	await f.swipe({ id: "message-scroller-basic" }, { y: 0.25 }, { durationMs: 500 });
	await f.wait(900);
	// And down to the newest again, so the clip loops without a jump cut
	await f.swipe({ id: "message-scroller-basic" }, { y: -0.3 }, { durationMs: 400 });
	await f.wait(300);
	await f.swipe({ id: "message-scroller-basic" }, { y: -0.3 }, { durationMs: 400 });
	await f.wait(300);
	await f.swipe({ id: "message-scroller-basic" }, { y: -0.3 }, { durationMs: 400 });
});

capture("message-scroller/stick-to-bottom");

capture("message-scroller/jump-to-latest", async (f) => {
	// Scrolling up, away from the newest
	await f.swipe({ id: "message-scroller-jump" }, { y: 0.3 }, { durationMs: 500 });
	await f.wait(500);
	// Holding while replies arrive, so the button's count climbs
	await f.visible({ id: "message-scroller-jump-button" });
	await f.wait(3500);
	// Jumping back to the newest, where the clip began
	await f.tap("message-scroller-jump-button");
	await f.wait(900);
});

capture("message-scroller/load-older", async (f) => {
	// Scrolling to the top, which loads the next page above
	await f.swipe({ id: "message-scroller-older" }, { y: 0.35 }, { durationMs: 350 });
	await f.wait(400);
	await f.swipe({ id: "message-scroller-older" }, { y: 0.35 }, { durationMs: 350 });
	await f.wait(1600);
	// And back down to the newest, so the clip loops without a jump cut
	await f.swipe({ id: "message-scroller-older" }, { y: -0.35 }, { durationMs: 250 });
	await f.wait(200);
	await f.swipe({ id: "message-scroller-older" }, { y: -0.35 }, { durationMs: 250 });
	await f.wait(200);
	await f.swipe({ id: "message-scroller-older" }, { y: -0.35 }, { durationMs: 250 });
	await f.wait(200);
	await f.swipe({ id: "message-scroller-older" }, { y: -0.35 }, { durationMs: 250 });
});

capture("message-scroller/date-separators");

capture("message-scroller/unread-divider");
