// scroll-header previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("scroll-header/large-title-list", async (f) => {
	// Scrolling the list up — the large title leaves and the bar's own title fades in with its surface
	await f.swipe({ id: "scroll-header-list" }, { y: -0.3 }, { durationMs: 1400, momentum: false });
	await f.wait(800);
	// And back to the top, where the large title returns, so the clip loops without a jump cut
	await f.swipe({ id: "scroll-header-list" }, { y: 0.35 }, { durationMs: 1400, momentum: false });
	await f.wait(800);
});

capture("scroll-header/cover", async (f) => {
	// Pulling down past the top — the cover stretches from its top edge, then springs back
	await f.swipe({ id: "scroll-header-cover" }, { y: 0.15 }, { durationMs: 900, momentum: false });
	await f.wait(700);
	// Scrolling up — the cover leaves with the content and the bar takes over
	await f.swipe({ id: "scroll-header-cover" }, { y: -0.3 }, { durationMs: 1200, momentum: false });
	await f.wait(700);
	// And back to rest, so the clip loops
	await f.swipe({ id: "scroll-header-cover" }, { y: 0.35 }, { durationMs: 1200, momentum: false });
	await f.wait(700);
});

capture("scroll-header/blur-bar", async (f) => {
	// Scrolling the tiles up under the bar — it frosts in as the title hands over
	await f.swipe({ id: "scroll-header-blur" }, { y: -0.3 }, { durationMs: 1400, momentum: false });
	await f.wait(800);
	// And back to the top, so the clip loops without a jump cut
	await f.swipe({ id: "scroll-header-blur" }, { y: 0.35 }, { durationMs: 1400, momentum: false });
	await f.wait(800);
});

capture("scroll-header/react-to-collapse", async (f) => {
	// Scrolling up — the avatar grows into the bar with progress, and the compact Follow arrives once collapsed
	await f.swipe({ id: "scroll-header-profile" }, { y: -0.3 }, { durationMs: 1400, momentum: false });
	await f.wait(900);
	// And back to rest, where both leave again, so the clip loops
	await f.swipe({ id: "scroll-header-profile" }, { y: 0.35 }, { durationMs: 1400, momentum: false });
	await f.wait(900);
});
