/**
 * Derives the docs site's install data from the committed registry.
 *
 * Every component page carries a three-way install block — the CLI command, the
 * npm package, and the manual copy — and all three need the same facts: which
 * packages the component pulls in, and which files. Those facts already exist,
 * once, in `registry/r/*.json`, derived from `packages/native-ui/src` by the
 * registry builder. Reading them here rather than restating them by hand is what
 * stops the install instructions drifting from the component.
 *
 * A registry item names the library file itself — `files[].path` is already
 * repo-relative — so the Manual tab's GitHub link is that path, unmapped.
 *
 * The output is a committed `.ts` module rather than a JSON import, for the same
 * two reasons `previews/manifest.ts` is:
 *
 * - a literal type makes `<ComponentInstall name="buton" />` a compile error
 *   rather than a runtime 500 a reader discovers;
 * - `registry/` lives outside this app's Vite root, and a generated module needs
 *   no `server.fs.allow` entry and ships only the fields the page renders.
 *
 * Regenerate with `bun run gen-install` from `apps/web`. CI rebuilds it and
 * fails on a diff, the way it already does for `registry/` itself.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COMPONENTS } from "../src/lib/components";

const WEB = join(import.meta.dirname, "..");
const ROOT = join(WEB, "..", "..");
const REGISTRY = join(ROOT, "registry");
const OUT = join(WEB, "src", "registry", "install.ts");

/** Where `delacour init` proposes each namespace lands — `DEFAULT_PATHS` in the CLI. */
const DEFAULT_PATHS: Record<string, string> = {
	ui: "src/components/ui",
	lib: "src/lib",
	hooks: "src/hooks",
	styles: "src/styles",
	icons: "src/lib/icons",
};

type RegistryFile = { path: string; target: string; namespace: string };

type RegistryItem = {
	name: string;
	type: "registry:ui" | "registry:lib" | "registry:hook" | "registry:style";
	title: string;
	description: string;
	registryDependencies: string[];
	dependencies: string[];
	expoDependencies: string[];
	devDependencies: string[];
	files: RegistryFile[];
};

function readItems(): Map<string, RegistryItem> {
	const dir = join(REGISTRY, "r");
	const items = new Map<string, RegistryItem>();

	for (const entry of readdirSync(dir)) {
		if (!entry.endsWith(".json")) continue;
		const item = JSON.parse(readFileSync(join(dir, entry), "utf-8")) as RegistryItem;
		items.set(item.name, item);
	}

	if (items.size === 0) {
		throw new Error(`No registry items under ${dir}. Run \`bun --filter delacour run registry:build\`.`);
	}

	return items;
}

/**
 * The items that have to be copied with `name`, dependencies first.
 *
 * Depth-first post-order, mirroring `resolveItemGraph` in the CLI. `visiting`
 * guards a cycle: the library's own import rules forbid the shape that would
 * create one, but recursing forever is a worse failure than emitting an item
 * once and moving on.
 */
function closure(name: string, items: Map<string, RegistryItem>): string[] {
	const order: string[] = [];
	const done = new Set<string>();
	const visiting = new Set<string>();

	const visit = (current: string, requiredBy?: string): void => {
		if (done.has(current) || visiting.has(current)) return;

		const item = items.get(current);
		if (!item) {
			throw new Error(
				requiredBy
					? `"${current}" is not in the registry, required by "${requiredBy}"`
					: `"${current}" is not in the registry`
			);
		}

		visiting.add(current);
		for (const dependency of item.registryDependencies) visit(dependency, current);
		visiting.delete(current);

		done.add(current);
		order.push(current);
	};

	visit(name);
	return order;
}

/** `self` is the component, `component` is another one it renders, `shared` is what `init` writes once. */
function kindOf(item: RegistryItem, name: string): "self" | "component" | "shared" {
	if (item.name === name) return "self";
	return item.type === "registry:ui" ? "component" : "shared";
}

