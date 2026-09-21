import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { findRootLayout, renderRootLayout } from "./root-layout";

const directories: string[] = [];

async function app(files: Record<string, string>): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "delacour-layout-"));
	directories.push(root);

	for (const [path, content] of Object.entries(files)) {
		await mkdir(dirname(join(root, path)), { recursive: true });
		await writeFile(join(root, path), content, "utf-8");
	}

	return root;
}

afterAll(async () => {
	await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("findRootLayout", () => {
	test("an Expo Router app under src/", async () => {
		const root = await app({ "src/app/_layout.tsx": "export default () => null;" });

		expect(findRootLayout(root)).toEqual({ path: "src/app/_layout.tsx", router: true });
	});

	test("an Expo Router app at the project root", async () => {
		const root = await app({ "app/_layout.tsx": "export default () => null;" });

		expect(findRootLayout(root)).toEqual({ path: "app/_layout.tsx", router: true });
	});

	test("an app with no router", async () => {
		const root = await app({ "App.tsx": "export default () => null;" });

		expect(findRootLayout(root)).toEqual({ path: "App.tsx", router: false });
	});

	test("nothing it recognises", async () => {
		expect(findRootLayout(await app({ "package.json": "{}" }))).toBeNull();
	});

	// `src/app` wins: an app holding both is an Expo Router app whose App.tsx is
	// left over, and the layout is the file that actually renders.
	test("prefers the router layout over a leftover App.tsx", async () => {
		const root = await app({
			"App.tsx": "export default () => null;",
			"src/app/_layout.tsx": "export default () => null;",
		});

		expect(findRootLayout(root)?.path).toBe("src/app/_layout.tsx");
	});
});

describe("renderRootLayout", () => {
	const layout = { path: "src/app/_layout.tsx", router: true } as const;

	test("is a complete file, CSS first", () => {
		const file = renderRootLayout(layout, { css: "../global.css", provider: "../components/ui/provider" });

		expect(file.split("\n")[0]).toBe('import "../global.css";');
		expect(file).toContain('import { DelacourProvider } from "../components/ui/provider";');
		expect(file).toContain('import { Slot } from "expo-router";');
		expect(file).toContain("<DelacourProvider>");
		expect(file).toContain("<Slot />");
		expect(file).toContain("export default function RootLayout()");
	});

	test("carries no comment inside the markup", () => {
		const file = renderRootLayout(layout, { css: "../global.css", provider: "../components/ui/provider" });

		expect(file).not.toContain("{/*");
	});

	test("uses the alias when the project has one", () => {
		const file = renderRootLayout(layout, { css: "@/styles/global.css", provider: "@/components/ui/provider" });

		expect(file).toContain('import "@/styles/global.css";');
		expect(file).toContain('from "@/components/ui/provider"');
	});
});
