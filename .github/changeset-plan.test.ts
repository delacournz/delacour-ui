import { describe, expect, test } from "bun:test";
import { isReleaseCommit, planRelease, RELEASE_TITLE } from "./changeset-plan";

const PENDING = ["README.md", "config.json", "add-meter.md"];
const CONSUMED = ["README.md", "config.json"];
const FEATURE = "✨ feat(react-native-ui): add Meter (#140)";
const DOCS = "📝 docs: fix a typo (#142)";
const RELEASE_MERGE = `${RELEASE_TITLE} (#141)`;

describe("isReleaseCommit", () => {
	test("matches the release pull request's own commit", () => {
		expect(isReleaseCommit(RELEASE_TITLE)).toBe(true);
	});

	test("matches the squash merge, which GitHub suffixes with the pull request number", () => {
		expect(isReleaseCommit(RELEASE_MERGE)).toBe(true);
	});

	test("does not match a commit that only mentions a release", () => {
		expect(isReleaseCommit("📝 docs: explain 🔖 chore(release): version packages")).toBe(false);
		expect(isReleaseCommit(`${RELEASE_TITLE} and more`)).toBe(false);
	});
});

describe("planRelease", () => {
	test("opens or updates the release pull request while changesets are pending", () => {
		expect(planRelease({ entries: PENDING, subject: FEATURE, unreleased: [FEATURE], isTip: true })).toEqual({
			mode: "version",
			reason: "changesets are pending",
		});
	});

	test("publishes when the release pull request has just been merged", () => {
		expect(
			planRelease({ entries: CONSUMED, subject: RELEASE_MERGE, unreleased: [RELEASE_MERGE], isTip: true }).mode
		).toBe("publish");
	});

	test("does nothing for a merge with no changeset once every release has reached main", () => {
		expect(planRelease({ entries: CONSUMED, subject: DOCS, unreleased: [DOCS], isTip: true }).mode).toBe("none");
	});

	test("a release commit that still carries changesets is not a release", () => {
		expect(
			planRelease({ entries: PENDING, subject: RELEASE_MERGE, unreleased: [RELEASE_MERGE], isTip: true }).mode
		).toBe("version");
	});

	test("does not version again from a commit develop has moved past", () => {
		const plan = planRelease({ entries: PENDING, subject: FEATURE, unreleased: [FEATURE], isTip: false });
		expect(plan.mode).toBe("none");
		expect(plan.reason).toContain("no longer develop's tip");
	});

	test("resumes a release whose commit is on develop but never reached main", () => {
		const plan = planRelease({ entries: CONSUMED, subject: DOCS, unreleased: [DOCS, RELEASE_TITLE], isTip: true });
		expect(plan.mode).toBe("publish");
		expect(plan.reason).toContain("never reached main");
	});

	test("still publishes on a re-run of the release commit after main has taken it", () => {
		expect(planRelease({ entries: CONSUMED, subject: RELEASE_MERGE, unreleased: [], isTip: false }).mode).toBe(
			"publish"
		);
	});
});

describe("release.yml", () => {
	const workflow = Bun.file(new URL("./workflows/release.yml", import.meta.url)).text();
	const input = async (name: string) =>
		[...(await workflow).matchAll(new RegExp(`^\\s+${name}: (.+)$`, "gm"))].map((match) => match[1]);

	test("titles the release pull request and its commit with RELEASE_TITLE", async () => {
		expect(await input("pr-title")).toEqual([JSON.stringify(RELEASE_TITLE)]);
		expect(await input("commit-message")).toEqual([JSON.stringify(RELEASE_TITLE)]);
	});

	test("uses the input names changesets/action v2 accepts, which fails the job on a v1 name", async () => {
		expect(await input("version-script")).toEqual(["bun .github/changeset-version.ts"]);
		for (const renamed of ["version", "title", "commit", "publish"]) {
			expect(await input(renamed)).toEqual([]);
		}
	});
});
