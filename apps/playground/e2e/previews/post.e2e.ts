// post previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("post/feed-card", async (f) => {
	// Liking the post, then saving it
	await f.tap("post-like");
	await f.wait(700);
	await f.tap("post-save");
	await f.wait(900);
	// And clearing both, so the clip loops without a jump cut
	await f.tap("post-like");
	await f.wait(700);
	await f.tap("post-save");
});

capture("post/vote", async (f) => {
	// Upvoting, then switching to a downvote
	await f.tap("post-vote-up");
	await f.wait(800);
	await f.tap("post-vote-down");
	await f.wait(800);
	// Tapping the cast arrow again clears it, so the clip loops without a jump cut
	await f.tap("post-vote-down");
});

capture("post/compact-timeline");

capture("post/media-first");

capture("post/live-counts", async (f) => {
	// Lighting each stat, so every count rolls up
	await f.tap("post-like");
	await f.wait(500);
	await f.tap("post-repost");
	await f.wait(500);
	await f.tap("post-save");
	await f.wait(900);
	// And clearing them, so the counts roll back down and the clip loops
	await f.tap("post-like");
	await f.wait(500);
	await f.tap("post-repost");
	await f.wait(500);
	await f.tap("post-save");
});

capture("post/expandable-body", async (f) => {
	// Opening the clamped body
	await f.tap("post-body-more");
	await f.wait(1400);
	// And closing it, so the clip loops without a jump cut
	await f.tap("post-body-more");
});
