import { describe, expect, test } from "bun:test";
import { isReleaseCommit, planRelease, RELEASE_TITLE } from "./changeset-plan";

describe("isReleaseCommit", () => {
	test("matches the release pull request's own commit", () => {
		expect(isReleaseCommit(RELEASE_TITLE)).toBe(true);
	});

	test("matches the squash merge, which GitHub suffixes with the pull request number", () => {
		expect(isReleaseCommit(`${RELEASE_TITLE} (#141)`)).toBe(true);
	});

	test("does not match a commit that only mentions a release", () => {
		expect(isReleaseCommit("📝 docs: explain 🔖 chore(release): version packages")).toBe(false);
		expect(isReleaseCommit(`${RELEASE_TITLE} and more`)).toBe(false);
	});
});

describe("planRelease", () => {
	test("opens or updates the release pull request while changesets are pending", () => {
		expect(
			planRelease({ entries: ["README.md", "add-meter.md"], subject: "✨ feat(react-native-ui): add Meter (#140)" })
		).toBe("version");
	});

	test("publishes when the release pull request has just been merged", () => {
		expect(planRelease({ entries: ["README.md", "config.json"], subject: `${RELEASE_TITLE} (#141)` })).toBe("publish");
	});

	test("does nothing for a merge with no changeset that is not a release", () => {
		expect(planRelease({ entries: ["README.md", "config.json"], subject: "📝 docs: fix a typo (#142)" })).toBe("none");
	});

	test("a release commit that still carries changesets is not a release", () => {
		expect(planRelease({ entries: ["add-meter.md"], subject: `${RELEASE_TITLE} (#141)` })).toBe("version");
	});
});
