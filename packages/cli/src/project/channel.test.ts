import { describe, expect, test } from "bun:test";
import { channelFor } from "./channel";

describe("channelFor", () => {
	test("reads a snapshot build as the alpha channel", () => {
		expect(channelFor("0.1.1-alpha.20260925103000")).toBe("alpha");
	});

	test("reads a pre-mode build as the alpha channel", () => {
		expect(channelFor("0.1.0-alpha.5")).toBe("alpha");
	});

	test("reads a stable version as latest", () => {
		expect(channelFor("0.1.0")).toBe("latest");
		expect(channelFor("1.4.2")).toBe("latest");
	});

	test("reads an unbuilt working tree as latest", () => {
		expect(channelFor("0.0.0-dev")).toBe("latest");
	});
});
