import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Namespace } from "./namespaces";

/**
 * Where to read a registry from, and how one is laid out.
 *
 * The registry is committed to the repository and served straight off
 * `raw.githubusercontent.com`, so there is nothing to host and nothing to keep
 * running. The cost is that a ref has to be chosen: the CLI is published with
 * the tag it was built from baked in, so a given version always reads the
 * registry it shipped against, and `--ref main` opts into whatever has landed
 * since.
 *
 * That a ref pins the whole registry is also what makes it safe to split an
 * item across several documents: `r/button.json` and the files it names are
 * read from one immutable tree, so there is no window in which they disagree.
 */

export const DEFAULT_REGISTRY_URL = "https://raw.githubusercontent.com/delacournz/delacour-ui";

/**
 * Replaced at build time with the git tag being published (see `tsdown.config.ts`).
 * `main` in a working tree, where there is no tag yet.
 */
export const DEFAULT_REGISTRY_REF: string =
	typeof __REGISTRY_REF__ === "string" && __REGISTRY_REF__.length > 0 ? __REGISTRY_REF__ : "main";

declare const __REGISTRY_REF__: string | undefined;

export type RegistrySource = { kind: "remote"; base: string } | { kind: "local"; base: string };

export type ResolveSourceOptions = {
	cwd: string;
	/** `github:owner/repo[#ref]`, a URL, or a filesystem path. */
	url?: string;
	ref?: string;
};

const RAW_GITHUB = "https://raw.githubusercontent.com";
const GITHUB_SHORTHAND = /^github:([^/#]+)\/([^/#]+)(?:#(.+))?$/;
/** `https://raw.githubusercontent.com/owner/repo` and nothing more. */
const BARE_RAW_REPO = new RegExp(`^${RAW_GITHUB}/([^/]+)/([^/]+)$`);

export function resolveRegistrySource(options: ResolveSourceOptions): RegistrySource {
	const ref = options.ref || DEFAULT_REGISTRY_REF;
	const url = options.url?.trim();

	if (!url) return { kind: "remote", base: `${DEFAULT_REGISTRY_URL}/${ref}/registry` };

	const shorthand = GITHUB_SHORTHAND.exec(url);
	if (shorthand) {
		const [, owner, repo, shorthandRef] = shorthand;
		return { kind: "remote", base: `${RAW_GITHUB}/${owner}/${repo}/${shorthandRef || ref}/registry` };
	}

	if (url.startsWith("file://")) return { kind: "local", base: fileURLToPath(url).replace(/\/+$/, "") };

	if (url.startsWith("http://") || url.startsWith("https://")) {
		const trimmed = url.replace(/\/+$/, "");
		const bareRepo = BARE_RAW_REPO.exec(trimmed);

		// A repository root is not a registry; the ref and the directory are still missing.
		if (bareRepo) return { kind: "remote", base: `${trimmed}/${ref}/registry` };
		return { kind: "remote", base: trimmed };
	}

	return { kind: "local", base: isAbsolute(url) ? url.replace(/\/+$/, "") : resolve(options.cwd, url) };
}

/** `registry.json`, `r/<name>.json` and `files/…`, the same layout on disk and over HTTP. */
export function indexPath(source: RegistrySource): string {
	return `${source.base}/registry.json`;
}

export function itemPath(source: RegistrySource, name: string): string {
	return `${source.base}/r/${name}.json`;
}

/**
 * A document named by `files[].path`.
 *
 * Joined with the platform separator for a local source so a Windows checkout
 * reads its own registry, and with `/` for a remote one because that is a URL.
 * `path` has already been through the schema's traversal guard, which is what
 * stops a hostile registry pointing this at `../../../.ssh/id_rsa`.
 */
export function filePath(source: RegistrySource, path: string): string {
	return source.kind === "local" ? join(source.base, path) : `${source.base}/${path}`;
}

/** Where a file lives in the registry, mirroring where it lands in a project. */
export function registryFilePath(namespace: Namespace, target: string): string {
	return `files/${namespace}/${target}`;
}
