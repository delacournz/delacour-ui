import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRegistryClient } from "./client";
import type { RegistryFile } from "./schema";

describe("a registry read from a local directory", () => {
	let root: string;
	let first: string;

	beforeAll(async () => {
		root = await mkdtemp(join(tmpdir(), "delacour-client-"));
		const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf-8" }).trim();
		git("init", "-q");
		git("config", "user.email", "test@example.com");
		git("config", "user.name", "test");
		await mkdir(join(root, "registry"), { recursive: true });
		await writeFile(join(root, "registry/registry.json"), JSON.stringify({ name: "x", items: [] }));
		await writeFile(join(root, "button.tsx"), "old\n");
		git("add", ".");
		git("commit", "-qm", "first");
		first = git("rev-parse", "--short", "HEAD");
		await writeFile(join(root, "button.tsx"), "new\n");
	});

	afterAll(async () => {
		await rm(root, { recursive: true, force: true });
	});

	const file: RegistryFile = { path: "button.tsx", namespace: "ui", target: "button/button.tsx", rewrites: [] };

	test("serves the working tree, whatever ref it is given", async () => {
		const client = createRegistryClient({ cwd: root, url: join(root, "registry"), ref: first });

		expect(await client.getFile(file)).toBe("new\n");
	});

	test("with atRef, serves the file as that commit held it", async () => {
		const client = createRegistryClient({ cwd: root, url: join(root, "registry"), ref: first, atRef: true });

		expect(await client.getFile(file)).toBe("old\n");
	});

	test("with atRef, a ref git does not know is a failed read, not the working tree", async () => {
		const client = createRegistryClient({ cwd: root, url: join(root, "registry"), ref: "nope", atRef: true });

		await expect(client.getFile(file)).rejects.toThrow();
	});
});
