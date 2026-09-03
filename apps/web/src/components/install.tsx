import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import type { ReactElement } from "react";
import { gitConfig } from "@/lib/shared";
import { type InstallEntry, type InstallGroup, type InstallName, install } from "@/registry/install";

/**
 * The four package managers an Expo app is plausibly on, and how each spells
 * the three verbs this site needs.
 *
 * `expo` is not a stylistic variant of `add`. Expo pins every native module to a
 * version its SDK can build, and `bun add react-native-reanimated` fetches the
 * newest release instead — which on any older SDK is a package that fails at the
 * linker rather than at install time. That is why the registry splits
 * `dependencies` from `expoDependencies`, and why this table has a third column.
 */
const MANAGERS = [
	{ id: "bun", add: "bun add", dev: "bun add -d", dlx: "bunx", expo: "bunx expo install" },
	{ id: "npm", add: "npm install", dev: "npm install -D", dlx: "npx", expo: "npx expo install" },
	{ id: "pnpm", add: "pnpm add", dev: "pnpm add -D", dlx: "pnpm dlx", expo: "pnpm dlx expo install" },
	{ id: "yarn", add: "yarn add", dev: "yarn add -D", dlx: "yarn dlx", expo: "yarn dlx expo install" },
] as const;

type Manager = (typeof MANAGERS)[number];
type Verb = "add" | "dev" | "dlx" | "expo";

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
 * The three ways to get a component, on the component's own page.
 *
 * Everything here is read from `@/registry/install`, which is derived from the
 * registry, which is derived from the library's source. Nothing on this block is
 * transcribed, so nothing on it can be wrong about which packages a component
 * needs or which files it is made of.
 */
export function ComponentInstall({ name }: { name: InstallName }): ReactElement {
	const entry: InstallEntry | undefined = install[name];

	if (!entry) {
		throw new Error(
			`Unknown component "${name}". Run \`bun run gen-install\` from apps/web, ` +
				"or check src/registry/install.ts for the names that exist."
		);
	}

	return (
		<Tabs items={["Command", "Package", "Manual"]}>
			<Tab value="Command">
				<InstallTabs commands={[{ verb: "dlx", packages: [`delacour@alpha add ${entry.name} --install`] }]} />
				<p className="text-fd-muted-foreground text-sm">
					Copies the source into your project, with everything it depends on. Run <code>delacour init</code> first if
					you have not already.
				</p>
				<Requires entry={entry} />
			</Tab>

			<Tab value="Package">
				<InstallTabs
					commands={[
						{ verb: "add", packages: ["delacour-react-native-ui@alpha"] },
						{ verb: "expo", packages: entry.expo },
					]}
				/>
				<DynamicCodeBlock code={`import { ${entry.exportName} } from "${entry.importPath}";`} lang="tsx" />
			</Tab>

			<Tab value="Manual">
				<Steps>
					<Step>
						<h4>Install the following dependencies</h4>
						<InstallTabs
							commands={[
								{ verb: "expo", packages: entry.expo },
								{ verb: "add", packages: entry.npm },
								{ verb: "dev", packages: entry.dev },
							]}
						/>
					</Step>

					<Step>
						<h4>Copy the following files into your project</h4>
						<FileGroups entry={entry} />
					</Step>

					<Step>
						<h4>Update the import paths to match your project setup</h4>
						<p>
							The library imports its neighbours by relative path — <code>../icon</code>, <code>../../lib/cn</code>.
							Repoint them at wherever you put the files above.
						</p>
					</Step>
				</Steps>

				<Callout title="That is a lot of files">
					{entry.fileCount} of them, across {entry.groups.length} folders. The <strong>Command</strong> tab does all
					three steps in one line, and rewrites the imports onto your own paths while it copies.
				</Callout>
			</Tab>
		</Tabs>
	);
}

/**
 * The external packages this component needs, on the tab that installs them.
 *
 * `add` prints exactly this list and then asks before running anything, so the
 * page and the command agree about what is about to happen. Dropping
 * `--install` from the command above is how you get asked instead.
 *
 * The counts are the closure's, not the component's own: `button` declares one
 * package and needs eight, because it renders an icon and a pressable.
 */
function Requires({ entry }: { entry: InstallEntry }): ReactElement | null {
	const total = entry.expo.length + entry.npm.length + entry.dev.length;
	if (total === 0) return null;

	return (
		<Accordions>
			<Accordion title={`Installs ${total} external package${total === 1 ? "" : "s"}`}>
				<p className="mt-0 text-fd-muted-foreground text-sm">
					Dependencies of the component and of everything it renders. <code>--install</code> runs these for you; without
					it <code>add</code> prints them and asks.
				</p>
				<InstallTabs
					commands={[
						{ verb: "expo", packages: entry.expo },
						{ verb: "add", packages: entry.npm },
						{ verb: "dev", packages: entry.dev },
					]}
				/>
			</Accordion>
		</Accordions>
	);
}

/**
 * The files, grouped by what they are.
 *
 * The component and the components it renders are listed inline; the shared
 * utilities are collapsed, because they are what `delacour init` writes once per
 * project and a reader adding their second component has already got them.
 */
function FileGroups({ entry }: { entry: InstallEntry }): ReactElement {
	const inline = entry.groups.filter((group) => group.kind !== "shared");
	const shared = entry.groups.filter((group) => group.kind === "shared");
	const sharedCount = shared.reduce((total, group) => total + group.files.length, 0);

	return (
		<div className="flex flex-col gap-4">
			{inline.map((group) => (
				<FileList group={group} key={group.name} />
			))}

			{shared.length === 0 ? null : (
				<Accordions>
					<Accordion title={`Shared utilities — ${sharedCount} files, copied once per project`}>
						<div className="flex flex-col gap-4">
							{shared.map((group) => (
								<FileList group={group} key={group.name} />
							))}
						</div>
					</Accordion>
				</Accordions>
			)}
		</div>
	);
}

function FileList({ group }: { group: InstallGroup }): ReactElement {
	return (
		<div>
			<p className="mb-1 font-medium text-sm">{group.title}</p>
			<ul className="m-0 list-none p-0 text-sm">
				{group.files.map((file) => (
					<li className="m-0 flex flex-wrap items-baseline gap-x-2 py-0.5" key={file.source}>
						<a
							className="font-mono text-fd-foreground text-xs underline underline-offset-4 hover:text-fd-muted-foreground"
							href={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/${file.source}`}
							rel="noreferrer noopener"
							target="_blank"
						>
							{file.source.replace("packages/native-ui/src/", "")}
						</a>
						<span className="font-mono text-fd-muted-foreground text-xs">→ {file.target}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
