// date-time-picker previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("date-time-picker/tabs-layout", async (f) => {
	// Opening the sheet and moving the day to the 21st
	await f.tap("date-time-picker-tabs-trigger");
	await f.visible({ id: "date-time-picker-tabs-calendar-day-2026-10-21" });
	await f.wait(600);
	await f.tap("date-time-picker-tabs-calendar-day-2026-10-21");
	await f.wait(700);
	// Over to Time, rolling the hour forward
	await f.tap("date-time-picker-tabs-tab-time");
	await f.visible({ text: "Hour" });
	await f.wait(600);
	await f.swipe({ text: "Hour" }, { y: -0.09 }, { durationMs: 600, momentum: false });
	await f.wait(1000);
	await f.tap("date-time-picker-tabs-done");
	await f.hidden({ id: "date-time-picker-tabs-calendar" });
	await f.wait(900);
	// Reopening to put it back — the hour to 12, the day to the 14th — so the clip loops
	await f.tap("date-time-picker-tabs-trigger");
	await f.visible({ id: "date-time-picker-tabs-tab-time" });
	await f.wait(600);
	await f.tap("date-time-picker-tabs-tab-time");
	await f.visible({ text: "Hour" });
	await f.wait(600);
	await f.swipe({ text: "Hour" }, { y: 0.09 }, { durationMs: 600, momentum: false });
	await f.wait(1000);
	await f.tap("date-time-picker-tabs-tab-date");
	await f.visible({ id: "date-time-picker-tabs-calendar-day-2026-10-14" });
	await f.wait(600);
	await f.tap("date-time-picker-tabs-calendar-day-2026-10-14");
	await f.wait(600);
	await f.tap("date-time-picker-tabs-done");
	await f.hidden({ id: "date-time-picker-tabs-calendar" });
	await f.wait(500);
});

capture("date-time-picker/stacked-layout", async (f) => {
	// Opening the sheet, then the wheel under the time row
	await f.tap("date-time-picker-stacked-trigger");
	await f.visible({ id: "date-time-picker-stacked-time-row" });
	await f.wait(600);
	await f.tap("date-time-picker-stacked-time-row");
	await f.visible({ text: "Hour" });
	await f.wait(800);
	// Rolling the hour back
	await f.swipe({ text: "Hour" }, { y: 0.09 }, { durationMs: 600, momentum: false });
	await f.wait(1000);
	await f.tap("date-time-picker-stacked-done");
	await f.hidden({ id: "date-time-picker-stacked-calendar" });
	await f.wait(900);
	// Reopening to roll it forward to 9, so the clip loops on 9:00 AM
	await f.tap("date-time-picker-stacked-trigger");
	await f.visible({ id: "date-time-picker-stacked-time-row" });
	await f.wait(600);
	await f.tap("date-time-picker-stacked-time-row");
	await f.visible({ text: "Hour" });
	await f.wait(800);
	await f.swipe({ text: "Hour" }, { y: -0.09 }, { durationMs: 600, momentum: false });
	await f.wait(1000);
	await f.tap("date-time-picker-stacked-done");
	await f.hidden({ id: "date-time-picker-stacked-calendar" });
	await f.wait(500);
});

capture("date-time-picker/step-15-24h", async (f) => {
	// Opening the sheet on the Time tab, rolling the hour forward
	await f.tap("date-time-picker-24h-trigger");
	await f.visible({ id: "date-time-picker-24h-tab-time" });
	await f.wait(600);
	await f.tap("date-time-picker-24h-tab-time");
	await f.visible({ text: "Hour" });
	await f.wait(700);
	await f.swipe({ text: "Hour" }, { y: -0.09 }, { durationMs: 600, momentum: false });
	await f.wait(1000);
	await f.tap("date-time-picker-24h-done");
	await f.hidden({ id: "date-time-picker-24h-calendar" });
	await f.wait(900);
	// Reopening to roll it back to 15, so the clip loops on 15:00
	await f.tap("date-time-picker-24h-trigger");
	await f.visible({ id: "date-time-picker-24h-tab-time" });
	await f.wait(600);
	await f.tap("date-time-picker-24h-tab-time");
	await f.visible({ text: "Hour" });
	await f.wait(700);
	await f.swipe({ text: "Hour" }, { y: 0.09 }, { durationMs: 600, momentum: false });
	await f.wait(1000);
	await f.tap("date-time-picker-24h-done");
	await f.hidden({ id: "date-time-picker-24h-calendar" });
	await f.wait(500);
});

capture("date-time-picker/inline");

capture("date-time-picker/in-field-invalid");
