import { createTelemetry, type Telemetry, type TelemetryOptions } from "@delacournz/cli-telemetry";
import { CLI_CHANNEL } from "../project/channel";
import { CLI_VERSION } from "../version";

/**
 * The CLI's one telemetry instance.
 *
 * `@delacournz/cli-telemetry` is the shared client — environment detection,
 * opt-out precedence, the machine-local identity file, the project id, the
 * bounded send — and tsdown bundles it, so a consumer installs nothing extra.
 * Everything specific to *this* product is here: its name, its version, its
 * channel, what the notice tells people to type, and where they can read more.
 *
 * `TELEMETRY_HOST` is stated again, rather than only inherited, because
 * `/privacy` is held to it: `apps/web/src/lib/privacy.test.ts` reads this file
 * for the host and requires the policy to name it, and `client.test.ts` holds
 * it to the package's own endpoint. Change the endpoint in the package and the
 * second test fails; change it here and the first one does.
 */

/** The ingest service's allowlisted slug for this CLI. */
export const TELEMETRY_PRODUCT = "delacour-cli";

/** Where events go. Our own server, which derives a country from the request and drops the IP. */
export const TELEMETRY_HOST = "telemetry.delacour.co.nz";

/** The notice, `delacour telemetry` and the privacy policy all point here. */
export const TELEMETRY_DOCS_URL = "https://ui.delacour.co.nz/docs/native/cli#telemetry";

export function createCliTelemetry(overrides: Partial<TelemetryOptions> = {}): Telemetry {
	return createTelemetry({
		product: TELEMETRY_PRODUCT,
		version: CLI_VERSION,
		channel: CLI_CHANNEL,
		bin: "delacour",
		docsUrl: TELEMETRY_DOCS_URL,
		...overrides,
	});
}

let instance: Telemetry | undefined;

/** Created on first use, so a process that never records never touches the disk. */
export function telemetry(): Telemetry {
	instance ??= createCliTelemetry();

	return instance;
}
