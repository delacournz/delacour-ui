import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	nextVersion,
	type PendingChangeset,
	parseChangelog,
	parseChangeset,
	RELEASE_PACKAGES,
	releaseUrl,
	renderOverview,
	renderPackageNotes,
} from "./release-notes";

const ROOT = join(import.meta.dirname, "../../../..");
const NAMES = RELEASE_PACKAGES.map((p) => p.name);
const UI = RELEASE_PACKAGES[0];

const CHANGELOG = `# @delacour/react-native-ui

## 0.7.0

### Minor Changes

- [#320](https://github.com/delacournz/delacour-ui/pull/320) [\`5608867\`](https://github.com/delacournz/delacour-ui/commit/5608867) Thanks [@someone](https://github.com/someone)! - \`DatePicker\` takes \`defaultMonth\`.

### Patch Changes

- [#319](https://github.com/delacournz/delacour-ui/pull/319) [\`f9beba7\`](https://github.com/delacournz/delacour-ui/commit/f9beba7) Thanks [@someone](https://github.com/someone)! - \`Avatar\` falls back.

  A second paragraph.

- Updated dependencies [abc]:
  - delacour@0.7.0

## 0.6.0

No changes in this release.
`;

describe("parseChangelog", () => {
	const releases = parseChangelog(CHANGELOG);

	test("reads versions newest first", () => {
		expect(releases.map((r) => r.version)).toEqual(["0.7.0", "0.6.0"]);
	});

	test("keeps the PR link and drops the commit and the thanks", () => {
		expect(releases[0].sections[0]).toEqual({
			kind: "minor",
			entries: ["- [#320](https://github.com/delacournz/delacour-ui/pull/320) `DatePicker` takes `defaultMonth`."],
		});
	});

	test("keeps continuation paragraphs and drops dependency bumps", () => {
		expect(releases[0].sections[1].entries).toEqual([
			"- [#319](https://github.com/delacournz/delacour-ui/pull/319) `Avatar` falls back.\n\n  A second paragraph.",
		]);
	});

	test("keeps a version with no changes of its own, empty", () => {
		expect(releases[1].sections).toEqual([]);
	});
});

describe("parseChangeset", () => {
	test("reads every published package it bumps", () => {
		const source = `---\n"@delacour/react-native-ui": patch\ndelacour: minor\n"@delacour/web": patch\n---\n\nBody.\n`;
		expect(parseChangeset(source, NAMES)).toEqual({
			bumps: [
				{ name: "@delacour/react-native-ui", kind: "patch" },
				{ name: "delacour", kind: "minor" },
			],
			body: "Body.",
		});
	});

	test("ignores one that bumps no published package", () => {
		expect(parseChangeset(`---\n"@delacour/web": patch\n---\n\nBody.\n`, NAMES)).toBeUndefined();
		expect(parseChangeset("no frontmatter", NAMES)).toBeUndefined();
	});
});

describe("nextVersion", () => {
	const of = (kind: "major" | "minor" | "patch"): PendingChangeset => ({
		bumps: [{ name: "delacour", kind }],
		body: "",
	});

	test("takes the largest pending bump", () => {
		expect(nextVersion("0.7.0", [of("patch")])).toBe("0.7.1");
		expect(nextVersion("0.7.0", [of("patch"), of("minor")])).toBe("0.8.0");
		expect(nextVersion("0.7.3", [of("major")])).toBe("1.0.0");
		expect(nextVersion("0.7.0", [])).toBeUndefined();
	});
});

describe("releaseUrl", () => {
	test("links the shared tag from 0.6.0 and the per-package tag before it", () => {
		expect(releaseUrl("delacour", "0.7.0")).toBe("https://github.com/delacournz/delacour-ui/releases/tag/v0.7.0");
		expect(releaseUrl("@delacour/react-native-ui", "0.5.0")).toBe(
			"https://github.com/delacournz/delacour-ui/releases/tag/%40delacour%2Freact-native-ui%400.5.0"
		);
		expect(releaseUrl("delacour", "0.1.0-alpha.5")).toBeUndefined();
	});
});

describe("renderPackageNotes", () => {
	const pending = [parseChangeset(`---\n"@delacour/react-native-ui": patch\n---\n\nSlot throws.\n`, NAMES)].flatMap(
		(p) => (p ? [p] : [])
	);
	const page = renderPackageNotes({ pkg: UI, releases: parseChangelog(CHANGELOG), pending, next: "0.7.1" });

	test("puts Unreleased first, with the version it ships as", () => {
		expect(page).toContain("## Unreleased\n\nMerged into `develop`, shipping as `0.7.1`");
		expect(page.indexOf("## Unreleased")).toBeLessThan(page.indexOf("## 0.7.0"));
		expect(page).toContain("### Patch changes\n\n- Slot throws.");
	});

	test("links each release and explains an empty one", () => {
		expect(page).toContain("[GitHub release](https://github.com/delacournz/delacour-ui/releases/tag/v0.7.0)");
		expect(page).toContain("## 0.6.0");
		expect(page).toContain("No changes to this package.");
	});

	test("has frontmatter with the package's icon", () => {
		expect(page.startsWith("---\ntitle: UI release notes\n")).toBe(true);
		expect(page).toContain("icon: Component");
	});
});

describe("renderOverview", () => {
	test("shows the latest release across packages, grouped by package", () => {
		const page = renderOverview({
			packages: [
				{ pkg: UI, releases: parseChangelog(CHANGELOG) },
				{ pkg: RELEASE_PACKAGES[2], releases: parseChangelog("## 0.7.0\n\nNo changes in this release.\n") },
			],
			pending: [],
		});
		expect(page).toContain("the latest is `0.7.0`");
		expect(page).toContain("## 0.7.0");
		expect(page).toContain("### UI\n\n#### Minor changes");
		expect(page).not.toContain("### Charts");
		expect(page).not.toContain("## Unreleased");
	});
});

/** The real changelogs, so a Changesets format change shows up here rather than as a blank page. */
describe("the repository's changelogs", () => {
	test("every published package has a changelog whose newest version matches its package.json", () => {
		for (const pkg of RELEASE_PACKAGES) {
			const releases = parseChangelog(readFileSync(join(ROOT, pkg.dir, "CHANGELOG.md"), "utf8"));
			const { version, name } = JSON.parse(readFileSync(join(ROOT, pkg.dir, "package.json"), "utf8"));
			expect(name).toBe(pkg.name);
			expect(releases[0]?.version).toBe(version);
		}
	});

	test("the published set is the fixed group", () => {
		const config = JSON.parse(readFileSync(join(ROOT, ".changeset/config.json"), "utf8"));
		expect([...config.fixed[0]].sort()).toEqual([...NAMES].sort());
	});
});
