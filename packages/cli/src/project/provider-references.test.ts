import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { findProviderReferences } from "./provider-references";

const roots: string[] = [];

async function tree(files: Record<string, string>): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "delacour-references-"));
	roots.push(root);

	for (const [path, content] of Object.entries(files)) {
		await mkdir(dirname(join(root, path)), { recursive: true });
		await writeFile(join(root, path), content, "utf-8");
	}

	return root;
}

afterAll(async () => {
	await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
});

describe("findProviderReferences", () => {
	test("lists the project's own files that still name the provider, and none of the copies", async () => {
		const root = await tree({
			"src/app/_layout.tsx": 'import { DelacourProvider } from "@/components/ui/provider";\n',
			"App.tsx": "<DelacourProvider>",
			"src/components/ui/provider/provider.tsx": "export function DelacourProvider() {}\n",
			"src/screens/home.tsx": "export const Home = null;\n",
			"src/lib/types.ts": "type P = DelacourProviderProps;\n",
			"node_modules/x/index.js": "DelacourProvider",
			"ios/App/main.tsx": "DelacourProvider",
			"README.md": "DelacourProvider",
		});

		const found = await findProviderReferences(root, [join(root, "src/components/ui")], "DelacourProvider");

		expect(found).toEqual(["App.tsx", "src/app/_layout.tsx", "src/lib/types.ts"]);
	});

	test("does not match a longer name that merely starts with it", async () => {
		const root = await tree({ "a.ts": "DelacourProviderish\n" });

		await expect(findProviderReferences(root, [], "DelacourProvider")).resolves.toEqual([]);
	});
});
