import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { COMPONENTS, findSkill, SKILLS, type Skill } from "./index";
import { type RegistryEntry, renderComponents } from "./render-components";

/**
 * A skill is prose, so most of it cannot be tested. What can be is the shape an
 * agent host requires — frontmatter it parses, a `SKILL.md` first — and the one
 * claim in it that is derived rather than written: the component list.
 *
 * The commands are pinned too. A skill telling an agent to run a command the
 * CLI does not have is worse than a skill that says nothing, because the agent
 * will report the failure as the library's.
 */

const REGISTRY = join(import.meta.dirname, "../../../registry/registry.json");

function frontmatter(skill: Skill): Record<string, string> {
	const body = skill.files[0]?.content ?? "";
	const match = /^---\n([\s\S]*?)\n---\n/.exec(body);
	if (!match) throw new Error(`${skill.name}/SKILL.md has no frontmatter`);

	const fields: Record<string, string> = {};
	let key: string | null = null;

	for (const line of match[1].split("\n")) {
		const started = /^([a-z-]+):\s*(.*)$/.exec(line);
		if (started) {
			key = started[1];
			fields[key] = started[2].replace(/^>-?\s*/, "");
		} else if (key) {
			fields[key] = `${fields[key]} ${line.trim()}`.trim();
		}
	}

	return fields;
}

describe("every skill", () => {
	test("there is at least one, and names are unique", () => {
		expect(SKILLS.length).toBeGreaterThan(0);
		expect(new Set(SKILLS.map((skill) => skill.name)).size).toBe(SKILLS.length);
	});

	for (const skill of SKILLS) {
		describe(skill.name, () => {
			test("leads with SKILL.md", () => {
				expect(skill.files[0]?.path).toBe("SKILL.md");
			});

			test("carries frontmatter an agent host can parse", () => {
				const fields = frontmatter(skill);

				expect(fields.name).toBe(skill.name);
				// Long enough to route on. A one-liner is why a skill never triggers.
				expect(fields.description.length).toBeGreaterThan(80);
			});

			test("every file has content, and no path escapes the skill directory", () => {
				for (const file of skill.files) {
					expect(file.content.trim().length).toBeGreaterThan(0);
					expect(file.path).not.toStartWith("/");
					expect(file.path).not.toInclude("..");
				}
			});

			test("names no command the CLI does not have", () => {
				const commands = new Set([
					"add",
					"init",
					"list",
					"ls",
					"search",
					"view",
					"info",
					"diff",
					"doctor",
					"theme",
					"mcp",
					"skills",
				]);

				for (const file of skill.files) {
					for (const [, verb] of file.content.matchAll(/delacour(?:@alpha)?\s+([a-z-]+)/g)) {
						expect({ file: file.path, verb, known: commands.has(verb) }).toEqual({
							file: file.path,
							verb,
							known: true,
						});
					}
				}
			});
		});
	}
});

describe("the delacour-ui skill", () => {
	const skill = findSkill("delacour-ui");
	const body = skill?.files[0]?.content ?? "";

	test("exists", () => {
		expect(skill).toBeDefined();
	});

	/**
	 * The two failures with no error message. A skill that omits either produces
	 * an app that builds, runs, and is wrong — which is the whole reason the
	 * file is worth shipping.
	 */
	test("states both silent failures", () => {
		expect(body).toInclude("DelacourProvider");
		expect(body).toMatch(/first statement/i);
	});

	test("routes native modules through expo install", () => {
		expect(body).toInclude("expo install");
	});

	/**
	 * The frontmatter names components on purpose — a description with no
	 * concrete nouns in it is a skill that never triggers. The body is the part
	 * that must not: a catalogue on someone's disk is stale the day the next
	 * component ships, and the staleness is silent.
	 */
	test("the body carries no component catalogue, only the command that produces one", () => {
		const prose = body.replace(/^---\n[\s\S]*?\n---\n/, "");
		const named = COMPONENTS.filter((component) => prose.includes(`\`${component.name}\``));

		expect(named.map((component) => component.name)).toEqual([]);
		expect(prose).toInclude("delacour@alpha list");
	});
});

describe("the component list", () => {
	test("matches the registry, exactly", async () => {
		const index = (await Bun.file(REGISTRY).json()) as { items: RegistryEntry[] };

		expect(renderComponents(index.items)).toBe(
			await Bun.file(join(import.meta.dirname, "components.generated.ts")).text()
		);
	});

	test("is components, not the utilities they pull in", () => {
		expect(COMPONENTS.map((component) => component.name)).toContain("button");
		expect(COMPONENTS.map((component) => component.name)).not.toContain("cn");
	});
});
