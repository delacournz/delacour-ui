import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runChecks } from "../src/commands/doctor";
import { init } from "../src/commands/init";
import { theme } from "../src/commands/theme";

/**
 * End to end, against a project `init` has just written — offline, like
 * `init-add.test.ts`.
 *
 * The flow under test is the one the docs promise: paste a shadcn `globals.css`
 * over `theme.css`, run `delacour theme` with no argument, and the file is
 * rewritten where it sits. The sample is shadcn v4's, which declares no
 * `--destructive-foreground` — the token the converter has to fill in, or a
 * destructive Button's label draws nothing.
 */

const FIXTURES = join(import.meta.dirname, "fixtures");
const REGISTRY = join(import.meta.dirname, "../../../registry");

const SHARED = { registry: REGISTRY, install: false, defaults: true, silent: true, yes: true } as const;

const SHADCN = `:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
}
`;

const THEME_CSS = "src/styles/theme.css";

const workspaces: string[] = [];

async function scaffold(fixture: string): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "delacour-test-"));
	await cp(join(FIXTURES, fixture), directory, { recursive: true });
	workspaces.push(directory);
	return directory;
}

/** A project `init` has set up, with a shadcn file pasted over its `theme.css`. */
async function projectWithShadcnTheme(): Promise<string> {
	const root = await scaffold("expo-app");
	await init([], { ...SHARED, cwd: root });
	await writeFile(join(root, THEME_CSS), SHADCN, "utf-8");
	return root;
}

async function themeTokensCheck(root: string) {
	const checks = await runChecks({ cwd: root, silent: true, fast: true });
	const check = checks.find((entry) => entry.name === "Theme tokens");
	if (!check) throw new Error("doctor did not report a Theme tokens check");
	return check;
}

afterAll(async () => {
	await Promise.all(workspaces.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("theme with no source", () => {
	let root: string;

	beforeAll(async () => {
		root = await projectWithShadcnTheme();
	});

	test("rewrites a shadcn-shaped theme.css in place", async () => {
		await theme(undefined, { ...SHARED, cwd: root });

		const css = await read(root, THEME_CSS);
		expect(css).toContain("@variant light");
		expect(css).toContain("@variant dark");
		expect(css).toContain("--destructive-foreground");
		expect(css).not.toContain(".dark {");
	});

	test("is idempotent — a second run leaves the file byte-identical", async () => {
		const before = await read(root, THEME_CSS);
		await theme(undefined, { ...SHARED, cwd: root });

		expect(await read(root, THEME_CSS)).toBe(before);
	});

	test("says what it expected when the file is neither shape", async () => {
		const other = await scaffold("expo-app");
		await init([], { ...SHARED, cwd: other });
		await writeFile(join(other, THEME_CSS), "/* nothing here */\n", "utf-8");

		await expect(theme(undefined, { ...SHARED, cwd: other })).rejects.toThrow(/@variant/);
	});

	test("points at `delacour add styles` when there is no theme.css at all", async () => {
		const other = await scaffold("expo-app");
		await init([], { ...SHARED, cwd: other });
		await rm(join(other, THEME_CSS));

		await expect(theme(undefined, { ...SHARED, cwd: other })).rejects.toThrow(/delacour add styles/);
	});
});

describe("doctor on the theme file", () => {
	let root: string;

	beforeAll(async () => {
		root = await projectWithShadcnTheme();
	});

	test("fails on a shadcn-shaped theme.css and says how to fix it", async () => {
		const check = await themeTokensCheck(root);

		expect(check.status).toBe("fail");
		expect(check.detail).toContain(".dark");
		expect(check.fix).toContain("delacour theme");
	});

	test("stops failing once the file has been converted", async () => {
		await theme(undefined, { ...SHARED, cwd: root });

		const check = await themeTokensCheck(root);
		expect(check.status).not.toBe("fail");
	});
});

describe("theme with an explicit source", () => {
	test("still writes <styles>/theme.css", async () => {
		const root = await scaffold("expo-app");
		await init([], { ...SHARED, cwd: root });
		await writeFile(join(root, "globals.css"), SHADCN, "utf-8");

		await theme("./globals.css", { ...SHARED, cwd: root });

		const css = await read(root, THEME_CSS);
		expect(css).toContain("@variant light");
		expect(css).toContain("@variant dark");
		expect(css).not.toContain(".dark {");
	});
});

async function read(root: string, path: string): Promise<string> {
	return readFile(join(root, path), "utf-8");
}
