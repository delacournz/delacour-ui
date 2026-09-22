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
 * two services. Not exhaustive — it is the set a reviewer would expect to see
 * named in a policy, and the one a well-meaning install is most likely to add.
 */
const PHONES_HOME: readonly RegExp[] = [
	/^expo-insights$/,
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

	test("names Google Fonts, the site's one third-party origin", () => {
		const fonts = readFileSync(join(REPO, "apps", "web", "src", "lib", "google-fonts.ts"), "utf-8");

		expect(fonts).toContain("fonts.googleapis.com");
		expect(EVERYTHING).toContain("fonts.googleapis.com");
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
