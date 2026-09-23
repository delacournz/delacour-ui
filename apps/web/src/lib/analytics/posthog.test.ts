import { describe, expect, test } from "bun:test";
import { consentReplay, posthogOptions } from "./posthog";

const posthog = { kind: "on", token: "phc_test", host: "https://i.delacour.co.nz" } as const;

describe("posthogOptions", () => {
	const options = posthogOptions(posthog);

	test("sends through the reverse proxy and links to the US app", () => {
		expect(options.api_host).toBe("https://i.delacour.co.nz");
		expect(options.ui_host).toBe("https://us.posthog.com");
	});

	/**
	 * `on_reject` alone captures nothing while the banner is unanswered. With
	 * `opt_out_capturing_by_default` an unanswered visitor counts as rejected, so
	 * they are counted cookieless until they Accept. That is what the banner
	 * promises: visits are counted without cookies either way.
	 */
	test("counts without cookies until the visitor accepts", () => {
		expect(options.cookieless_mode).toBe("on_reject");
		expect(options.opt_out_capturing_by_default).toBe(true);
	});

	test("captures only page views, page leaves and the site's own events", () => {
		expect(options.autocapture).toBe(false);
		expect(options.capture_pageview).toBe("history_change");
		expect(options.rageclick).toBe(false);
		expect(options.capture_dead_clicks).toBe(false);
		expect(options.capture_heatmaps).toBe(false);
		expect(options.capture_exceptions).toBe(false);
		expect(options.capture_performance).toBe(false);
	});

	/**
	 * The privacy policy lists what PostHog receives. A switch flipped in the
	 * PostHog project — session replay, surveys, heatmaps — must not reach a
	 * visitor without a change here and there, so remote config is off and
	 * nothing is loaded beyond the SDK itself.
	 */
	test("records no sessions and takes no configuration from the PostHog project", () => {
		expect(options.disable_session_recording).toBe(true);
		expect(options.disable_surveys).toBe(true);
		expect(options.advanced_disable_flags).toBe(true);
		expect(options.disable_external_dependency_loading).toBe(true);
		expect(options.person_profiles).toBe("identified_only");
	});
});

describe("consentReplay", () => {
	test("tells PostHog about a choice it has not stored", () => {
		expect(consentReplay("granted", "pending")).toBe("opt_in");
		expect(consentReplay("granted", "denied")).toBe("opt_in");
		expect(consentReplay("denied", "pending")).toBe("opt_out");
		expect(consentReplay("denied", "granted")).toBe("opt_out");
	});

	/** `opt_in_capturing` sends an `$opt_in` event, so replaying a choice PostHog already holds would send one per page. */
	test("does nothing when PostHog already agrees, or there is no choice yet", () => {
		expect(consentReplay("granted", "granted")).toBeNull();
		expect(consentReplay("denied", "denied")).toBeNull();
		expect(consentReplay(null, "pending")).toBeNull();
		expect(consentReplay(null, "granted")).toBeNull();
	});
});
