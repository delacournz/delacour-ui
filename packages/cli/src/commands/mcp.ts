import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { findConfig, readConfig } from "../config/resolve";
import { CONFIG_FILENAME } from "../config/schema";
import { detectProject } from "../project/detect";
import { commandLine } from "../project/package-manager";
import { createRegistryClient } from "../registry/client";
import { resolveItemGraph } from "../registry/resolve";
import { type AddResult, add } from "./add";
import { runChecks } from "./doctor";
import { init } from "./init";

/**
 * The same commands, over MCP, for an agent working inside someone's project.
 *
 * An agent asked to "add a button" would otherwise write one from memory —
 * plausible JSX that misses the parts that matter here: the icon inheritance,
 * the spinner swap that costs no layout, the `expo install` route for the
 * native modules underneath. Handing it the registry instead means it copies
 * the real component and reads the real docs.
 *
 * Every tool is a thin wrapper over the function the CLI command calls, so
 * there is one implementation of `add` and not two.
 */

export type McpOptions = {
	cwd: string;
	ref?: string;
	registry?: string;
};

export async function mcp(options: McpOptions): Promise<void> {
	const server = new McpServer({ name: "delacour", version: "0.1.0" }, { capabilities: { tools: {} } });

	const openRegistry = async () => {
		const configPath = findConfig(options.cwd);
		const config = configPath ? await readConfig(configPath) : null;

		return createRegistryClient({
			cwd: options.cwd,
			url: options.registry ?? config?.registry.url,
			ref: options.ref ?? config?.registry.ref,
		});
	};

	server.registerTool(
		"list_components",
		{
			title: "List components",
			description:
				"Every component and utility in the delacour registry, with what each one is for. Call this before writing any React Native UI in this project — a component that exists here should be added, not written from scratch.",
			inputSchema: {},
		},
		async () => {
			const index = await (await openRegistry()).getIndex();

			return text(
				index.items
					.map((item) => `${item.name} (${item.type.replace("registry:", "")}) — ${item.description}`)
					.join("\n")
			);
		}
	);

	server.registerTool(
		"get_component",
		{
			title: "Get a component",
			description:
				"One registry item: its source files, the components it pulls in, and the packages it needs. Read this before using a component, so its actual API and doc comments are in hand rather than guessed at.",
			inputSchema: { name: z.string().describe("Component name, e.g. `button`") },
		},
		async ({ name }) => {
			const client = await openRegistry();
			const item = await client.loadItem(await client.getItem(name));
			const index = await client.getIndex();
			const byName = new Map(index.items.map((entry) => [entry.name, entry]));
			const closure = resolveItemGraph([name], (candidate) => byName.get(candidate)).filter((c) => c !== name);

			return text(
				[
					`# ${item.title} (${item.name})`,
					item.description,
					"",
					closure.length > 0 ? `Copies in: ${closure.join(", ")}` : "",
					item.expoDependencies.length > 0 ? `expo install: ${item.expoDependencies.join(" ")}` : "",
					item.dependencies.length > 0 ? `npm: ${item.dependencies.join(" ")}` : "",
					"",
					...item.files.map((file) => `## ${file.namespace}/${file.target}\n\n\`\`\`tsx\n${file.content}\n\`\`\``),
				]
					.filter(Boolean)
					.join("\n")
			);
		}
	);

	server.registerTool(
		"add_components",
		{
			title: "Add components",
			description:
				"Copy components into this project, with their dependencies, rewritten imports and installs. Prefer this over writing the files yourself — it routes native modules through `expo install` so the SDK picks a buildable version. A project with no `native-components.json` is set up first, so this works on a bare Expo app; call `init_project` instead when the layout has to be chosen — a monorepo, or a source directory that is not `src`.",
			inputSchema: {
				names: z.array(z.string()).describe("Component names to add"),
				overwrite: z.boolean().optional().describe("Replace files that differ from the registry"),
				install: z
					.boolean()
					.optional()
					.describe(
						"Run the project's package manager to install what the components need. Defaults to false — the reply lists the commands instead, so you can decide."
					),
			},
		},
		async ({ names, overwrite, install }) => {
			const result = await add(names, {
				cwd: options.cwd,
				ref: options.ref,
				registry: options.registry,
				overwrite,
				install: install ?? false,
				yes: true,
				silent: true,
			});

			if (!result) return text(`Nothing was added for: ${names.join(", ")}. Check the names against list_components.`);

			return text(describeAdd(result).join("\n"));
		}
	);

	server.registerTool(
		"init_project",
		{
			title: "Set this project up",
			description:
				"Write `native-components.json`, wrap Metro with Uniwind's transform, point Tailwind at where the components will land, and copy the theme and the root provider in. `add_components` does all of this on its own for a plain app — call this one when the layout is not the default: a monorepo where the components belong to a shared package, or a source directory that is not `src`.",
			inputSchema: {
				src: z.string().optional().describe("Base directory for source files, e.g. `src` or `.`"),
				packageName: z
					.string()
					.optional()
					.describe("Put the components in a shared package with this name, e.g. `@acme/ui`"),
				packagePath: z
					.string()
					.optional()
					.describe("Where that package goes, relative to the workspace root. Defaults to `packages/ui`"),
				force: z.boolean().optional().describe("Rewrite an existing `native-components.json`"),
				install: z
					.boolean()
					.optional()
					.describe(
						"Run the project's package manager to install what the theme and provider need. Defaults to false — the reply lists the commands instead."
					),
			},
		},
		async ({ src, packageName, packagePath, force, install }) => {
			const result = await init([], {
				cwd: options.cwd,
				ref: options.ref,
				registry: options.registry,
				src,
				packageName,
				packagePath,
				force,
				install: install ?? false,
				yes: true,
				silent: true,
			});

			const configPath = findConfig(options.cwd);

			return text(
				[
					configPath ? `Set up. ${CONFIG_FILENAME} is at ${configPath}.` : "Nothing was written.",
					...(result ? describeAdd(result) : []),
					"Two things are left, because each is an edit to a file the user owns:",
					"  import the CSS entry as the FIRST statement of the root layout — without it every component renders unstyled, and nothing logs an error",
					"  wrap the app in `<DelacourProvider>` — without it presses stop landing, just as silently",
					"Run check_project once both are done.",
				].join("\n")
			);
		}
	);

	server.registerTool(
		"check_project",
		{
			title: "Check the project setup",
			description:
				"Run the Expo wiring checks: Metro's Uniwind wrapper, the Tailwind `@source` globs, New Architecture, path aliases, GestureHandlerRootView. Use this when a component renders unstyled or does not respond to presses — those failures are silent and this names them.",
			inputSchema: {},
		},
		async () => {
			const configPath = findConfig(options.cwd);
			if (!configPath) return text(`No ${CONFIG_FILENAME} found. Run \`delacour init\` first.`);

			const project = await detectProject((await readConfig(configPath)).app.resolved.root);
			const checks = await runChecks({ cwd: options.cwd, silent: true });

			return text(
				[
					`Expo ${project.expoVersion ?? "not found"}, package manager ${project.packageManager}.`,
					...checks.map((check) =>
						[`${check.status.toUpperCase()}: ${check.name} — ${check.detail}`, check.fix ? `  fix: ${check.fix}` : ""]
							.filter(Boolean)
							.join("\n")
					),
				].join("\n")
			);
		}
	);

	await server.connect(new StdioServerTransport());
}

function text(body: string) {
	return { content: [{ type: "text" as const, text: body }] };
}

/**
 * Everything `add` would have printed, which under `--silent` it did not.
 *
 * Left out, an agent copies a component and never learns that it needs a
 * package the project has not got. Shared by `add_components` and
 * `init_project`, because `init` ends in an `add` and owes the same report.
 */
function describeAdd(result: AddResult): string[] {
	const { dependencies } = result;
	const lines = [`Added ${result.items.join(", ")} — ${result.written} files.`];

	if (dependencies.missing.length === 0) {
		if (dependencies.wanted.length > 0) lines.push("Every package they need is already installed.");
	} else if (result.installed) {
		lines.push(`Installed: ${dependencies.missing.join(", ")}.`);
	} else {
		lines.push(
			"Not installed. These have to be run from the app before it will build:",
			...dependencies.groups.map((group) => `  ${commandLine(group)}`),
			"Re-run with install: true to have them run for you."
		);
	}

	if (dependencies.groups.some((group) => group.label === "expo install")) {
		lines.push("A native module changed — rebuild the dev client; a JS reload will not pick it up.");
	}

	return lines;
}
