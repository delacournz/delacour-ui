import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { plainText } from "@/components/landing/rich-text";
import { type Disclosure, PRIVACY, PRIVACY_SECTIONS, type SourceApp } from "./privacy";

/**
 * A privacy policy is a list of claims about code, and the code moves without
 * reading it. This file is what makes the claims checkable: each disclosure
 * that names a package is held to that package being installed, and each
 * package known to phone home is held to a disclosure naming it.
 *
 * The failure it exists for is the quiet one — an SDK added in a pull request
 * about something else, shipped to the stores, and never mentioned here. That
 * is a store-review rejection at best and a false statement to users at worst,
 * and nothing else in the repository would notice.
 */

const REPO = join(import.meta.dirname, "..", "..", "..", "..");

const MANIFESTS: Record<SourceApp, string> = {
	playground: join(REPO, "apps", "playground", "package.json"),
	web: join(REPO, "apps", "web", "package.json"),
};

function dependencies(app: SourceApp): string[] {
	const manifest = JSON.parse(readFileSync(MANIFESTS[app], "utf-8")) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};

	return [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})];
}

/**
 * Packages whose job is to send something about the user somewhere: analytics,
 * crash and error reporting, attribution, push, session replay, and Expo's own
 * services. Not exhaustive — it is the set a reviewer would expect to see
 * named in a policy, and the one a well-meaning install is most likely to add.
 */
const PHONES_HOME: readonly RegExp[] = [
	/^expo-insights$/,
	/^expo-observe$/,
	/^expo-app-metrics$/,
	/^expo-updates$/,
	/^expo-notifications$/,
	/^expo-tracking-transparency$/,
	/^posthog/,
	/^@sentry\//,
	/^@amplitude\//,
	/^@segment\//,
	/mixpanel/,
	/^@react-native-firebase\//,
	/^firebase$/,
	/^@bugsnag\//,
	/^@datadog\//,
	/^@vercel\/(analytics|speed-insights)$/,
	/^react-ga/,
	/^logrocket|^@logrocket\//,
	/^newrelic|^@newrelic\//,
	/^react-native-appsflyer$/,
	/^react-native-fbsdk/,
	/^@braze\//,
	/^react-native-onesignal$/,
];

const DISCLOSURES: readonly Disclosure[] = PRIVACY_SECTIONS.flatMap((section) => section.disclosures ?? []);

/** Every word the page renders, as plain text, for the claims a test can only check by reading. */
const EVERYTHING = plainText(JSON.stringify({ PRIVACY, PRIVACY_SECTIONS }));

