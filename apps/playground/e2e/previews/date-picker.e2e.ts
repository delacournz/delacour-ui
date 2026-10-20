// date-picker previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("date-picker/single", async (f) => {
	// Opening the sheet and picking the 21st — it closes on its own
	await f.tap("date-picker-single-trigger");
	await f.visible({ id: "date-picker-single-calendar-day-2026-10-21" });
	await f.wait(600);
	await f.tap("date-picker-single-calendar-day-2026-10-21");
	await f.hidden({ id: "date-picker-single-calendar" });
	await f.wait(900);
	// Back to the 14th, so the clip loops
	await f.tap("date-picker-single-trigger");
	await f.visible({ id: "date-picker-single-calendar-day-2026-10-14" });
	await f.wait(500);
	await f.tap("date-picker-single-calendar-day-2026-10-14");
	await f.hidden({ id: "date-picker-single-calendar" });
	await f.wait(500);
});

capture("date-picker/range-booking", async (f) => {
	// Opening the sheet and picking the 12th to the 16th — it closes once both ends exist
	await f.tap("date-picker-range-trigger");
	await f.visible({ id: "date-picker-range-calendar-day-2026-10-12" });
	await f.wait(500);
	await f.tap("date-picker-range-calendar-day-2026-10-12");
	await f.wait(600);
	await f.tap("date-picker-range-calendar-day-2026-10-16");
	await f.hidden({ id: "date-picker-range-calendar" });
	await f.wait(1000);
	// Clearing it, so the clip loops
	await f.tap("date-picker-range-trigger");
	await f.visible({ id: "date-picker-range-clear" });
	await f.wait(400);
	await f.tap("date-picker-range-clear");
	await f.wait(400);
	await f.tap("date-picker-range-done");
	await f.hidden({ id: "date-picker-range-calendar" });
	await f.wait(500);
});

capture("date-picker/multiple", async (f) => {
	// Adding a third day — the trigger switches from a list to a count
	await f.tap("date-picker-multiple-trigger");
	await f.visible({ id: "date-picker-multiple-calendar-day-2026-10-13" });
	await f.wait(500);
	await f.tap("date-picker-multiple-calendar-day-2026-10-13");
	await f.wait(500);
	await f.tap("date-picker-multiple-done");
	await f.hidden({ id: "date-picker-multiple-calendar" });
	await f.wait(900);
	// Taking it out again, so the clip loops
	await f.tap("date-picker-multiple-trigger");
	await f.visible({ id: "date-picker-multiple-calendar-day-2026-10-13" });
	await f.wait(400);
	await f.tap("date-picker-multiple-calendar-day-2026-10-13");
	await f.wait(400);
	await f.tap("date-picker-multiple-done");
	await f.hidden({ id: "date-picker-multiple-calendar" });
	await f.wait(500);
});

capture("date-picker/sizes-variants");

capture("date-picker/in-field-invalid");
