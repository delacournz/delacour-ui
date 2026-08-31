import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
 *
 * It is also why an item can name `packages/native-ui/src/...` directly rather
 * than a copy under `registry/`: the library source is in that same immutable
 * tree. So a source has two roots — `base`, the registry directory holding the
 * index and the items, and `root`, the ref it sits in, which is what a file path
 * resolves against.
 */

export const DEFAULT_REGISTRY_URL = "https://raw.githubusercontent.com/delacournz/delacour-ui";

/**
 * Replaced at build time with the git tag being published (see `tsdown.config.ts`).
 * `main` in a working tree, where there is no tag yet.
 */
export const DEFAULT_REGISTRY_REF: string =
	typeof __REGISTRY_REF__ === "string" && __REGISTRY_REF__.length > 0 ? __REGISTRY_REF__ : "main";

declare const __REGISTRY_REF__: string | undefined;

export type RegistrySource = {
	kind: "remote" | "local";
	/** Where `registry.json` and `r/*.json` live. */
	base: string;
	/** What `files[].path` is relative to: the ref, or the directory holding the registry. */
	root: string;
};

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

	if (!url) return remote(`${DEFAULT_REGISTRY_URL}/${ref}`);

	const shorthand = GITHUB_SHORTHAND.exec(url);
	if (shorthand) {
		const [, owner, repo, shorthandRef] = shorthand;
		return remote(`${RAW_GITHUB}/${owner}/${repo}/${shorthandRef || ref}`);
	}

	if (url.startsWith("file://")) return local(fileURLToPath(url).replace(/\/+$/, ""));

	if (url.startsWith("http://") || url.startsWith("https://")) {
		const trimmed = url.replace(/\/+$/, "");
		const bareRepo = BARE_RAW_REPO.exec(trimmed);

		// A repository root is not a registry; the ref and the directory are still missing.
		if (bareRepo) return remote(`${trimmed}/${ref}`);

		// A registry pointed at directly: its ref root is the directory above it, the
		// same relationship `<ref>/registry` has to `<ref>`.
		return { kind: "remote", base: trimmed, root: trimmed.slice(0, trimmed.lastIndexOf("/")) || trimmed };
	}

	return local(isAbsolute(url) ? url.replace(/\/+$/, "") : resolve(options.cwd, url));
}

/** `<ref>` → the registry directory inside it. */
function remote(root: string): RegistrySource {
	return { kind: "remote", base: `${root}/registry`, root };
}

function local(base: string): RegistrySource {
	return { kind: "local", base, root: dirname(base) };
}

/** `registry.json`, `r/<name>.json` and `files/…`, the same layout on disk and over HTTP. */
export function indexPath(source: RegistrySource): string {
	return `${source.base}/registry.json`;
}

export function itemPath(source: RegistrySource, name: string): string {
	return `${source.base}/r/${name}.json`;
}

/**
 * A document named by `files[].path`, resolved against the ref rather than the
 * registry directory — the file is the library's own source, not a copy inside
 * `registry/`.
 *
 * Joined with the platform separator for a local source so a Windows checkout
 * reads its own registry, and with `/` for a remote one because that is a URL.
 * `path` has already been through the schema's traversal guard, which is what
 * stops a hostile registry pointing this at `../../../.ssh/id_rsa`. A local
 * registry can therefore reach anything under the directory holding it, which is
 * one level wider than before and is the price of not duplicating the library.
 */
export function filePath(source: RegistrySource, path: string): string {
	return source.kind === "local" ? join(source.root, path) : `${source.root}/${path}`;
}

/** Where a file actually lives: `packages/native-ui` + `components/button/button.tsx`. */
export function sourceFilePath(packageDir: string, sourcePath: string): string {
	return `${packageDir}/src/${sourcePath}`;
}
