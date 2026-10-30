import { describe, expect, test } from "bun:test";
import { applyPrefix, providerName } from "./prefix";

describe("applyPrefix", () => {
	test("leaves the library's own names alone without a prefix", () => {
		const source = 'FlowProvider.displayName = "DelacourUI.Flow.Provider";';
		expect(applyPrefix(source, undefined)).toBe(source);
	});

	test("renames every display name", () => {
		expect(applyPrefix('FlowProvider.displayName = "DelacourUI.Flow.Provider";', "UI")).toBe(
			'FlowProvider.displayName = "UI.Flow.Provider";'
		);
		expect(applyPrefix("export const SWIPE_END = `DelacourUI.Swipe.End`;", "Acme")).toBe(
			"export const SWIPE_END = `Acme.Swipe.End`;"
		);
	});

	test("renames the tag on thrown messages", () => {
		expect(applyPrefix('throw new Error("[DelacourUI] a Chart part was used outside a <Chart>.");', "UI")).toBe(
			'throw new Error("[UI] a Chart part was used outside a <Chart>.");'
		);
		expect(applyPrefix("`[DelacourUI.Chart] placed twice`", "UI")).toBe("`[UI.Chart] placed twice`");
	});

	test("renames the provider and its props type", () => {
		const source = [
			'export { DelacourProvider, type DelacourProviderProps } from "./provider";',
			'DelacourProvider.displayName = "DelacourUI.Provider";',
		].join("\n");
		expect(applyPrefix(source, "UI")).toBe(
			[
				'export { UIProvider, type UIProviderProps } from "./provider";',
				'UIProvider.displayName = "UI.Provider";',
			].join("\n")
		);
	});

	test("does not touch a longer identifier that only starts the same way", () => {
		expect(applyPrefix("const DelacourUIish = DelacourProviderish;", "UI")).toBe(
			"const DelacourUIish = DelacourProviderish;"
		);
	});
});

describe("providerName", () => {
	test("is the library's name without a prefix", () => {
		expect(providerName(undefined)).toBe("DelacourProvider");
		expect(providerName("DelacourUI")).toBe("DelacourProvider");
	});

	test("is the prefix plus Provider with one", () => {
		expect(providerName("UI")).toBe("UIProvider");
		expect(providerName("Acme")).toBe("AcmeProvider");
	});
});
