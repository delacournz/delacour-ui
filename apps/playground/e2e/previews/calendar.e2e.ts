// calendar previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("calendar/single", async (f) => {
	// Picking another day
	await f.tap("calendar-single-day-2026-10-21");
	await f.wait(700);
	// Jumping to November through the months view
	await f.tap("calendar-single-caption");
	await f.wait(600);
	await f.tap("calendar-single-month-11");
	await f.wait(700);
	// Paging back to October and restoring the 14th, so the clip loops
	await f.tap("calendar-single-prev");
	await f.wait(700);
	await f.tap("calendar-single-day-2026-10-14");
	await f.wait(300);
});

capture("calendar/range", async (f) => {
	// A new range, from the 20th to the 24th
	await f.tap("calendar-range-day-2026-10-20");
	await f.wait(450);
	await f.tap("calendar-range-day-2026-10-24");
	await f.wait(900);
	// Back to the 9th to the 15th, so the clip loops
	await f.tap("calendar-range-day-2026-10-09");
	await f.wait(450);
	await f.tap("calendar-range-day-2026-10-15");
	await f.wait(300);
});

capture("calendar/multiple", async (f) => {
	// Adding two days
	await f.tap("calendar-multiple-day-2026-10-22");
	await f.wait(400);
	await f.tap("calendar-multiple-day-2026-10-27");
	await f.wait(800);
	// And taking them out again, so the clip loops
	await f.tap("calendar-multiple-day-2026-10-27");
	await f.wait(400);
	await f.tap("calendar-multiple-day-2026-10-22");
	await f.wait(300);
});

capture("calendar/bounds-and-disabled");

capture("calendar/sizes-variants", async (f) => {
	// The softer variant
	await f.tap("calendar-variant-secondary");
	await f.wait(1200);
	// Back to Primary, so the clip loops
	await f.tap("calendar-variant-primary");
	await f.wait(600);
});
