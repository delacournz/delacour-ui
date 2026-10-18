/**
 * Recaptures a handful of components and checks the result against the media
 * on a baseline ref — the whole loop a human (or an agent) would otherwise
 * drive by hand after touching the capture pipeline.
 *
 *     bun run previews:verify                        # accordion, chart, a typing demo, bottom-sheet
 *     bun run previews:verify -- --only switch,slider
 *     bun run previews:verify -- --base origin/develop --max-diff 2 --headless --count 2
 *     bun run previews:verify -- --no-capture        # judge what is in the tree already
 *
 * Steps:
 *   1. `capture-previews.ts --only <list> --force`, with the simulator run
 *      inherited to the terminal — nothing is hidden.
 *   2. Every PNG the selection owns is compared pixel for pixel (2% fuzz)
 *      with the baseline's copy, read straight out of git.
 *   3. Every MP4 gets its duration read and a contact sheet written to
 *      `.previews/verify/`, next to the markdown report, so a look at the
 *      motion is one image per clip rather than a video player.
 *
 * Exit 1 when a capture failed, a file went missing or changed size, or a
 * still moved more than `--max-diff` percent of its pixels. Needs `magick`
 * (ImageMagick 7), `ffmpeg`, `ffprobe` and `git` on the PATH.
 */

import { mkdirSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import { $ } from "bun";
import { PLAYGROUND, REPO, WEB } from "./config";
import { PREVIEWS_STATE_DIR } from "./fragments";
import { hasBinary } from "./media";
import { parseAbsoluteError, renderReport, type VerifyRow, verdict } from "./verify-report";

const DEFAULT_ONLY = "accordion,chart,input/variants/at-rest,bottom-sheet";
const MEDIA_ROOT = "apps/web/public/previews";
const VERIFY_DIR = join(PREVIEWS_STATE_DIR, "verify");

const { values } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		base: { default: "origin/develop", type: "string" },
		capture: { default: true, type: "boolean" },
		"no-capture": { default: false, type: "boolean" },
		count: { type: "string" },
		headless: { default: false, type: "boolean" },
		"max-diff": { default: "2", type: "string" },
		only: { default: DEFAULT_ONLY, type: "string" },
	},
	strict: true,
});

const maxDiff = Number(values["max-diff"]);
if (!Number.isFinite(maxDiff)) throw new Error(`--max-diff must be a number, got ${values["max-diff"]}`);
const selection = values.only
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

for (const tool of ["magick", "compare", "ffmpeg", "ffprobe", "git"]) {
	if (!(await hasBinary(tool))) {
		console.error(`previews:verify needs ${tool} on the PATH`);
		process.exit(2);
	}
}

// ---- 1. capture ----

let capturesFailed = 0;
if (values.capture && !values["no-capture"]) {
	const argv = ["bun", "scripts/capture-previews.ts", "--only", selection.join(","), "--force"];
	if (values.headless) argv.push("--headless");
	if (values.count !== undefined) argv.push("--count", values.count);
	console.log(`\n▶ ${argv.join(" ")}\n`);
	const run = Bun.spawnSync(argv, { cwd: PLAYGROUND, stdio: ["inherit", "inherit", "inherit"] });
	if (run.exitCode !== 0) capturesFailed = 1;
}

// ---- 2 + 3. compare ----

rmSync(VERIFY_DIR, { force: true, recursive: true });
mkdirSync(VERIFY_DIR, { recursive: true });

/** The media files a selection owns: everything under the component, or under the one demo. */
async function ownedFiles(ref: string | undefined): Promise<string[]> {
	const prefixes = selection.map((s) => `${MEDIA_ROOT}/${s}`);
	const listing =
		ref === undefined
			? await $`git -C ${REPO} ls-files -- ${prefixes}`.text()
			: await $`git -C ${REPO} ls-tree -r --name-only ${ref} -- ${prefixes}`.nothrow().text();
	return listing.split("\n").filter((f) => f.endsWith(".png") || f.endsWith(".mp4"));
}

