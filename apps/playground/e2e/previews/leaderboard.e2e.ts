// leaderboard previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("leaderboard/bars");

capture("leaderboard/cards");

capture("leaderboard/ascending-times");

capture("leaderboard/highlight-pinned");

capture("leaderboard/movement");

capture("leaderboard/pressable", async (f) => {
	// Picking the leader, then second, then a row
	await f.longPress("leaderboard-pressable-podium-place-1", 200);
	await f.wait(600);
	await f.longPress("leaderboard-pressable-podium-place-2", 200);
	await f.wait(600);
	await f.longPress("leaderboard-pressable-row-rawiri", 200);
	await f.wait(700);
	// Tapping the picked row again clears it, so the clip loops without a jump cut
	await f.longPress("leaderboard-pressable-row-rawiri", 200);
});
