import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SKILLS } from "@delacour/skills";
import { skills } from "../src/commands/skills";

/**
 * The skill's content is prose and is tested in `@delacour/skills`. What is
 * tested here is the only part that can be wrong in a way a reader notices: the
 * paths. A skill written where an assistant does not look is a skill that never
 * runs, and nothing reports it — the agent simply carries on writing React
 * Native from memory.
 */

const SHARED = { silent: true, yes: true } as const;
const directories: string[] = [];

async function scaffold(markers: string[] = []): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "delacour-skills-"));
	directories.push(root);

	for (const marker of markers) await mkdir(join(root, marker), { recursive: true });
	return root;
}

afterAll(async () => {
	await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("skills", () => {
	test("writes every file of every skill, under the detected assistant", async () => {
		const root = await scaffold([".claude"]);
		await skills([], { ...SHARED, cwd: root });

		for (const skill of SKILLS) {
			for (const file of skill.files) {
				const written = join(root, ".claude/skills", skill.name, file.path);
				expect(await Bun.file(written).exists()).toBe(true);
				expect(await readFile(written, "utf-8")).toBe(file.content);
			}
		}
	});

	test("writes for every assistant the project actually uses, and no others", async () => {
		const root = await scaffold([".claude", ".agents"]);
		await skills([], { ...SHARED, cwd: root });

		await expect(Bun.file(join(root, ".claude/skills/delacour-ui/SKILL.md")).exists()).resolves.toBe(true);
		await expect(Bun.file(join(root, ".agents/skills/delacour-ui/SKILL.md")).exists()).resolves.toBe(true);
		// Never seen Cursor here; a file in someone's diff they did not ask for.
		await expect(Bun.file(join(root, ".cursor/skills/delacour-ui/SKILL.md")).exists()).resolves.toBe(false);
	});

	test("falls back to Claude Code rather than writing nothing", async () => {
		const root = await scaffold();
		await skills([], { ...SHARED, cwd: root });

		await expect(Bun.file(join(root, ".claude/skills/delacour-ui/SKILL.md")).exists()).resolves.toBe(true);
	});

	test("--agent overrides detection", async () => {
		const root = await scaffold([".claude"]);
		await skills([], { ...SHARED, cwd: root, agent: ["cursor"] });

		await expect(Bun.file(join(root, ".cursor/skills/delacour-ui/SKILL.md")).exists()).resolves.toBe(true);
		await expect(Bun.file(join(root, ".claude/skills/delacour-ui/SKILL.md")).exists()).resolves.toBe(false);
	});

	test("--agent all writes for all four", async () => {
		const root = await scaffold();
		await skills([], { ...SHARED, cwd: root, agent: ["all"] });

		for (const directory of [".claude", ".cursor", ".opencode", ".agents"]) {
			await expect(Bun.file(join(root, directory, "skills/delacour-ui/SKILL.md")).exists()).resolves.toBe(true);
		}
	});

	test("refuses to replace an edited skill unless told to", async () => {
		const root = await scaffold([".claude"]);
		const path = join(root, ".claude/skills/delacour-ui/SKILL.md");

		await mkdir(join(root, ".claude/skills/delacour-ui"), { recursive: true });
		await writeFile(path, "mine", "utf-8");

		await skills([], { ...SHARED, cwd: root });
		expect(await readFile(path, "utf-8")).toBe("mine");

		await skills([], { ...SHARED, cwd: root, force: true });
		expect(await readFile(path, "utf-8")).not.toBe("mine");
	});

	test("--list writes nothing", async () => {
		const root = await scaffold([".claude"]);
		await skills([], { ...SHARED, cwd: root, list: true });

		await expect(Bun.file(join(root, ".claude/skills/delacour-ui/SKILL.md")).exists()).resolves.toBe(false);
	});

	test("names the skill and the agent it does not know", async () => {
		const root = await scaffold();

		await expect(skills(["nope"], { ...SHARED, cwd: root })).rejects.toThrow(/Unknown skill "nope"/);
		await expect(skills([], { ...SHARED, cwd: root, agent: ["vim"] })).rejects.toThrow(/Unknown agent "vim"/);
		await expect(skills([], { ...SHARED, cwd: root, scope: "global" })).rejects.toThrow(/Unknown scope "global"/);
	});
});
