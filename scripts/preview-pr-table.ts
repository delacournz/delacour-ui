/**
 * The before/after table of a branch's recaptured preview media, for a pull request body.
 *
 *     bun run previews:pr-table                      # HEAD against its merge base with origin/develop
 *     bun run previews:pr-table -- --base origin/main
 *
 * Previews are committed, so they need no `assets/` branch: the head commit already carries them.
 * Each image is a `raw.githubusercontent.com` URL pinned to a full commit SHA — the base's copy on
 * the left, the head's on the right. A SHA never moves, so GitHub's camo cache can never serve a
 * picture the URL no longer names (see "Pull request screenshots" in `apps/web/AGENTS.md`). A clip
 * is its poster plus a link: a body renders an image from a raw URL but will not play an mp4.
 *
 * The SHAs must be on GitHub before the body renders, so push first. Prints nothing when no media
 * changed.
 */

import { $ } from "bun";

const MEDIA = "apps/web/public/previews/";
const THEMES = ["light", "dark"] as const;
const WIDTH = 320;

type Theme = (typeof THEMES)[number];

export type MediaChange = { path: string; status: "added" | "modified" | "deleted" };

function statusOf(code: string): MediaChange["status"] {
	if (code === "A") return "added";
	if (code === "D") return "deleted";
	return "modified";
}

/** One `--name-status` line → its changes. A rename is a delete and an add. */
function changesOf(line: string): MediaChange[] {
	const [code, first, second] = line.split("\t");
	if (code === undefined || first === undefined) return [];
	if (code.startsWith("R") && second !== undefined) {
		return [
			{ path: first, status: "deleted" },
			{ path: second, status: "added" },
		];
	}
	return [{ path: first, status: statusOf(code) }];
}

/** `git diff --name-status` output → the preview media it names. */
export function parseNameStatus(output: string): MediaChange[] {
	return output
		.split("\n")
		.flatMap(changesOf)
		.filter((change) => isMedia(change.path));
}

function isMedia(path: string): boolean {
	return path.startsWith(MEDIA) && /\/(light|dark)\.(png|mp4)$/.test(path);
}

type Row = { id: string; theme: Theme; still?: MediaChange["status"]; clip?: MediaChange["status"] };

export function previewTable(input: {
	repo: string;
	base: string;
	head: string;
	changes: readonly MediaChange[];
}): string | undefined {
	const rows = new Map<string, Row>();
	for (const change of input.changes) {
		const match = /^(.+)\/(light|dark)\.(png|mp4)$/.exec(change.path.slice(MEDIA.length));
		const id = match?.[1];
		if (match === null || id === undefined) continue;
		const theme: Theme = match[2] === "dark" ? "dark" : "light";
		const extension = match[3];
		const key = `${id}\0${theme}`;
		const row = rows.get(key) ?? { id, theme };
		if (extension === "png") row.still = change.status;
		else row.clip = change.status;
		rows.set(key, row);
	}
	if (rows.size === 0) return undefined;

	const url = (sha: string, row: Row, extension: "png" | "mp4") =>
		`https://raw.githubusercontent.com/${input.repo}/${sha}/${MEDIA}${row.id}/${row.theme}.${extension}`;
	const cell = (sha: string, row: Row, side: "before" | "after") => {
		const absent = side === "before" ? "added" : "deleted";
		if (row.still === absent || (row.still === undefined && row.clip === absent)) return "—";
		const image = `<img src="${url(sha, row, "png")}" width="${WIDTH}">`;
		const hasClip = row.clip !== undefined && row.clip !== absent;
		return hasClip ? `${image}<br>[▶ clip](${url(sha, row, "mp4")})` : image;
	};

	const sorted = [...rows.values()].sort(
		(a, b) => a.id.localeCompare(b.id) || THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme)
	);
	return [
		"| Preview | Before | After |",
		"| --- | --- | --- |",
		...sorted.map(
			(row) => `| \`${row.id}\` ${row.theme} | ${cell(input.base, row, "before")} | ${cell(input.head, row, "after")} |`
		),
	].join("\n");
}

async function main(): Promise<void> {
	const argv = Bun.argv.slice(2);
	const baseFlag = argv.indexOf("--base");
	const baseRef = baseFlag === -1 ? "origin/develop" : argv[baseFlag + 1];
	if (baseRef === undefined) throw new Error("--base needs a ref");

	const base = (await $`git merge-base ${baseRef} HEAD`.quiet().text()).trim();
	const head = (await $`git rev-parse HEAD`.quiet().text()).trim();
	const repo = (await $`gh repo view --json nameWithOwner --jq .nameWithOwner`.quiet().text()).trim();
	const output = await $`git diff --name-status ${base} ${head} -- ${MEDIA}`.quiet().text();
	const table = previewTable({ base, changes: parseNameStatus(output), head, repo });
	if (table !== undefined) console.log(table);
}

if (import.meta.main) await main();
