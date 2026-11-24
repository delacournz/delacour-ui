import { describe, expect, test } from "bun:test";
import type { OptOutReason, Telemetry, TelemetryStatus } from "@delacournz/cli-telemetry";
import { createCliTelemetry } from "../telemetry/client";
import { describeReason, formatStatus, runTelemetry } from "./telemetry";

const STATUS: TelemetryStatus = {
	enabled: true,
	reason: "default",
	endpoint: "https://telemetry.delacour.co.nz/v1/events",
	debug: false,
	storePath: "/home/me/.config/delacour/telemetry.json",
	persistent: true,
	machineId: null,
};

function fixture(env: Record<string, string> = {}) {
	const dir = `${process.env.TMPDIR ?? "/tmp"}/delacour-telemetry-cmd-${Math.random().toString(36).slice(2)}`;
	const telemetry: Telemetry = createCliTelemetry({ env: { XDG_CONFIG_HOME: dir, ...env }, version: "1.2.3" });
	const out: string[] = [];

	return { telemetry, out, write: (text: string) => void out.push(text) };
}

describe("describeReason", () => {
	const reasons: OptOutReason[] = [
		"default",
		"stored-enabled",
		"do-not-track",
		"delacour-env",
		"product-env",
		"stored-disabled",
		"test-env",
		"dev-version",
	];

	test("has words for every reason the client can give", () => {
		for (const reason of reasons) expect(describeReason(reason).length).toBeGreaterThan(5);
	});

	test("names the variable that is responsible", () => {
		expect(describeReason("do-not-track")).toContain("DO_NOT_TRACK");
		expect(describeReason("delacour-env")).toContain("DELACOUR_TELEMETRY_DISABLED");
		expect(describeReason("product-env")).toContain("DELACOUR_CLI_TELEMETRY_DISABLED");
	});
});

describe("formatStatus", () => {
	test("says on or off, why, where it goes and where the state lives", () => {
		const text = formatStatus(STATUS);

		expect(text).toContain("enabled");
		expect(text).toContain("telemetry.delacour.co.nz");
		expect(text).toContain("/home/me/.config/delacour/telemetry.json");
		expect(text).toContain("delacour telemetry disable");
	});

	test("offers enable when it is off", () => {
		expect(formatStatus({ ...STATUS, enabled: false, reason: "stored-disabled" })).toContain(
			"delacour telemetry enable"
		);
	});

	test("shows an identity only once one exists", () => {
		expect(formatStatus(STATUS)).not.toContain("Machine ID");
		expect(formatStatus({ ...STATUS, machineId: "abc" })).toContain("abc");
	});

	test("says so when the state cannot be saved", () => {
		expect(formatStatus({ ...STATUS, persistent: false })).toContain("could not be saved");
	});

	test("says debug mode sends nothing", () => {
		expect(formatStatus({ ...STATUS, debug: true })).toContain("DELACOUR_TELEMETRY_DEBUG");
	});
});

describe("runTelemetry", () => {
	test("status is the default and changes nothing", () => {
		const f = fixture();

		runTelemetry(undefined, {}, { telemetry: f.telemetry, write: f.write });

		expect(f.telemetry.enabled).toBe(true);
		expect(f.out.join("")).toContain("enabled");
	});

	test("disable turns it off and enable turns it back on", () => {
		const f = fixture();

		runTelemetry("disable", {}, { telemetry: f.telemetry, write: f.write });
		expect(f.telemetry.enabled).toBe(false);
		expect(f.out.join("")).toContain("disabled");

		runTelemetry("enable", {}, { telemetry: f.telemetry, write: f.write });
		expect(f.telemetry.enabled).toBe(true);
	});

	test("enable cannot beat an environment opt-out, and says so", () => {
		const f = fixture({ DO_NOT_TRACK: "1" });

		runTelemetry("enable", {}, { telemetry: f.telemetry, write: f.write });

		expect(f.telemetry.enabled).toBe(false);
		expect(f.out.join("")).toContain("DO_NOT_TRACK");
	});

	test("--json prints one parseable document", () => {
		const f = fixture();

		runTelemetry("status", { json: true }, { telemetry: f.telemetry, write: f.write });

		const parsed = JSON.parse(f.out.join(""));
		expect(parsed.enabled).toBe(true);
		expect(parsed.reason).toBe("default");
		expect(parsed.endpoint).toContain("telemetry.delacour.co.nz");
	});

	test("status never creates an identity", () => {
		const f = fixture();

		runTelemetry("status", { json: true }, { telemetry: f.telemetry, write: f.write });

		expect(JSON.parse(f.out.join("")).machineId).toBeNull();
	});
});