describe("the privacy policy's claims", () => {
	test("every disclosed package is actually installed", () => {
		const missing = DISCLOSURES.flatMap((row) => (row.source ? [row.source] : [])).filter(
			(source) => !dependencies(source.app).includes(source.package)
		);

		expect(missing).toEqual([]);
	});

	test("every installed package that phones home is disclosed", () => {
		const disclosed = new Set(
			DISCLOSURES.flatMap((row) => (row.source ? [`${row.source.app}:${row.source.package}`] : []))
		);

		const undisclosed = (Object.keys(MANIFESTS) as SourceApp[]).flatMap((app) =>
			dependencies(app)
				.filter((name) => PHONES_HOME.some((pattern) => pattern.test(name)))
				.map((name) => `${app}:${name}`)
				.filter((key) => !disclosed.has(key))
		);

		expect(undisclosed).toEqual([]);
	});

	/**
	 * The launch ping's fields, read out of the module that sends them. A new
	 * `expo-insights` that adds one — a device model, a locale — fails here by
	 * the field's name, before a binary carrying it reaches a store.
	 */
	test("describes every field the launch ping sends", () => {
		const swift = readFileSync(join(REPO, "node_modules", "expo-insights", "ios", "InsightsModule.swift"), "utf-8");
		// Up to the `]` on a line of its own: a value like `info?["CFBundle…"]` closes a bracket first.
		const body = /func getLaunchEventData[\s\S]*?return \[([\s\S]*?)\n\s*\]/.exec(swift)?.[1];

		expect(body).toBeString();

		const sent = [...(body as string).matchAll(/"([a-z_]+)":/g)].map((match) => match[1] as string).sort();

		expect(sent).toEqual(Object.keys(LAUNCH_PING_FIELDS).sort());

		const ping = DISCLOSURES.find((row) => row.source?.package === "expo-insights");

		expect(ping).toBeDefined();
		for (const phrase of Object.values(LAUNCH_PING_FIELDS)) {
			if (phrase) expect(plainText((ping as Disclosure).what)).toContain(phrase);
		}
	});

	/**
	 * EAS Observe's payload, read out of the two modules that build it: the
	 * attributes `expo-observe` puts on every report, and the device and network
	 * readings `expo-app-metrics` attaches to its timings. Either growing a key
	 * fails here by the key's name, the same guarantee the launch ping has.
	 */
	test("describes every field EAS Observe's reports carry", () => {
		const telemetry = readFileSync(join(REPO, "node_modules", "expo-observe", "ios", "OpenTelemetry.swift"), "utf-8");
		const params = readFileSync(
			join(REPO, "node_modules", "expo-app-metrics", "ios", "Utils", "MetricParamsBuilder.swift"),
			"utf-8"
		);

		const attributes = [
			...new Set([...telemetry.matchAll(/OTAttribute\(key: "([^"]+)"/g)].map((match) => match[1] as string)),
		];
		const readings = [
			...new Set(
				[...params.matchAll(/"?(expo\.(?:device|frameRate|network)\.[A-Za-z.]+)/g)].map((m) => m[1] as string)
			),
		];

		expect(attributes.sort()).toEqual(Object.keys(OBSERVE_ATTRIBUTES).sort());
		expect(readings.sort()).toEqual(Object.keys(OBSERVE_READINGS).sort());

		const reports = DISCLOSURES.find((row) => row.source?.package === "expo-observe");

		expect(reports).toBeDefined();
		for (const phrase of [
			...Object.values(OBSERVE_ATTRIBUTES),
			...Object.values(OBSERVE_READINGS),
			...OBSERVE_CONTENT,
		]) {
			if (phrase) expect(plainText((reports as Disclosure).what)).toContain(phrase);
		}
	});

	test("names Google Fonts, the site's one third-party origin", () => {
		const fonts = readFileSync(join(REPO, "apps", "web", "src", "lib", "google-fonts.ts"), "utf-8");

		expect(fonts).toContain("fonts.googleapis.com");
		expect(EVERYTHING).toContain("fonts.googleapis.com");
	});

	/**
	 * The analytics tags are script tags, not packages, so the package check
	 * above cannot see them. Each origin the site's own code loads a tracker
	 * from is read out of that code and held to being named here.
	 */
	test("names Google Analytics and the origin the consent bootstrap loads it from", () => {
		const consent = readFileSync(join(REPO, "apps", "web", "src", "lib", "analytics", "consent.ts"), "utf-8");

		expect(consent).toContain("googletagmanager.com");
		expect(EVERYTHING).toContain("googletagmanager.com");
		expect(EVERYTHING).toContain("Google Analytics");
	});

	test("says search queries are sent, since the search dialog sends them", () => {
		const dialog = readFileSync(join(REPO, "apps", "web", "src", "components", "search-dialog.tsx"), "utf-8");
		const search = DISCLOSURES.find((row) => row.what.startsWith("What you type into search"));

		expect(dialog).toContain('name: "search"');
		expect(search?.to).toContain("Google Analytics");
	});

	test("names the host the CLI downloads components from", () => {
		const source = readFileSync(join(REPO, "packages", "cli", "src", "registry", "source.ts"), "utf-8");

		expect(source).toContain("raw.githubusercontent.com");
		expect(EVERYTHING).toContain("raw.githubusercontent.com");
	});
});

/**
 * `expo-insights`' launch-event keys, and the words the policy uses for each.
 * `null` is a key that carries nothing about the user — the event's own name,
 * and this app's EAS project id, which is the same for every install.
 */
const LAUNCH_PING_FIELDS: Record<string, string | null> = {
	event_name: null,
	project_id: null,
	eas_client_id: "random install ID",
	app_version: "app version",
	platform: "platform",
	os_version: "operating system version",
};

/**
 * `expo-observe`'s report attributes, and the policy's words for each. `null`
 * marks a key that describes the build or the SDK rather than the user — a
 * version string, an update id, the event's own name — which the disclosure
 * covers as "the app version and its build and release identifiers".
 */
const OBSERVE_ATTRIBUTES: Record<string, string | null> = {
	"session.id": "session ID",
	"expo.eas_client.id": "install ID",
	"expo.route_name": "screens you open",
	"expo.custom_params": null,
	"expo.update_id": null,
	"event.name": null,
	"os.type": null,
	"os.name": "operating system",
	"os.version": "operating system",
	"device.model.name": "device model",
	"device.model.identifier": "device model",
	"browser.language": "language",
	"telemetry.sdk.name": null,
	"telemetry.sdk.version": null,
	"telemetry.sdk.language": null,
	"expo.sdk.version": null,
	"expo.react_native.version": null,
	"service.name": null,
	"service.version": "app version",
	"expo.app.name": null,
	"expo.app.build_number": "build and release identifiers",
	"expo.app.update_id": "build and release identifiers",
	"expo.app.updates.id": "build and release identifiers",
	"expo.app.updates.channel": "build and release identifiers",
	"expo.app.updates.runtime_version": "build and release identifiers",
	"expo.environment": null,
	"expo.eas_build.id": "build and release identifiers",
};

/** `expo-app-metrics`' readings, attached to a report as `expo.custom_params`. */
const OBSERVE_READINGS: Record<string, string> = {
	"expo.device.batteryLevel": "battery",
	"expo.device.batteryCharging": "battery",
	"expo.device.lowPowerMode": "power-saving",
	"expo.device.thermalState": "temperature",
	"expo.frameRate.slowFrames": "dropped frames",
	"expo.frameRate.frozenFrames": "dropped frames",
	"expo.frameRate.totalDelay": "dropped frames",
	"expo.network.connected": "network connection",
	"expo.network.type": "network connection",
	"expo.network.requests.count": "network requests",
	"expo.network.requests.failed": "network requests",
	"expo.network.requests.bytesReceived": "network requests",
	"expo.network.requests.bytesSent": "network requests",
	"expo.network.requests.totalDuration": "network requests",
	"expo.network.requests.slowestDuration": "network requests",
	"expo.network.requests.slowestHost": "host",
};

/**
 * What a report carries that is not a key at all: the route's parameters, and
 * an error's message and stack. Free text is the part a reader most needs told.
 */
const OBSERVE_CONTENT: readonly string[] = ["parameters", "error message", "where in the code"];

describe("the privacy policy page", () => {
	test("carries a real date, and not one in the future", () => {
		expect(PRIVACY.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(Date.parse(PRIVACY.updated)).toBeLessThanOrEqual(Date.now());
	});

	test("gives a contact a reader can write to, as a link", () => {
		expect(PRIVACY.contact).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]+$/);
		expect(JSON.stringify(PRIVACY_SECTIONS)).toContain(`(mailto:${PRIVACY.contact})`);
	});

	test("names who is responsible", () => {
		expect(EVERYTHING).toContain(PRIVACY.controller);
	});

	test("has no placeholder left in it", () => {
		expect(EVERYTHING).not.toMatch(/\b(TODO|TBD|PLACEHOLDER|lorem|XXX)\b/i);
	});

	// Each section is an anchor — the screenshot set and the app link can land on one.
	test("gives every section a unique, kebab-case id", () => {
		const ids = PRIVACY_SECTIONS.map((section) => section.id);

		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
	});
});
