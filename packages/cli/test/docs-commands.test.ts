import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { commandManifest } from "../src/commands/manifest";
import { program } from "../src/program";

/**
 * Every `delacour …` a reader can copy is a command this CLI actually has.
 *
 * The documentation is full of commands, spread across an MDX site, three
 * READMEs and the agent skill, and each one is a transcription. `commands.mdx`
 * already pastes `--help` verbatim rather than restating it — because a
 * hand-written table had already gone wrong about `init`'s `--package-name` —
 * and a *command in prose* goes wrong the same way, more quietly: it is right
 * until a flag moves, and then it is wrong in a reader's terminal, under this
 * library's name.
 *
 * So the manifest is read off the commander program, and every copyable
 * invocation in the repository is checked against it. Only copyable ones: a
 * runner prefix (`bunx`, `npx`, `pnpm dlx`, `yarn dlx`), a line in a shell
 * fence, or an `<InstallTabs>` entry. Prose that merely names the CLI is not a
 * command and is not checked.
 */

const ROOT = join(import.meta.dirname, "../../..");
const COMMANDS = commandManifest(program);
const BY_NAME = new Map(
	COMMANDS.flatMap((command) => [command, ...command.aliases.map(() => command)].map((c) => [c.name, c]))
);

for (const command of COMMANDS) {
	for (const alias of command.aliases) BY_NAME.set(alias, command);
}

const ITEMS: Set<string> = new Set(
	(JSON.parse(readFileSync(join(ROOT, "registry/registry.json"), "utf-8")) as { items: { name: string }[] }).items.map(
		(item) => item.name
	)
);

/** Everything a reader might copy a command out of. */
const SOURCES = [
	...walk(join(ROOT, "apps/web/content/docs"), [".mdx"]),
	...walk(join(ROOT, "apps/web/src/components"), [".ts", ".tsx"]),
	...walk(join(ROOT, "packages/skills/src"), [".ts"]),
	join(ROOT, "README.md"),
	join(ROOT, "AGENTS.md"),
	join(ROOT, "packages/cli/README.md"),
];

type Invocation = { file: string; line: number; text: string };

function walk(directory: string, extensions: string[]): string[] {
	return readdirSync(directory, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension)))
		.map((entry) => join(entry.parentPath, entry.name));
}

/**
 * A `delacour …` someone can paste, with the noise around it removed.
 *
 * Three shapes, because that is how the repository carries a command: behind a
 * runner (`bunx delacour add button`), at the start of a shell-fence line, and
 * as a string in one of the two structured carriers — `<InstallTabs>`'s
 * `packages` array and the landing page's `copy.ts`.
 *
 * A quoted string anywhere else is deliberately **not** matched. Prose in a
 * doc-comment or a description reads like a command to a regular expression —
 * *"`delacour doctor` passes against the generated app"* — and a checker that
 * fails on an accurate sentence is a checker somebody turns off.
 */
function invocations(file: string): Invocation[] {
	const found: Invocation[] = [];

	readFileSync(file, "utf-8")
		.split("\n")
		.forEach((line, index) => {
			const patterns = [/(?:bunx|npx|pnpm dlx|yarn dlx)\s+(delacour(?:@[\w.-]+)?\s[^\n`"'\]]*)/g];

			if (/^\s*delacour(@[\w.-]+)?\s/.test(line)) patterns.push(/^\s*(delacour(?:@[\w.-]+)?\s.*)$/g);
			if (/\b(?:packages|command|install):/.test(line)) {
				patterns.push(/["'`](delacour(?:@[\w.-]+)?\s[^"'`]*)["'`]/g);
			}

			for (const pattern of patterns) {
				for (const [, text] of line.matchAll(pattern)) {
					if (text) found.push({ file: relative(ROOT, file), line: index + 1, text: clean(text) });
				}
			}
		});

	return found;
}

/**
 * Drop a trailing shell comment, the punctuation a sentence leaves behind, and
 * the escape a command quoted inside a TypeScript template literal carries —
 * the skill's markdown is a `.ts` module, so its backticks arrive as `\``.
 */
function clean(text: string): string {
	return text
		.replace(/\s+#.*$/, "")
		.replace(/\\+["'`]?$/, "")
		.replace(/[.,;:)\]]+$/, "")
		.trim();
}

function parse(text: string): { verb: string; tokens: string[] } {
	const [, ...rest] = text.split(/\s+/);
	return { verb: rest[0] ?? "", tokens: rest.slice(1) };
}

describe("every copyable command in the documentation", () => {
	const all = SOURCES.flatMap(invocations);

	test("there are some, so a broken scanner cannot pass silently", () => {
		expect(all.length).toBeGreaterThan(30);
	});

	test("names a command the CLI has", () => {
		const unknown = all
			.map((found) => ({ ...found, verb: parse(found.text).verb }))
			// `delacour <command> …` is the usage line, not an invocation.
			.filter((found) => !found.verb.startsWith("<") && !BY_NAME.has(found.verb))
			.map((found) => `${found.file}:${found.line} — delacour ${found.verb}`);

		expect(unknown).toEqual([]);
	});

	test("passes only flags that command has", () => {
		const wrong: string[] = [];

		for (const found of all) {
			const { verb, tokens } = parse(found.text);
			const command = BY_NAME.get(verb);
			if (!command) continue;

			for (const token of tokens) {
				if (!token.startsWith("--")) continue;
				const flag = token.split("=")[0];
				if (!command.flags.includes(flag)) wrong.push(`${found.file}:${found.line} — ${verb} ${flag}`);
			}
		}

		expect(wrong).toEqual([]);
	});

	test("takes positional arguments only where the command accepts them", () => {
		const wrong: string[] = [];

		for (const found of all) {
			const { verb, tokens } = parse(found.text);
			const command = BY_NAME.get(verb);
			if (!command || command.takesArguments) continue;
			if (positionals(command.flagsWithValue, tokens).length > 0) {
				wrong.push(`${found.file}:${found.line} — ${verb} takes no arguments`);
			}
		}

		expect(wrong).toEqual([]);
	});

	/**
	 * A component named in an example has to be in the registry. This is the one
	 * that catches a page written against a component that was renamed, which
	 * `add` reports as `Unknown item` in the reader's terminal.
	 */
	test("names components the registry actually holds", () => {
		const missing: string[] = [];

		for (const found of all) {
			const { verb, tokens } = parse(found.text);
			const command = BY_NAME.get(verb);
			if (!command || !["add", "view", "init"].includes(command.name)) continue;

			// A third-party registry holds its own items; `add card --registry
			// https://ui.acme.com/r` is a correct example of exactly that.
			if (/--registry\s/.test(found.text)) continue;

			for (const name of positionals(command.flagsWithValue, tokens)) {
				// A placeholder, not a name: `<name>`, `<component>`.
				if (name.startsWith("<") || name.startsWith("$")) continue;
				if (!ITEMS.has(name)) missing.push(`${found.file}:${found.line} — ${verb} ${name}`);
			}
		}

		expect(missing).toEqual([]);
	});
});

/** Tokens that are neither a flag nor a flag's value. */
function positionals(flagsWithValue: readonly string[], tokens: readonly string[]): string[] {
	const out: string[] = [];

	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index] as string;

		if (token.startsWith("-")) {
			if (flagsWithValue.includes(token.split("=")[0] as string) && !token.includes("=")) index += 1;
			continue;
		}

		out.push(token);
	}

	return out;
}
