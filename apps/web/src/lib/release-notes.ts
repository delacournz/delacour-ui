/**
 * The release notes pages, built from Changesets: released versions come from each published
 * package's `CHANGELOG.md`, and the changesets still waiting in `.changeset/` show as Unreleased
 * (so staging, built from `develop`, previews the next release). `scripts/generate-release-notes.ts`
 * writes the results under `content/docs/native/releases/`; this module only transforms text.
 *
 * Ported from warden's `apps/docs/src/lib/release-notes.ts`, widened from one package to the four
 * in the `fixed` group.
 */
import { gitConfig } from "./shared";

export type BumpKind = "major" | "minor" | "patch";

export type ReleaseSection = { kind: BumpKind; entries: string[] };

export type Release = { version: string; sections: ReleaseSection[] };

/** One package's bump in a pending changeset. A changeset can name several packages. */
export type PendingChangeset = { bumps: { name: string; kind: BumpKind }[]; body: string };

/** A published package, and the page its notes render to. */
export type ReleasePackage = {
	/** The npm name, as a changeset's frontmatter spells it. */
	name: string;
	/** The page's file name and URL segment under `/docs/native/releases/`. */
	slug: string;
	/** The sidebar label. */
	title: string;
	/** Lucide icon for the sidebar. */
	icon: string;
	/** The workspace folder, relative to the repository root. */
	dir: string;
	/** One sentence on what the package is, for the page's lede. */
	summary: string;
};

/** The `fixed` group in `.changeset/config.json`, in sidebar order. */
export const RELEASE_PACKAGES: readonly ReleasePackage[] = [
	{
		name: "@delacour/react-native-ui",
		slug: "react-native-ui",
		title: "UI",
		icon: "Component",
		dir: "packages/react-native-ui",
		summary: "The component library.",
	},
	{
		name: "delacour",
		slug: "cli",
		title: "CLI",
		icon: "SquareTerminal",
		dir: "packages/cli",
		summary: "The CLI that copies components into your app.",
	},
	{
		name: "@delacour/react-native-charts",
		slug: "react-native-charts",
		title: "Charts",
		icon: "ChartLine",
		dir: "packages/react-native-charts",
		summary: "The headless charting engine `Chart` is built on.",
	},
	{
		name: "@delacour/react-native-bottom-sheet",
		slug: "react-native-bottom-sheet",
		title: "Bottom Sheet",
		icon: "PanelBottom",
		dir: "packages/react-native-bottom-sheet",
		summary: "The headless bottom sheet engine `BottomSheet` is built on.",
	},
];

/** The version the four packages first released together, under one `vX.Y.Z` tag. */
const FIXED_SINCE = "0.6.0";

const KINDS: readonly BumpKind[] = ["major", "minor", "patch"];

const HEADINGS: Record<BumpKind, string> = {
	major: "Breaking changes",
	minor: "Minor changes",
	patch: "Patch changes",
};

const repoUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

