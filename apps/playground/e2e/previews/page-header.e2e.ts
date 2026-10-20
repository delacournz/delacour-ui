// page-header previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("page-header/profile", async (f) => {
	// Follow — the button steps down to "Following" and the count ticks over
	await f.tap("page-header-profile-follow");
	await f.wait(1200);
	// And unfollow, so the clip loops without a jump cut
	await f.tap("page-header-profile-follow");
	await f.wait(600);
});

capture("page-header/gradient-cover");

capture("page-header/aligned-start");

capture("page-header/stats");

capture("page-header/card-in-list");

capture("page-header/in-a-screen", async (f) => {
	// Join — the button steps down to "Joined" and Members ticks over
	await f.tap("page-header-screen-join");
	await f.wait(600);
	// Scroll the header away under the navbar
	await f.swipe({ id: "page-header-screen-scroll" }, { y: -0.35 }, { momentum: false });
	await f.wait(600);
	// Back to the top
	await f.swipe({ id: "page-header-screen-scroll" }, { y: 0.5 }, { momentum: false });
	await f.wait(500);
	// And leave, so the clip loops without a jump cut
	await f.tap("page-header-screen-join");
	await f.wait(600);
});
