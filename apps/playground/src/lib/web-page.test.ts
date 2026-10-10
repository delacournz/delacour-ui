import { describe, expect, test } from "bun:test";
import { createWebPageOpener, type WebPageOpeners } from "./web-page";

const URL_UNDER_TEST = "https://ui.delacour.co.nz/privacy";

type Calls = { inApp: string[]; external: string[] };

function openers(overrides: Partial<WebPageOpeners> = {}): { calls: Calls; openers: WebPageOpeners } {
	const calls: Calls = { inApp: [], external: [] };

	return {
		calls,
		openers: {
			inApp: async (url) => {
				calls.inApp.push(url);
			},
			external: async (url) => {
				calls.external.push(url);
			},
			...overrides,
		},
	};
}

const rejects = async (): Promise<void> => {
	throw new Error("nothing to open it with");
};

describe("createWebPageOpener", () => {
	test("opens the page in the in-app browser and leaves the system one alone", async () => {
		const { calls, openers: o } = openers();

		expect(await createWebPageOpener(o)(URL_UNDER_TEST)).toEqual({ kind: "in-app" });
		expect(calls).toEqual({ inApp: [URL_UNDER_TEST], external: [] });
	});

	// An Android image with no Custom Tabs provider, or a scheme the in-app
	// browser refuses: the page should still open somewhere.
	test("falls back to the system browser when the in-app one rejects", async () => {
		const { calls, openers: o } = openers({ inApp: rejects });

		expect(await createWebPageOpener(o)(URL_UNDER_TEST)).toEqual({ kind: "external" });
		expect(calls.external).toEqual([URL_UNDER_TEST]);
	});

	test("reports the url when neither browser can open it", async () => {
		const { openers: o } = openers({ inApp: rejects, external: rejects });

		expect(await createWebPageOpener(o)(URL_UNDER_TEST)).toEqual({ kind: "failed", url: URL_UNDER_TEST });
	});

	// iOS resolves only when the sheet is dismissed and rejects a second
	// presentation, so a double tap would otherwise fall through to Safari.
	test("drops a press made while a page is still opening", async () => {
		let release: () => void = () => {};
		const pending = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { calls, openers: o } = openers();
		const open = createWebPageOpener({
			...o,
			inApp: (url) => {
				calls.inApp.push(url);
				return pending;
			},
		});

		const first = open(URL_UNDER_TEST);

		expect(await open(URL_UNDER_TEST)).toEqual({ kind: "busy" });
		release();
		expect(await first).toEqual({ kind: "in-app" });
		expect(calls).toEqual({ inApp: [URL_UNDER_TEST], external: [] });
	});

	test("opens again once the last page has closed, or failed", async () => {
		const { calls, openers: o } = openers();
		const open = createWebPageOpener(o);

		await open(URL_UNDER_TEST);
		await open(URL_UNDER_TEST);
		expect(calls.inApp).toHaveLength(2);

		const failing = createWebPageOpener({ inApp: rejects, external: rejects });

		await failing(URL_UNDER_TEST);
		expect(await failing(URL_UNDER_TEST)).toEqual({ kind: "failed", url: URL_UNDER_TEST });
	});
});