/** `- [#74](url) [\`sha\`](url) Thanks [@who](url)! - body`, as `@changesets/changelog-github` writes it. */
const ENTRY =
	/^- (\[#\d+\]\([^)]+\))?\s*(?:\[`[0-9a-f]+`\]\([^)]+\))?\s*(?:Thanks \[@[^\]]+\]\([^)]+\)! )?- ([\s\S]*)$/;

function kindOf(heading: string): BumpKind | undefined {
	return KINDS.find((kind) => heading.toLowerCase().startsWith(kind));
}

/** Split a section body into its top-level list items, each with its indented continuation lines. */
function listItems(lines: readonly string[]): string[] {
	const items: string[][] = [];
	for (const line of lines) {
		if (line.startsWith("- ")) items.push([line]);
		else if (items.length > 0) items[items.length - 1].push(line);
	}
	return items.map((item) => item.join("\n").trimEnd());
}

/** One changelog item as a list item of the page: PR link kept, commit and thanks dropped. */
function cleanEntry(item: string): string | undefined {
	if (item.startsWith("- Updated dependencies")) return undefined;
	const match = ENTRY.exec(item);
	if (!match) return item;

	const [, pr, body] = match;
	if (!pr) return `- ${body}`;
	const bulleted = body.startsWith("- ");
	if (bulleted && /\n {2}- /.test(body)) return `- ${pr}\n  ${body}`;
	return `- ${pr} ${bulleted ? body.slice(2) : body}`;
}

/**
 * The versions in one package's `CHANGELOG.md`, newest first, without dependency-bump noise. A
 * version with nothing of its own (it moved with the fixed group) is kept with no sections.
 */
export function parseChangelog(changelog: string): Release[] {
	const releases: Release[] = [];
	let release: Release | undefined;
	let section: { kind: BumpKind; lines: string[] } | undefined;

	const closeSection = () => {
		if (!release || !section) return;
		const entries = listItems(section.lines).flatMap((item) => cleanEntry(item) ?? []);
		if (entries.length > 0) release.sections.push({ kind: section.kind, entries });
		section = undefined;
	};

	for (const line of changelog.split(/\r?\n/)) {
		const version = /^## (\S+)/.exec(line);
		if (version) {
			closeSection();
			release = { version: version[1], sections: [] };
			releases.push(release);
			continue;
		}
		const heading = /^### (.+)/.exec(line);
		if (heading) {
			closeSection();
			const kind = kindOf(heading[1]);
			if (kind) section = { kind, lines: [] };
			continue;
		}
		section?.lines.push(line);
	}
	closeSection();

	return releases;
}

/** A `.changeset/*.md` file's bumps and body; undefined when it bumps none of `names`. */
export function parseChangeset(source: string, names: readonly string[]): PendingChangeset | undefined {
	const match = /^---\r?\n([\s\S]*?)\r?\n?---\r?\n([\s\S]*)$/.exec(source);
	if (!match) return undefined;

	const bumps = match[1].split(/\r?\n/).flatMap((line) => {
		const bump = /^\s*["']?([^"':]+)["']?\s*:\s*(major|minor|patch)\s*$/.exec(line);
		if (!bump || !names.includes(bump[1])) return [];
		return [{ name: bump[1], kind: bump[2] as BumpKind }];
	});
	if (bumps.length === 0) return undefined;

	return { bumps, body: match[2].trim() };
}

/** The version the pending changesets ship as. The four packages are `fixed`, so one bump moves all. */
export function nextVersion(current: string, pending: readonly PendingChangeset[]): string | undefined {
	const kinds = new Set(pending.flatMap((p) => p.bumps.map((b) => b.kind)));
	const kind = KINDS.find((k) => kinds.has(k));
	if (!kind) return undefined;

	const [major, minor, patch] = current.split("-")[0].split(".").map(Number);
	if (kind === "major") return `${major + 1}.0.0`;
	if (kind === "minor") return `${major}.${minor + 1}.0`;
	return `${major}.${minor}.${patch + 1}`;
}

function isPrerelease(version: string): boolean {
	return version.includes("-");
}

function compareCore(a: string, b: string): number {
	const pa = a.split("-")[0].split(".").map(Number);
	const pb = b.split("-")[0].split(".").map(Number);
	for (let i = 0; i < 3; i++) {
		if (pa[i] !== pb[i]) return pa[i] - pb[i];
	}
	return 0;
}

/**
 * The GitHub Release a version was published under. From `FIXED_SINCE` the four packages share
 * one `vX.Y.Z` release; before that each had its own `name@version`. Prereleases are left
 * unlinked — several went out under the deprecated unscoped names.
 */
export function releaseUrl(name: string, version: string): string | undefined {
	if (isPrerelease(version)) return undefined;
	const tag = compareCore(version, FIXED_SINCE) >= 0 ? `v${version}` : `${name}@${version}`;
	return `${repoUrl}/releases/tag/${encodeURIComponent(tag)}`;
}

/** A pending changeset's body as list items: bulleted bodies stay as they are. */
function pendingEntry(body: string): string {
	return body.startsWith("- ") ? body : `- ${body.replace(/\n/g, "\n  ")}`;
}

/** The pending changesets that bump `name`, as sections. */
function pendingSections(name: string, pending: readonly PendingChangeset[]): ReleaseSection[] {
	return pending.flatMap((p) => {
		const bump = p.bumps.find((b) => b.name === name);
		return bump ? [{ kind: bump.kind, entries: [pendingEntry(p.body)] }] : [];
	});
}

function renderSections(sections: readonly ReleaseSection[], level: "###" | "####"): string[] {
	return KINDS.flatMap((kind) => {
		const entries = sections.filter((s) => s.kind === kind).flatMap((s) => s.entries);
		return entries.length > 0 ? [`${level} ${HEADINGS[kind]}`, entries.join("\n\n")] : [];
	});
}

function frontmatter(fields: { title: string; description: string; icon: string }): string {
	return ["---", `title: ${fields.title}`, `description: ${fields.description}`, `icon: ${fields.icon}`, "---"].join(
		"\n"
	);
}

function unreleasedLede(next: string | undefined): string {
	return next
		? `Merged into \`develop\`, shipping as \`${next}\` in the next release. Try it now from the \`alpha\` tag.`
		: "Merged into `develop`, shipping in the next release.";
}

/** One package's page: every version it shipped, newest first, frontmatter included. */
export function renderPackageNotes({
	pkg,
	releases,
	pending,
	next,
}: {
	pkg: ReleasePackage;
	releases: readonly Release[];
	pending: readonly PendingChangeset[];
	next?: string;
}): string {
	const parts = [
		frontmatter({
			title: `${pkg.title} release notes`,
			description: `What changed in each release of ${pkg.name}, from the changesets that shipped it.`,
			icon: pkg.icon,
		}),
		`Every version of \`${pkg.name}\`. ${pkg.summary} It shares one version with the other Delacour packages — see [Release channels](/docs/native/releases/channels).`,
	];

	const unreleased = pendingSections(pkg.name, pending);
	if (unreleased.length > 0) {
		parts.push("## Unreleased", unreleasedLede(next), ...renderSections(unreleased, "###"));
	}

	for (const release of releases) {
		parts.push(`## ${release.version}`);
		const url = releaseUrl(pkg.name, release.version);
		if (url) parts.push(`[GitHub release](${url})`);
		parts.push(
			...(release.sections.length > 0
				? renderSections(release.sections, "###")
				: ["No changes to this package. It moved to keep the four versions in step."])
		);
	}

	return `${parts.join("\n\n")}\n`;
}

/**
 * The overview page: what is pending and what the latest release shipped, across every package,
 * plus a link to each package's full history.
 */
export function renderOverview({
	packages,
	pending,
	next,
}: {
	packages: readonly { pkg: ReleasePackage; releases: readonly Release[] }[];
	pending: readonly PendingChangeset[];
	next?: string;
}): string {
	const latest = packages
		.flatMap(({ releases }) => releases.map((r) => r.version))
		.filter((v) => !isPrerelease(v))
		.sort(compareCore)
		.at(-1);

	const parts = [
		frontmatter({
			title: "Release notes",
			description: "What is shipping next and what the latest release changed, across every Delacour package.",
			icon: "ScrollText",
		}),
		[
			`The CLI, the component library and both engines share one version${latest ? ` — the latest is \`${latest}\`` : ""}. Each package's full history is on its own page:`,
			"",
			...packages.map(({ pkg }) => `- [${pkg.title}](/docs/native/releases/${pkg.slug}) — \`${pkg.name}\``),
			"",
			"How a change reaches npm, and how to try it before it is released: [Release channels](/docs/native/releases/channels).",
		].join("\n"),
	];

	const unreleased = packages.flatMap(({ pkg }) => {
		const sections = pendingSections(pkg.name, pending);
		return sections.length > 0 ? [`### ${pkg.title}`, ...renderSections(sections, "####")] : [];
	});
	if (unreleased.length > 0) parts.push("## Unreleased", unreleasedLede(next), ...unreleased);

	if (latest) {
		const shipped = packages.flatMap(({ pkg, releases }) => {
			const release = releases.find((r) => r.version === latest);
			return release && release.sections.length > 0
				? [`### ${pkg.title}`, ...renderSections(release.sections, "####")]
				: [];
		});
		parts.push(`## ${latest}`);
		const url = releaseUrl(packages[0]?.pkg.name ?? "", latest);
		if (url) parts.push(`[GitHub release](${url})`);
		parts.push(...(shipped.length > 0 ? shipped : ["No changes."]));
	}

	return `${parts.join("\n\n")}\n`;
}