async function workingTreeFiles(): Promise<string[]> {
	const files = new Set<string>();
	for (const s of selection) {
		const glob = new Bun.Glob("**/*.{png,mp4}");
		const dir = join(WEB, "public", "previews", s);
		for await (const f of glob.scan({ cwd: dir })) files.add(`${MEDIA_ROOT}/${s}/${f}`);
	}
	return [...files].sort();
}

const baselineFiles = new Set(await ownedFiles(values.base));
const currentFiles = new Set(await workingTreeFiles());
const all = [...new Set([...baselineFiles, ...currentFiles])].sort();

async function baselineCopy(file: string): Promise<string> {
	const out = join(VERIFY_DIR, "baseline", file.replace(`${MEDIA_ROOT}/`, ""));
	mkdirSync(join(out, ".."), { recursive: true });
	await $`git -C ${REPO} show ${values.base}:${file} > ${out}`.quiet();
	return out;
}

async function dimensions(path: string): Promise<{ width: number; height: number }> {
	const [w, h] = (await $`magick identify -format "%w %h" ${path}`.text()).trim().split(" ").map(Number);
	return { height: h ?? 0, width: w ?? 0 };
}

async function durationMs(path: string): Promise<number> {
	const out = await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${path}`.text();
	return Math.round(Number(out.trim()) * 1000);
}

async function contactSheet(video: string, name: string): Promise<string> {
	const out = join(VERIFY_DIR, `${name}.png`);
	await $`ffmpeg -v error -y -i ${video} -vf "fps=4,scale=160:-1,tile=8x4" -frames:v 1 ${out}`.quiet();
	return relative(PLAYGROUND, out);
}

const rows: VerifyRow[] = [];
for (const file of all) {
	const short = file.replace(`${MEDIA_ROOT}/`, "");
	const kind = file.endsWith(".mp4") ? "clip" : "still";
	const current = join(REPO, file);
	if (!currentFiles.has(file)) {
		rows.push({ file: short, kind, status: "missing" });
		continue;
	}
	if (!baselineFiles.has(file)) {
		if (kind === "clip") {
			rows.push({
				file: short,
				kind,
				status: "new",
				durationMs: await durationMs(current),
				sheet: await contactSheet(current, short.replaceAll("/", "-")),
			});
		} else {
			const { width, height } = await dimensions(current);
			rows.push({ file: short, kind, status: "new", size: `${width}x${height}` });
		}
		continue;
	}
	const baseline = await baselineCopy(file);
	if (kind === "clip") {
		rows.push({
			baselineDurationMs: await durationMs(baseline),
			durationMs: await durationMs(current),
			file: short,
			kind,
			sheet: await contactSheet(current, short.replaceAll("/", "-")),
			status: "compared",
		});
		continue;
	}
	const [was, now] = await Promise.all([dimensions(baseline), dimensions(current)]);
	if (was.width !== now.width || was.height !== now.height) {
		rows.push({
			file: short,
			kind,
			size: `${was.width}x${now.height} → ${now.width}x${now.height}`,
			status: "resized",
		});
		continue;
	}
	const compared = await $`compare -metric AE -fuzz 2% ${baseline} ${current} null:`.nothrow().quiet();
	const diff = parseAbsoluteError(compared.stderr.toString(), now.width, now.height);
	rows.push({ file: short, kind, percent: diff?.percent, size: `${now.width}x${now.height}`, status: "compared" });
}

const result = verdict(rows, maxDiff, capturesFailed);
const report = renderReport(rows, result);
const reportPath = join(VERIFY_DIR, "report.md");
await Bun.write(reportPath, `# previews:verify — ${selection.join(", ")} against ${values.base}\n\n${report}`);
console.log(`\n${report}`);
console.log(`report: ${relative(PLAYGROUND, reportPath)}  ·  contact sheets beside it`);
process.exit(result.ok ? 0 : 1);
