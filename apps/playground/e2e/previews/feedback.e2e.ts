// feedback previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("feedback/basic", { types: true }, async (f) => {
	// Opening the feedback dialog
	await f.tap("feedback-basic-open");
	await f.visible({ id: "feedback-basic-field" });
	await f.wait(700);
	// Typing into the well; Send enables with the first character
	await f.tap("feedback-basic-field");
	await f.wait(900);
	await f.type("feedback-basic-field", "The export button is hard to find");
	await f.wait(900);
	// Sending closes it
	await f.tap("feedback-basic-send");
	await f.hidden({ id: "feedback-basic-field" });
	await f.wait(500);
});

capture("feedback/sending", { types: true }, async (f) => {
	// Opening the dialog and writing a report
	await f.tap("feedback-sending-open");
	await f.visible({ id: "feedback-sending-field" });
	await f.wait(600);
	await f.tap("feedback-sending-field");
	await f.wait(800);
	await f.type("feedback-sending-field", "Checkout froze on the last step");
	await f.wait(600);
	// Send spins and the field is read-only until the promise settles, then the dialog closes and clears
	await f.tap("feedback-sending-send");
	await f.hidden({ id: "feedback-sending-field" });
	await f.wait(600);
});

capture("feedback/multi-step", async (f) => {
	// Opening on the rating step
	await f.tap("feedback-steps-open");
	await f.visible({ id: "feedback-steps-rating" });
	await f.wait(700);
	// Rating, then moving on; the well eases to the message step's height
	await f.tap("feedback-steps-rating");
	await f.wait(600);
	await f.tap("feedback-steps-next");
	await f.visible({ id: "feedback-steps-field" });
	await f.wait(900);
	// Sending without a message lands on thanks
	await f.tap("feedback-steps-send");
	await f.visible({ id: "feedback-steps-done" });
	await f.wait(1200);
	// Done closes it and resets the rating, so the next open starts over
	await f.tap("feedback-steps-done");
	await f.hidden({ id: "feedback-steps-done" });
	await f.wait(500);
});

capture("feedback/with-chips", async (f) => {
	// Opening the dialog
	await f.tap("feedback-chips-open");
	await f.visible({ id: "feedback-chips-slow" });
	await f.wait(700);
	// Picking two chips; Send opens with the first
	await f.tap("feedback-chips-slow");
	await f.wait(600);
	await f.tap("feedback-chips-confusing");
	await f.wait(900);
	// Sending closes it and clears the chips
	await f.tap("feedback-chips-send");
	await f.hidden({ id: "feedback-chips-slow" });
	await f.wait(500);
});
