// pressable previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("pressable/named-feedback", async (f) => {
	// Pressing and holding each card, so each feedback reads in turn
	await f.longPress("feedback-scale", 450);
	await f.wait(200);
	await f.longPress("feedback-fade", 450);
	await f.wait(200);
	await f.longPress("feedback-scale-fade", 450);
	await f.wait(200);
	await f.longPress("feedback-none", 450);
});

capture("pressable/haptics");

capture("pressable/as-child");
