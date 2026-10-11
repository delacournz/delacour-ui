import { describe, expect, test } from "bun:test";
import { devClientUrl } from "./dev-client";

describe("devClientUrl", () => {
	test("names the bundler, percent-encoded, on the app's own scheme", () => {
		const url = new URL(devClientUrl("dlc-ui-playground", 8088));
		expect(url.protocol).toBe("dlc-ui-playground:");
		expect(url.host).toBe("expo-development-client");
		expect(url.searchParams.get("url")).toBe("http://localhost:8088");
		expect(devClientUrl("dlc-ui-playground", 8088)).toContain("url=http%3A%2F%2Flocalhost%3A8088");
	});

	test("follows the port it is given", () => {
		expect(new URL(devClientUrl("dlc-ui-playground", 8091)).searchParams.get("url")).toBe("http://localhost:8091");
	});

	test("switches off every dev-menu surface a capture would otherwise record", () => {
		const params = new URL(devClientUrl("dlc-ui-playground", 8088)).searchParams;
		expect(params.get("disableOnboarding")).toBe("1");
		expect(params.get("disableFab")).toBe("1");
		expect(params.get("disableAutoLaunch")).toBe("1");
	});
});
