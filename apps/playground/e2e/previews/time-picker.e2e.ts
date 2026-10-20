// time-picker previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("time-picker/basic-sheet", async (f) => {
	// Opening the sheet from the trigger
	await f.tap("time-picker-basic");
	await f.visible({ text: "Done" });
	await f.wait(600);
	// Rolling the hour wheel forward a couple of rows
	await f.swipe({ text: "Hour" }, { y: -0.09 }, { durationMs: 600, momentum: false });
	await f.wait(1000);
	// And back to 12, so the clip loops on 12:00 PM
	await f.swipe({ text: "Hour" }, { y: 0.2 }, { durationMs: 700, momentum: false });
	await f.wait(1000);
	await f.tapText("Done");
	await f.hidden({ text: "Done" });
	await f.wait(400);
});

capture("time-picker/twenty-four-hour");

capture("time-picker/bounds", async (f) => {
	// Rolling the hour past the last open hour; the wheel pulls back to 5:30 PM
	await f.swipe({ text: "Hour" }, { y: -0.3 }, { durationMs: 900, momentum: false });
	await f.wait(1500);
	// Minute back to 00, then hour back to 12, so the clip loops on 12:00 PM
	await f.swipe({ text: "Minute" }, { y: 0.45 }, { durationMs: 800, momentum: false });
	await f.wait(1000);
	await f.swipe({ text: "Hour" }, { y: 0.4 }, { durationMs: 800, momentum: false });
	await f.wait(1000);
});

capture("time-picker/inline-wheel", async (f) => {
	// Rolling the minute wheel forward
	await f.swipe({ text: "Minute" }, { y: -0.14 }, { durationMs: 700, momentum: false });
	await f.wait(1000);
	// Flipping to PM and back to AM
	await f.swipe({ text: "AM or PM" }, { y: -0.1 }, { durationMs: 500, momentum: false });
	await f.wait(1000);
	await f.swipe({ text: "AM or PM" }, { y: 0.1 }, { durationMs: 500, momentum: false });
	await f.wait(1000);
	// And the minute back to 00, so the clip loops on 7:00 AM
	await f.swipe({ text: "Minute" }, { y: 0.45 }, { durationMs: 700, momentum: false });
	await f.wait(1000);
});

capture("time-picker/in-field-invalid", async (f) => {
	// Opening the sheet and accepting the time it starts on
	await f.tap("time-picker-field");
	await f.visible({ text: "Done" });
	await f.wait(600);
	await f.tapText("Done");
	await f.hidden({ text: "Done" });
	await f.wait(900);
	// Opening it again and clearing, so the clip loops on the empty, invalid field
	await f.tap("time-picker-field");
	await f.visible({ text: "Clear" });
	await f.wait(500);
	await f.tapText("Clear");
	await f.hidden({ text: "Clear" });
	await f.wait(600);
});
