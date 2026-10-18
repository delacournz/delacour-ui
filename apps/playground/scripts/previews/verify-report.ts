/**
 * The pure half of `verify.ts`: reading a pixel comparison, judging a set of
 * them, and writing the report. Nothing here touches a file or a simulator,
 * so `bun test` holds it still.
 */

export type VerifyRow = {
	/** path under `apps/web/public/previews/` */
	file: string;
	kind: "still" | "clip";
	/** `compared` against the baseline; `new` has no baseline; `missing` was not written; `resized` cannot be compared pixel for pixel */
	status: "compared" | "new" | "missing" | "resized";
	/** stills: `WxH`, or `old → new` when resized */
	size?: string;
	/** stills: pixels differing beyond the fuzz, as a percentage of the frame */
	percent?: number;
	/** clips */
	durationMs?: number;
	baselineDurationMs?: number;
	/** clips: the contact sheet written for a look */
	sheet?: string;
};

export type Verdict = { ok: boolean; failures: string[] };

/**
 * `compare -metric AE` prints the count of differing pixels to stderr. On an
 * HDRI build of ImageMagick 7 — Homebrew's — that number is scaled by the
 * quantum range and the real count follows in brackets, so the bracketed value
 * wins when there is one.
 */
export function parseAbsoluteError(
	stderr: string,
	width: number,
	height: number
): { pixels: number; percent: number } | undefined {
	const text = stderr.trim();
	const bracketed = text.match(/\(([0-9]+(?:\.[0-9]+)?)\)/);
	const leading = text.match(/^([0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?)/i);
	const raw = bracketed?.[1] ?? leading?.[1];
	if (raw === undefined) return undefined;
	const pixels = Number(raw);
	if (!Number.isFinite(pixels)) return undefined;
	return { percent: Math.round((pixels / (width * height)) * 10000) / 100, pixels };
}

/** A still may differ by at most `maxPercent`; a missing or resized file, or any failed capture, fails. */
export function verdict(rows: readonly VerifyRow[], maxPercent: number, capturesFailed: number): Verdict {
	const failures: string[] = [];
	if (capturesFailed > 0) failures.push(`${capturesFailed} capture(s) failed — see the run above`);
	for (const row of rows) {
		if (row.status === "missing") failures.push(`${row.file}: not written`);
		else if (row.status === "resized") failures.push(`${row.file}: size changed (${row.size})`);
		else if (row.kind === "still" && row.status === "compared" && (row.percent ?? 0) > maxPercent)
			failures.push(`${row.file}: ${row.percent?.toFixed(2)}% of pixels differ (budget ${maxPercent}%)`);
	}
	return { failures, ok: failures.length === 0 };
}

const seconds = (ms: number | undefined): string => (ms === undefined ? "—" : `${(ms / 1000).toFixed(1)}s`);

export function renderReport(rows: readonly VerifyRow[], result: Verdict): string {
	const lines = ["| File | Kind | Status | Size / duration | Diff |", "| --- | --- | --- | --- | --- |"];
	for (const row of rows) {
		const measure =
			row.kind === "still"
				? (row.size ?? "—")
				: `${seconds(row.durationMs)}${row.baselineDurationMs === undefined ? "" : ` (was ${seconds(row.baselineDurationMs)})`}`;
		const diff =
			row.kind === "still" ? (row.percent === undefined ? "—" : `${row.percent.toFixed(2)}%`) : (row.sheet ?? "—");
		lines.push(`| ${row.file} | ${row.kind} | ${row.status} | ${measure} | ${diff} |`);
	}
	lines.push("", result.ok ? "**PASS**" : "**FAIL**");
	for (const failure of result.failures) lines.push(`- ${failure}`);
	return `${lines.join("\n")}\n`;
}
