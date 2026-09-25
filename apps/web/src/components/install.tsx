import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import type { ReactElement } from "react";
import { gitConfig } from "@/lib/shared";
import { type InstallEntry, type InstallName, install, peers } from "@/registry/install";

/**
 * The four package managers an Expo app is plausibly on, and how each spells
 * the five verbs this site needs.
 *
 * `expo` is not a stylistic variant of `add`. Expo pins every native module to a
 * version its SDK can build, and `bun add react-native-reanimated` fetches the
 * newest release instead — which on any older SDK is a package that fails at the
 * linker rather than at install time. That is why the registry splits
 * `dependencies` from `expoDependencies`, and why this table has a third column.
 *
 * `create` is the scaffolding verb — `<pm> create expo-app my-app` — which all
 * four spell the same way apart from the manager's own name.
 */
const MANAGERS = [
	{ id: "bun", add: "bun add", dev: "bun add -d", dlx: "bunx", expo: "bunx expo install", create: "bun create" },
	{ id: "npm", add: "npm install", dev: "npm install -D", dlx: "npx", expo: "npx expo install", create: "npm create" },
	{
		id: "pnpm",
		add: "pnpm add",
		dev: "pnpm add -D",
		dlx: "pnpm dlx",
		expo: "pnpm dlx expo install",
		create: "pnpm create",
	},
	{
		id: "yarn",
		add: "yarn add",
		dev: "yarn add -D",
		dlx: "yarn dlx",
		expo: "yarn dlx expo install",
		create: "yarn create",
	},
] as const;

type Manager = (typeof MANAGERS)[number];
type Verb = "add" | "dev" | "dlx" | "expo" | "create";

export type InstallTabsProps = {
	/** One line per verb. A line whose package list is empty is dropped. */
	commands: readonly { verb: Verb; packages: readonly string[] }[];
};

const ITEMS = MANAGERS.map((manager) => manager.id);

function render(manager: Manager, commands: InstallTabsProps["commands"]): string {
	return commands
		.filter((command) => command.packages.length > 0)
		.map((command) => `${manager[command.verb]} ${command.packages.join(" ")}`)
		.join("\n");
}

/**
 * One command, spelled four ways.
 *
 * Fumadocs ships no equivalent — `fumadocs-docgen`'s ```package-install fence is
 * the nearest thing and it cannot express `expo install`, which is the split
 * that decides whether an Expo build compiles. Hence this.
 */
export function InstallTabs({ commands }: InstallTabsProps): ReactElement {
	return (
		<Tabs items={ITEMS}>
			{MANAGERS.map((manager) => (
				<Tab key={manager.id} value={manager.id}>
					<DynamicCodeBlock code={render(manager, commands)} lang="bash" />
				</Tab>
			))}
		</Tabs>
	);
}

/**
 * The whole library as a package, on the Installation page.
 *
 * The peer list is `peers` from `@/registry/install` — the union of every
 * component's closure, filtered to what `package.json` declares — rather than a
 * list typed here. Three hand-written copies of it once disagreed, and the one a
 * reader saw was missing `expo-linear-gradient`; a derived list cannot be.
 */
export function LibraryInstall(): ReactElement {
	return (
		<InstallTabs
			commands={[
				{ verb: "add", packages: ["@delacour/react-native-ui@alpha"] },
				{ verb: "expo", packages: peers.expo },
				{ verb: "add", packages: peers.npm },
			]}
		/>
	);
}

/**
 * How to get a component, on the component's own page: import it from the
 * package, or copy its source in with the CLI.
 *
 * There is no manual path. Copying a component by hand meant dozens of files
 * across several folders and repointing every relative import, and the CLI does
 * exactly that in one line — so the page offers the line.
 *
 * Everything here is read from `@/registry/install`, which is derived from the
 * registry, which is derived from the library's source.
 */
export function ComponentInstall({ name }: { name: InstallName }): ReactElement {
	const entry = entryFor(name);

	return (
		<>
			<p>
				{entry.title} ships with the library — <a href="/docs/native/getting-started/installation">install it once</a>,
				then import:
			</p>
			<DynamicCodeBlock code={`import { ${entry.exportName} } from "${entry.importPath}";`} lang="tsx" />
			<p>Or copy the source into your project, to own and edit it:</p>
			<InstallTabs commands={[{ verb: "dlx", packages: [`delacour@alpha add ${entry.name}`] }]} />
		</>
	);
}

/**
 * The component's folder in the library, on GitHub — the **Open Source** button
 * in the docs toolbar. Every file of a component's own group lives in one
 * folder, so the first file's directory is the folder. `null` for a slug the
 * manifest does not know.
 */
export function componentSourceUrl(name: string): string | null {
	if (!(name in install)) return null;
	const source = entryFor(name as InstallName).groups.find((group) => group.kind === "self")?.files[0]?.source;
	if (!source) return null;
	const folder = source.slice(0, source.lastIndexOf("/"));
	return `https://github.com/${gitConfig.user}/${gitConfig.repo}/tree/${gitConfig.branch}/${folder}`;
}

function entryFor(name: InstallName): InstallEntry {
	const entry: InstallEntry | undefined = install[name];

	if (!entry) {
		throw new Error(
			`Unknown component "${name}". Run \`bun run gen-install\` from apps/web, ` +
				"or check src/registry/install.ts for the names that exist."
		);
	}

	return entry;
}
