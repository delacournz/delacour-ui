import { describe, expect, test } from "bun:test";
import { resolveConfig } from "../config/resolve";
import { configSchema } from "../config/schema";
import { transformFile } from "./write-files";

function config(prefix?: string) {
	const parsed = configSchema.parse({
		paths: {
			ui: "src/components/ui",
			lib: "src/lib",
			hooks: "src/hooks",
			styles: "src/styles",
			icons: "src/lib/icons",
		},
		aliases: { ui: "@/components/ui" },
		prefix,
	});
	return resolveConfig(parsed, "/app", "/app/native-components.json");
}

const PROVIDER = [
	'import { cn } from "@registry/ui/icon";',
	"export function DelacourProvider() {}",
	'DelacourProvider.displayName = "DelacourUI.Provider";',
].join("\n");

const PATH = "/app/src/components/ui/provider/provider.tsx";

describe("transformFile", () => {
	test("keeps the library's names without a prefix", () => {
		const file = transformFile(PROVIDER, PATH, config());

		expect(file).toContain('"DelacourUI.Provider"');
		expect(file).toContain("export function DelacourProvider()");
	});

	test("swaps in the config's prefix beside the alias rewrite", () => {
		const file = transformFile(PROVIDER, PATH, config("UI"));

		expect(file).toContain('from "@/components/ui/icon"');
		expect(file).toContain('UIProvider.displayName = "UI.Provider";');
		expect(file).not.toContain("Delacour");
	});
});

describe("prefix in the config", () => {
	test("rejects one that cannot head an identifier", () => {
		const paths = { ui: "a", lib: "b", hooks: "c", styles: "d", icons: "e" };

		expect(configSchema.safeParse({ paths, prefix: "ui" }).success).toBe(false);
		expect(configSchema.safeParse({ paths, prefix: "My UI" }).success).toBe(false);
		expect(configSchema.safeParse({ paths, prefix: "UI" }).success).toBe(true);
	});
});
