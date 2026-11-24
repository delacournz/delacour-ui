import type { OptOutReason, Telemetry, TelemetryStatus } from "@delacournz/cli-telemetry";
import { telemetry as sharedTelemetry, TELEMETRY_DOCS_URL } from "../telemetry/client";

/**
 * `delacour telemetry [status|enable|disable]`.
 *
 * The way to see what the CLI would do and to change it, without reading
 * documentation or knowing an environment variable. It prints to stdout like
 * `info` and `doctor` do, `--json` included, and it is the one command that is
 * neither announced by the first-run notice nor counted — see `telemetry/tracker.ts`.
 */

export type TelemetryAction = "status" | "enable" | "disable";
export const TELEMETRY_ACTIONS: readonly TelemetryAction[] = ["status", "enable", "disable"];

export type TelemetryCommandOptions = { json?: boolean };

export type TelemetryDeps = {
	telemetry: Telemetry;
	write: (text: string) => void;
};

const REASONS: Record<OptOutReason, string> = {
	default: "on by default; nothing has switched it off",
	"stored-enabled": "switched on with `delacour telemetry enable`",
	"do-not-track": "DO_NOT_TRACK is set",
	"delacour-env": "DELACOUR_TELEMETRY_DISABLED is set",
	"product-env": "DELACOUR_CLI_TELEMETRY_DISABLED is set",
	"stored-disabled": "switched off with `delacour telemetry disable`",
	"test-env": "NODE_ENV is `test`",
	"dev-version": "this is a development build, which never reports",
};

export function describeReason(reason: OptOutReason): string {
	return REASONS[reason];
}

export function formatStatus(status: TelemetryStatus): string {
	const lines = [
		`Telemetry is ${status.enabled ? "enabled" : "disabled"}: ${describeReason(status.reason)}.`,
		"",
		`Endpoint:    ${status.endpoint}`,
		`Config file: ${status.storePath}`,
	];

	if (status.machineId) lines.push(`Machine ID:  ${status.machineId}`);
	if (status.debug)
		lines.push("", "DELACOUR_TELEMETRY_DEBUG is set: events are printed to stderr and nothing is sent.");
	if (!status.persistent) lines.push("", "The config file could not be saved, so this choice lasts for this run only.");

	lines.push(
		"",
		status.enabled ? "Turn it off with `delacour telemetry disable`." : "Turn it on with `delacour telemetry enable`.",
		`What is collected: ${TELEMETRY_DOCS_URL}`,
		""
	);

	return lines.join("\n");
}

export function runTelemetry(
	action: TelemetryAction | undefined,
	options: TelemetryCommandOptions,
	deps: TelemetryDeps = { telemetry: sharedTelemetry(), write: (text) => void process.stdout.write(text) }
): void {
	const { telemetry, write } = deps;

	if (action === "enable") telemetry.enable();
	if (action === "disable") telemetry.disable();

	const status = telemetry.status();

	if (options.json) {
		write(`${JSON.stringify(status, null, 2)}\n`);
		return;
	}

	if (action === "enable" && !status.enabled) {
		write(`Telemetry stays off: ${describeReason(status.reason)}.\n\n`);
	}

	write(formatStatus(status));
}
