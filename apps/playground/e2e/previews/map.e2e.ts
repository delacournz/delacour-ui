// map previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("map/places", async (f) => {
	// Selecting each place in turn
	await f.tap("map-places-gardens-content");
	await f.wait(800);
	await f.tap("map-places-market-content");
	await f.wait(800);
	// And the Museum again, so the clip loops without a jump cut
	await f.tap("map-places-museum-content");
	await f.wait(600);
});

capture("map/route");

capture("map/arcs");

capture("map/popup", async (f) => {
	// Closing the café's card from its own button
	await f.tap("map-popup-cafe-close");
	await f.wait(900);
	// And opening it again, so the clip loops without a jump cut
	await f.tap("map-popup-cafe-content");
	await f.wait(900);
});

capture("map/controls");

capture("map/fly-to");