function build(): string {
	const items = readItems();
	const entries: string[] = [];

	for (const component of COMPONENTS) {
		const item = items.get(component.slug);
		if (!item) throw new Error(`No registry item for component "${component.slug}"`);

		const order = closure(component.slug, items);
		const resolved = order.map((n) => items.get(n) as RegistryItem);

		const union = (pick: (i: RegistryItem) => string[]): string[] => [...new Set(resolved.flatMap(pick))].sort();

		const groups = resolved
			.map((dependency) => ({
				name: dependency.name,
				title: dependency.title,
				kind: kindOf(dependency, component.slug),
				files: dependency.files.map((file) => {
					// Throws rather than falling through, the way the registry builder
					// does. A dead link here would ship on nineteen component pages.
					if (!existsSync(join(ROOT, file.path))) {
						throw new Error(`${component.slug}: ${file.path} does not exist`);
					}
					return { source: file.path, target: `${DEFAULT_PATHS[file.namespace]}/${file.target}` };
				}),
			}))
			// The component first, then what it renders, then the shared utilities —
			// which is the order someone copying by hand actually wants them in.
			.sort((a, b) => rank(a.kind) - rank(b.kind));

		entries.push(
			serialiseEntry({
				name: component.slug,
				title: component.name,
				description: item.description,
				importPath: `@delacour/native-ui/${component.slug}`,
				exportName: component.name,
				expo: union((i) => i.expoDependencies),
				npm: union((i) => i.dependencies),
				dev: union((i) => i.devDependencies),
				groups,
				fileCount: groups.reduce((total, group) => total + group.files.length, 0),
			})
		);
	}

	return `${HEADER}\n\nexport const install = {\n${entries.join("\n")}} as const satisfies Record<string, InstallEntry>;\n\nexport type InstallName = keyof typeof install;\n`;
}

function rank(kind: "self" | "component" | "shared"): number {
	return kind === "self" ? 0 : kind === "component" ? 1 : 2;
}

type Entry = {
	name: string;
	title: string;
	description: string;
	importPath: string;
	exportName: string;
	expo: string[];
	npm: string[];
	dev: string[];
	groups: { name: string; title: string; kind: string; files: { source: string; target: string }[] }[];
	fileCount: number;
};

const q = (value: string): string => JSON.stringify(value);
const list = (values: string[]): string => (values.length === 0 ? "[]" : `[${values.map(q).join(", ")}]`);

function serialiseEntry(entry: Entry): string {
	const groups = entry.groups
		.map((group) => {
			const files = group.files
				.map((file) => `\t\t\t\t\t{ source: ${q(file.source)}, target: ${q(file.target)} },`)
				.join("\n");
			return `\t\t\t{\n\t\t\t\tname: ${q(group.name)},\n\t\t\t\ttitle: ${q(group.title)},\n\t\t\t\tkind: ${q(group.kind)},\n\t\t\t\tfiles: [\n${files}\n\t\t\t\t],\n\t\t\t},`;
		})
		.join("\n");

	return [
		`\t${q(entry.name)}: {`,
		`\t\tname: ${q(entry.name)},`,
		`\t\ttitle: ${q(entry.title)},`,
		`\t\tdescription: ${q(entry.description)},`,
		`\t\timportPath: ${q(entry.importPath)},`,
		`\t\texportName: ${q(entry.exportName)},`,
		`\t\texpo: ${list(entry.expo)},`,
		`\t\tnpm: ${list(entry.npm)},`,
		`\t\tdev: ${list(entry.dev)},`,
		`\t\tfileCount: ${entry.fileCount},`,
		"\t\tgroups: [",
		groups,
		"\t\t],",
		"\t},",
	].join("\n");
}

const HEADER = `// Generated by apps/web/scripts/gen-install-manifest.ts. Do not edit.
//
// Regenerate with \`bun run gen-install\` from apps/web. The data is derived from
// \`registry/r/*.json\`, which the registry builder derives from
// \`packages/native-ui/src\` — so the install instructions on a component page
// cannot disagree with the component.

/** One file to copy: where it lives here, and where \`delacour init\` would put it. */
export type InstallFile = {
	/** Repo-relative, for a GitHub link. */
	readonly source: string;
	/** The default destination in a consumer's project. */
	readonly target: string;
};

/**
 * Files grouped by the registry item they belong to.
 *
 * \`self\` is the component itself, \`component\` is another component it renders,
 * and \`shared\` is a utility \`delacour init\` writes once per project — which is
 * why the last group is collapsed rather than listed inline.
 */
export type InstallGroup = {
	readonly name: string;
	readonly title: string;
	readonly kind: "self" | "component" | "shared";
	readonly files: readonly InstallFile[];
};

export type InstallEntry = {
	readonly name: string;
	readonly title: string;
	readonly description: string;
	readonly importPath: string;
	readonly exportName: string;
	/** Installed with \`expo install\`, so the SDK resolves a version it can build. */
	readonly expo: readonly string[];
	/** Plain JavaScript, installed with the project's package manager. */
	readonly npm: readonly string[];
	readonly dev: readonly string[];
	readonly groups: readonly InstallGroup[];
	readonly fileCount: number;
};`;

writeFileSync(OUT, build());
console.log(`Wrote ${OUT}`);
