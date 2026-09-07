import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { resolveConfig } from "../config/resolve";
import { configSchema } from "../config/schema";
import { checkGestureHandlerRoot } from "./doctor";

/**
 * The gesture-root check, against the layouts an Expo app actually has.
 *
 * `DelacourProvider` wraps `GestureHandlerRootView`, so an app that mounts the
 * provider has the gesture root without ever naming it — and a blank Expo
 * template mounts it from `App.tsx` at the project root, which no `app/` or
 * `src/` walk reaches.
 */

const directories: string[] = [];

async function app(files: Record<string, string>): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "delacour-doctor-"));
	directories.push(root);

	for (const [path, content] of Object.entries(files)) {
		await mkdir(dirname(join(root, path)), { recursive: true });
		await writeFile(join(root, path), content, "utf-8");
	}

	return root;
}

function config(root: string) {
	const parsed = configSchema.parse({
		paths: {
			ui: "src/components/ui",
			lib: "src/lib",
			hooks: "src/hooks",
			styles: "src/styles",
			icons: "src/lib/icons",
		},
	});
	return resolveConfig(parsed, root, join(root, "native-components.json"));
}

afterAll(async () => {
	await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("checkGestureHandlerRoot", () => {
	test("passes when the root layout mounts DelacourProvider", async () => {
		const root = await app({
			"app/_layout.tsx":
				'import { DelacourProvider } from "@/components/ui/provider";\nexport default () => <DelacourProvider />;',
		});

		const check = await checkGestureHandlerRoot(config(root));

		expect(check.status).toBe("pass");
		expect(check.detail).toContain("DelacourProvider");
	});

	test("passes when a blank-template App.tsx at the project root mounts it", async () => {
		const root = await app({
			"App.tsx":
				'import { DelacourProvider } from "./src/components/ui/provider";\nexport default () => <DelacourProvider />;',
		});

		expect((await checkGestureHandlerRoot(config(root))).status).toBe("pass");
	});

	test("still passes on a hand-mounted GestureHandlerRootView", async () => {
		const root = await app({
			"src/app/_layout.tsx":
				'import { GestureHandlerRootView } from "react-native-gesture-handler";\nexport default () => <GestureHandlerRootView />;',
		});

		expect((await checkGestureHandlerRoot(config(root))).status).toBe("pass");
	});

	test("does not count the copied provider component itself as the app mounting it", async () => {
		const root = await app({
			"src/components/ui/provider/provider.tsx": "export function DelacourProvider() { return null; }",
			"src/app/_layout.tsx": "export default () => null;",
		});

		expect((await checkGestureHandlerRoot(config(root))).status).toBe("warn");
	});

	test("warns, naming DelacourProvider first, when neither is mounted", async () => {
		const root = await app({ "app/_layout.tsx": "export default () => null;" });

		const check = await checkGestureHandlerRoot(config(root));

		expect(check.status).toBe("warn");
		expect(check.fix).toContain("DelacourProvider");
		expect(check.fix).toContain("GestureHandlerRootView");
		expect(check.fix?.indexOf("DelacourProvider")).toBeLessThan(check.fix?.indexOf("GestureHandlerRootView") ?? -1);
	});
});
