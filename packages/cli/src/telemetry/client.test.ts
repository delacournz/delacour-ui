import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_ENDPOINT, type OptOutReason } from "@delacournz/cli-telemetry";
import { createCliTelemetry, TELEMETRY_DOCS_URL, TELEMETRY_HOST, TELEMETRY_PRODUCT } from "./client";

function config() {
	const dir = mkdtempSync(join(tmpdir(), "delacour-telemetry-"));
	return { dir, env: { XDG_CONFIG_HOME: dir } };
}

describe("the CLI's telemetry instance", () => {
	test("sends to the host the privacy policy names", () => {
		expect(new URL(DEFAULT_ENDPOINT).host).toBe(TELEMETRY_HOST);
		expect(TELEMETRY_HOST).toBe("telemetry.delacour.co.nz");
	});

	test("is the delacour-cli product, which the ingest service allowlists", () => {
		expect(TELEMETRY_PRODUCT).toBe("delacour-cli");
	});

	test("keeps its state in ~/.config/delacour/telemetry.json, as the docs say", () => {
		const { dir, env } = config();
		const telemetry = createCliTelemetry({ env, version: "1.2.3" });

		expect(telemetry.status().storePath).toBe(join(dir, "delacour", "telemetry.json"));
	});

	test("falls back to ~/.config/delacour when nothing moves it", () => {
		const telemetry = createCliTelemetry({ env: {}, version: "1.2.3" });

		expect(telemetry.status().storePath.endsWith(join(".config", "delacour", "telemetry.json"))).toBe(true);
	});

	test("tells the reader how to opt out and where to read more", () => {
		const telemetry = createCliTelemetry({ env: {}, version: "1.2.3" });

		expect(telemetry.noticeText).toContain("delacour telemetry disable");
		expect(telemetry.noticeText).toContain("DO_NOT_TRACK=1");
		expect(telemetry.noticeText).toContain(TELEMETRY_DOCS_URL);
	});

	test("is off in a development build", () => {
		const telemetry = createCliTelemetry({ env: {}, version: "0.0.0-dev" });

		expect(telemetry.enabled).toBe(false);
		expect(telemetry.reason).toBe("dev-version");
	});

	test.each<[string, OptOutReason]>([
		["DO_NOT_TRACK", "do-not-track"],
		["DELACOUR_TELEMETRY_DISABLED", "delacour-env"],
		["DELACOUR_CLI_TELEMETRY_DISABLED", "product-env"],
	])("%s turns it off", (variable, reason) => {
		const telemetry = createCliTelemetry({ env: { [variable]: "1" }, version: "1.2.3" });

		expect(telemetry.enabled).toBe(false);
		expect(telemetry.reason).toBe(reason);
	});

	test("disable() is remembered by the next process", () => {
		const { dir, env } = config();

		createCliTelemetry({ env, version: "1.2.3" }).disable();

		const next = createCliTelemetry({ env, version: "1.2.3" });
		expect(next.enabled).toBe(false);
		expect(next.reason).toBe("stored-disabled");
		expect(JSON.parse(readFileSync(join(dir, "delacour", "telemetry.json"), "utf-8")).products).toHaveProperty(
			TELEMETRY_PRODUCT
		);
	});
});
