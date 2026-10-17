// chip previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("chip/filter-row", async (f) => {
	// Adding Burgers and World food, and watching the count follow
	await f.tap("filter-burgers");
	await f.wait(450);
	await f.tap("filter-world");
	await f.wait(800);
	// Taking them off again, so the clip loops without a jump cut
	await f.tap("filter-world");
	await f.wait(450);
	await f.tap("filter-burgers");
});

capture("chip/variants-and-colours");

capture("chip/sizes", async (f) => {
	// Selecting Small and Large, so every size shows both states
	await f.tap("size-sm");
	await f.wait(450);
	await f.tap("size-lg");
	await f.wait(800);
	// And clearing them again, so the clip loops without a jump cut
	await f.tap("size-lg");
	await f.wait(450);
	await f.tap("size-sm");
});

capture("chip/removable", async (f) => {
	// Removing Reanimated, a selected chip — its remove control never toggles it
	await f.tap("topic-1-close");
	await f.wait(600);
	// The row reflows, so Expo is now at index 3
	await f.tap("topic-3-close");
	await f.wait(700);
	// Reset brings all six back, selection intact, so the clip loops
	await f.tap("reset-topics");
	await f.hidden({ id: "reset-topics" });
});

capture("chip/with-content");
