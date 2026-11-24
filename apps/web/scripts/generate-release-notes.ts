/**
 * Writes the release notes pages under `content/docs/native/releases/` — `index.md` (the overview)
 * and one `<slug>.md` per published package — from each package's `CHANGELOG.md` and the pending
 * `.changeset/*.md` files (see `src/lib/release-notes.ts`). Run by `bun run release-notes`, which
 * `dev` and `build` run first (see package.json). The pages are gitignored.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	nextVersion,
	type PendingChangeset,
	parseChangelog,
	parseChangeset,
	RELEASE_PACKAGES,
	renderOverview,
	renderPackageNotes,
} from "../src/lib/release-notes";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../..");
const CHANGESETS = join(ROOT, ".changeset");
const OUT = join(HERE, "../content/docs/native/releases");
const NAMES = RELEASE_PACKAGES.map((p) => p.name);

const pending = readdirSync(CHANGESETS)
	.filter((file) => file.endsWith(".md") && file !== "README.md")
	.sort()
	.flatMap((file): PendingChangeset[] => {
		const changeset = parseChangeset(readFileSync(join(CHANGESETS, file), "utf8"), NAMES);
		return changeset ? [changeset] : [];
	});

const packages = RELEASE_PACKAGES.map((pkg) => ({
	pkg,
	releases: parseChangelog(readFileSync(join(ROOT, pkg.dir, "CHANGELOG.md"), "utf8")),
}));

const current: string = JSON.parse(readFileSync(join(ROOT, "packages/cli/package.json"), "utf8")).version;
const next = nextVersion(current, pending);

writeFileSync(join(OUT, "index.md"), renderOverview({ packages, pending, next }));
for (const { pkg, releases } of packages) {
	writeFileSync(join(OUT, `${pkg.slug}.md`), renderPackageNotes({ pkg, releases, pending, next }));
}

console.log(
	`release notes: ${packages.map(({ pkg, releases }) => `${pkg.title} ${releases.length}`).join(", ")}; ${pending.length} pending → ${OUT}`
);
