import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { findConfig, readConfig } from "../config/resolve";
import { CONFIG_FILENAME } from "../config/schema";
import { detectProject } from "../project/detect";
import { createRegistryClient } from "../registry/client";
import { resolveItemGraph } from "../registry/resolve";
import { add } from "./add";
import { runChecks } from "./doctor";

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
			const item = await client.getItem(name);
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
				"Copy components into this project, with their dependencies, rewritten imports and installs. Prefer this over writing the files yourself — it routes native modules through `expo install` so the SDK picks a buildable version.",
			inputSchema: {
				names: z.array(z.string()).describe("Component names to add"),
				overwrite: z.boolean().optional().describe("Replace files that differ from the registry"),
				install: z.boolean().optional().describe("Install dependencies. Defaults to true."),
			},
		},
		async ({ names, overwrite, install }) => {
			await add(names, {
				cwd: options.cwd,
				ref: options.ref,
				registry: options.registry,
				overwrite,
				install: install ?? true,
				yes: true,
				silent: true,
			});

			return text(`Added: ${names.join(", ")}. Rebuild the dev client if any native module was installed.`);
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
