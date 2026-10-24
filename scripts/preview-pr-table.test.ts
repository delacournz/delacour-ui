import { describe, expect, test } from "bun:test";
import { type MediaChange, parseNameStatus, previewTable } from "./preview-pr-table";

const RAW = "https://raw.githubusercontent.com/delacournz/delacour-ui";
const MEDIA = "apps/web/public/previews";
const BASE = "a".repeat(40);
const HEAD = "b".repeat(40);

describe("parseNameStatus", () => {
	test("keeps preview media, drops everything else", () => {
		const output = [
			`M\t${MEDIA}/button/variants/light.png`,
			`A\t${MEDIA}/button/new/dark.png`,
			`D\t${MEDIA}/button/gone/light.png`,
			`M\t${MEDIA}/accordion/sizes/light.mp4`,
			"M\tapps/web/src/previews/manifest.ts",
			`R100\t${MEDIA}/old/light.png\t${MEDIA}/new/light.png`,
		].join("\n");
		expect(parseNameStatus(output)).toEqual([
			{ path: `${MEDIA}/button/variants/light.png`, status: "modified" },
			{ path: `${MEDIA}/button/new/dark.png`, status: "added" },
			{ path: `${MEDIA}/button/gone/light.png`, status: "deleted" },
			{ path: `${MEDIA}/accordion/sizes/light.mp4`, status: "modified" },
			{ path: `${MEDIA}/old/light.png`, status: "deleted" },
			{ path: `${MEDIA}/new/light.png`, status: "added" },
		]);
	});
});

describe("previewTable", () => {
	const table = (changes: MediaChange[]) =>
		previewTable({ base: BASE, changes, head: HEAD, repo: "delacournz/delacour-ui" });

	test("nothing changed, nothing to embed", () => {
		expect(table([])).toBeUndefined();
	});

	test("a modified still shows the base copy beside the head copy, each pinned to its SHA", () => {
		expect(table([{ path: `${MEDIA}/button/variants/light.png`, status: "modified" }])).toBe(
			[
				"| Preview | Before | After |",
				"| --- | --- | --- |",
				`| \`button/variants\` light | <img src="${RAW}/${BASE}/${MEDIA}/button/variants/light.png" width="320"> | <img src="${RAW}/${HEAD}/${MEDIA}/button/variants/light.png" width="320"> |`,
			].join("\n")
		);
	});

	test("an added still has no before, a deleted one no after", () => {
		const out = table([
			{ path: `${MEDIA}/button/new/dark.png`, status: "added" },
			{ path: `${MEDIA}/button/gone/light.png`, status: "deleted" },
		]);
		expect(out).toContain(
			`| \`button/gone\` light | <img src="${RAW}/${BASE}/${MEDIA}/button/gone/light.png" width="320"> | — |`
		);
		expect(out).toContain(
			`| \`button/new\` dark | — | <img src="${RAW}/${HEAD}/${MEDIA}/button/new/dark.png" width="320"> |`
		);
	});

	test("a clip is linked under its poster, because a body cannot play a raw mp4", () => {
		const out = table([
			{ path: `${MEDIA}/accordion/sizes/light.png`, status: "modified" },
			{ path: `${MEDIA}/accordion/sizes/light.mp4`, status: "modified" },
		]);
		expect(out).toContain(
			`<img src="${RAW}/${HEAD}/${MEDIA}/accordion/sizes/light.png" width="320"><br>[▶ clip](${RAW}/${HEAD}/${MEDIA}/accordion/sizes/light.mp4)`
		);
		expect(out).toContain(`[▶ clip](${RAW}/${BASE}/${MEDIA}/accordion/sizes/light.mp4)`);
	});

	test("a clip whose poster did not move still gets a row", () => {
		const out = table([{ path: `${MEDIA}/accordion/sizes/dark.mp4`, status: "modified" }]);
		expect(out).toContain(`| \`accordion/sizes\` dark |`);
		expect(out).toContain(`<img src="${RAW}/${HEAD}/${MEDIA}/accordion/sizes/dark.png" width="320">`);
	});

	test("rows sort by preview, light before dark", () => {
		const out = table([
			{ path: `${MEDIA}/button/b/dark.png`, status: "modified" },
			{ path: `${MEDIA}/button/b/light.png`, status: "modified" },
			{ path: `${MEDIA}/button/a/dark.png`, status: "modified" },
		]) as string;
		const labels = out
			.split("\n")
			.slice(2)
			.map((row) => row.split(" | ")[0]);
		expect(labels).toEqual(["| `button/a` dark", "| `button/b` light", "| `button/b` dark"]);
	});
});
