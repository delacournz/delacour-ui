import { COMPONENTS } from "./components.generated";
import { RULES_MD, TROUBLESHOOTING_MD } from "./delacour-ui/references";
import { SKILL_MD } from "./delacour-ui/skill";

/**
 * The agent skill, as data.
 *
 * One source, two consumers: `delacour skills` writes these files into a
 * project, and the docs site serves them at `/skills/<name>/<path>` so an agent
 * with nothing installed can still fetch them. A second copy of the prose in
 * either place is a copy that drifts.
 *
 * Markdown is authored as template-string modules rather than `.md` files on
 * purpose: `packages/cli` bundles to a single `dist/index.js` with tsdown, and a
 * bundler moves TypeScript. An asset-copy step would mean `files` in the CLI's
 * `package.json` had to grow a second entry, and a published tarball that
 * silently lacked it would fail at the one moment nobody is watching — a
 * stranger's first `bunx delacour skills`.
 */

export type SkillFile = {
	/** Path relative to the skill's own directory. */
	readonly path: string;
	readonly content: string;
};

export type Skill = {
	readonly name: string;
	readonly description: string;
	/** `SKILL.md` first; an agent reads it and loads the rest on demand. */
	readonly files: readonly SkillFile[];
};

export const SKILLS: readonly Skill[] = [
	{
		name: "delacour-ui",
		description: "Build React Native and Expo interfaces with Delacour UI components.",
		files: [
			{ path: "SKILL.md", content: SKILL_MD },
			{ path: "references/rules.md", content: RULES_MD },
			{ path: "references/troubleshooting.md", content: TROUBLESHOOTING_MD },
		],
	},
];

export function findSkill(name: string): Skill | undefined {
	return SKILLS.find((skill) => skill.name === name);
}

export { COMPONENTS, type SkillComponent } from "./components.generated";
export { componentEntries, type RegistryEntry, renderComponents } from "./render-components";

/** What `skills --list` prints, and what the docs page counts. */
export const COMPONENT_COUNT = COMPONENTS.length;
