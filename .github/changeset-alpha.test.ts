import { describe, expect, test } from "bun:test";
import { formatAlphaSummary, hasPendingChangesets, parsePublishResult } from "./changeset-alpha";

describe("hasPendingChangesets", () => {
	test("counts a changeset at the top of .changeset", () => {
		expect(hasPendingChangesets(["README.md", "config.json", "cli-ref-develop.md"])).toBe(true);
	});

	test("ignores the README, config and pre-mode state", () => {
		expect(hasPendingChangesets(["README.md", "config.json", "pre.json", "pre"])).toBe(false);
	});
});

describe("parsePublishResult", () => {
	test("reads a zero exit as published", () => {
		expect(parsePublishResult({ exitCode: 0, stdout: '{"id":"delacour@0.1.1-alpha.1"}', stderr: "" })).toEqual({
			result: "published",
		});
	});

	test("reads a republish of the same version as already published, so a re-run is safe", () => {
		const stdout = JSON.stringify({
			error: { code: "E403", summary: "You cannot publish over the previously published versions: 0.1.1-alpha.1." },
		});
		expect(parsePublishResult({ exitCode: 1, stdout, stderr: "" })).toEqual({ result: "already-published" });
	});

	test("reads any other error as a failure and keeps its code", () => {
		const stdout = JSON.stringify({ error: { code: "E404", summary: "Not found" } });
		expect(parsePublishResult({ exitCode: 1, stdout, stderr: "" })).toEqual({
			result: "failed",
			code: "E404",
			message: "Not found",
		});
	});
});

describe("formatAlphaSummary", () => {
	test("lists each version with the install line for the alpha tag", () => {
		const summary = formatAlphaSummary([
			{ name: "@delacour/react-native-ui", version: "0.1.1-alpha.20260925031715", outcome: { result: "published" } },
		]);
		expect(summary).toContain("| @delacour/react-native-ui | 0.1.1-alpha.20260925031715 | published |");
		expect(summary).toContain("bun add @delacour/react-native-ui@alpha");
	});
});
