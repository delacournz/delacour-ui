// questionnaire previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("questionnaire/basic", async (f) => {
	// Changing the answer and moving on
	await f.tap("survey-role-engineering");
	await f.wait(500);
	await f.tap("survey-next");
	await f.visible({ id: "survey-tools-figma" });
	await f.wait(600);
	// Ticking and unticking a tool, so the second question is left as it was found
	await f.tap("survey-tools-figma");
	await f.wait(500);
	await f.tap("survey-tools-figma");
	await f.wait(400);
	// Back to the first question, and the original answer, so the clip loops
	await f.tap("survey-back");
	await f.visible({ id: "survey-role-design" });
	await f.wait(500);
	await f.tap("survey-role-design");
	await f.wait(400);
});

capture("questionnaire/progress-variants");

capture("questionnaire/conditional", async (f) => {
	// Answering No hides the follow-up, and the count drops
	await f.tap("pets-pets-no");
	await f.wait(700);
	await f.tap("pets-pets-yes");
	await f.wait(500);
	// Into the follow-up, where choosing Dog reveals one more question
	await f.tap("pets-next");
	await f.visible({ id: "pets-which-dog" });
	await f.wait(500);
	await f.tap("pets-which-dog");
	await f.wait(700);
	await f.tap("pets-which-dog");
	await f.wait(400);
	// Back to the start, as the clip began
	await f.tap("pets-back");
	await f.visible({ id: "pets-pets-yes" });
	await f.wait(400);
});

capture("questionnaire/text-and-scale", async (f) => {
	// Moving along the scale
	await f.tap("nps-recommend-3");
	await f.wait(450);
	await f.tap("nps-recommend-10");
	await f.wait(450);
	await f.tap("nps-recommend-8");
	await f.wait(450);
	// On to the text question and back, ending where it began
	await f.tap("nps-next");
	await f.visible({ id: "nps-why" });
	await f.wait(700);
	await f.tap("nps-back");
	await f.visible({ id: "nps-recommend-8" });
	await f.wait(400);
});

capture("questionnaire/unframed-in-sheet", async (f) => {
	// Opening the sheet
	await f.tap("questionnaire-open-sheet");
	await f.visible({ id: "cancel-reason-price" });
	await f.wait(600);
	// Answering, moving on and coming back
	await f.tap("cancel-reason-price");
	await f.wait(400);
	await f.tap("cancel-next");
	await f.visible({ id: "cancel-return-yes" });
	await f.wait(600);
	await f.tap("cancel-back");
	await f.visible({ id: "cancel-reason-price" });
	await f.wait(500);
	// Closing it, so the clip ends on the trigger it began with
	await f.tap("questionnaire-close-sheet");
	await f.hidden({ id: "cancel-reason-price" });
	await f.wait(500);
});
