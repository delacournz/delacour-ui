import { classifySource, resolveModuleId, type SourceClassification } from "./classify";
import { toPlaceholder } from "./namespaces";
import { scanImports } from "./scan-imports";

/**
 * Rewrites a `native-ui` source file's imports into the portable placeholder
 * form the registry ships.
 *
 * A relative import is only rewritten when it crosses a directory. `./cn` from
 * `lib/merge-props.ts` is left exactly as it is, because both files land in the
 * consumer's `lib` directory whatever they call it; `../../lib/cn` from a
 * component becomes `@registry/lib/cn`, because the consumer chooses where `lib`
 * lives. Rewriting the first would work too, but leaving it alone keeps the
 * copied file reading the way the original does.
 *
 * Replacements are applied back-to-front by offset, so an earlier specifier's
 * span stays valid after a later one has changed length.
 */

export type CanonicaliseInput = {
	/** Path relative to `packages/native-ui/src`. */
	path: string;
	content: string;
	/** Every source path in the tree, for resolving relative specifiers. */
	sourcePaths: readonly string[];
	/** `@delacour/native-ui/button` → `components/button/index.ts`. */
	packageSubpaths: ReadonlyMap<string, string>;
};

export type CanonicaliseOutput = {
	content: string;
	/** Other registry items this file needs, sorted, excluding its own. */
	registryDependencies: string[];
	/** Bare specifiers, sorted — classified into npm dependencies by the builder. */
	bareImports: string[];
};

export function canonicaliseFile(input: CanonicaliseInput): CanonicaliseOutput {
	const self = classifySource(input.path);
	if (!self) throw new Error(`Cannot canonicalise ${input.path}: it is not a registry source file`);

	const registryDependencies = new Set<string>();
	const bareImports = new Set<string>();
	let content = input.content;

	for (const scanned of scanImports(input.content).reverse()) {
		const resolved = resolve(scanned.specifier, input, self);

		if (!resolved) {
			bareImports.add(scanned.specifier);
			continue;
		}

		if (resolved.item !== self.item) registryDependencies.add(resolved.item);

		const replacement = specifierFor(scanned.specifier, self, resolved);
		if (replacement === scanned.specifier) continue;

		content = content.slice(0, scanned.start) + replacement + content.slice(scanned.end);
	}

	return {
		content: rewritePackageReferences(content, input.packageSubpaths),
		registryDependencies: [...registryDependencies].sort(),
		bareImports: [...bareImports].sort(),
	};
}

/**
 * Resolves a specifier to the registry file it names, or `null` when it points
 * outside the registry (a bare npm package).
 *
 * A relative specifier that resolves to nothing throws rather than falling
 * through to the bare case: it would otherwise be published as an npm
 * dependency named `./gone`, and the failure would surface as an unresolvable
 * import in a stranger's Metro bundle.
 */
function resolve(specifier: string, input: CanonicaliseInput, self: SourceClassification): SourceClassification | null {
	if (specifier.startsWith(".")) {
		const path = resolveModuleId(input.path, specifier, input.sourcePaths);
		if (!path) throw new Error(`${input.path}: relative import "${specifier}" resolves to no source file`);

		const classification = classifySource(path);
		if (!classification)
			throw new Error(`${input.path}: "${specifier}" resolves to ${path}, which the registry excludes`);

		return classification;
	}

	const packageTarget = input.packageSubpaths.get(specifier);
	if (!packageTarget) return null;

	const classification = classifySource(packageTarget);
	if (!classification) throw new Error(`${self.item}: package subpath "${specifier}" maps outside the registry`);

	return classification;
}

/**
 * The specifier to write: unchanged when both files land in the same directory,
 * a placeholder otherwise.
 */
function specifierFor(original: string, self: SourceClassification, resolved: SourceClassification): string {
	if (resolved.moduleId === null) return original;

	const sameDirectory =
		self.namespace === resolved.namespace && directoryOf(self.target) === directoryOf(resolved.target);
	if (sameDirectory && original.startsWith(".")) return original;

	return toPlaceholder(resolved.namespace, resolved.moduleId);
}

/**
 * Canonicalises a Markdown file — the prose rewrite alone.
 *
 * Each component folder carries an `AGENTS.md` describing what the component is
 * and why it is built the way it is, and that travels with the copy: an agent
 * working in the consumer's repository gets the design rules next to the code,
 * which is the whole advantage of owning the source rather than a package.
 *
 * It cannot go through `canonicaliseFile`, which parses its input as
 * TypeScript. Only the package subpaths need rewriting, so that the copied doc
 * cites the copy rather than a package its new owner never installed.
 */
export function canonicaliseMarkdown(content: string, packageSubpaths: ReadonlyMap<string, string>): string {
	return rewritePackageReferences(content, packageSubpaths);
}

/**
 * Rewrites `@delacour/native-ui/…` where it appears in prose.
 *
 * Doc comments cite sibling modules by their package subpath. Left alone, a
 * copied `icon.tsx` would tell its new owner to import from a package they
 * never installed. Longest subpath first, so `…/icons/central` is not
 * half-matched by `…/icons`.
 */
function rewritePackageReferences(content: string, packageSubpaths: ReadonlyMap<string, string>): string {
	const subpaths = [...packageSubpaths.keys()].sort((a, b) => b.length - a.length);
	let output = content;

	for (const subpath of subpaths) {
		if (!output.includes(subpath)) continue;

		const classification = classifySource(packageSubpaths.get(subpath) as string);
		if (!classification?.moduleId) continue;

		output = output.replaceAll(subpath, toPlaceholder(classification.namespace, classification.moduleId));
	}

	return output;
}

function directoryOf(target: string): string {
	const slash = target.lastIndexOf("/");
	return slash === -1 ? "" : target.slice(0, slash);
}
