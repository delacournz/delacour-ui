import { relative, sep } from "node:path";
import { NAMESPACES, type Namespace } from "./namespaces";

/**
 * Turns the registry's `@registry/…` placeholders into imports that work in
 * this project.
 *
 * This is the whole of `add`'s code transformation, and it is a string
 * substitution rather than an AST rewrite. shadcn parses each file with
 * ts-morph and recast at this point; the parsing here already happened, once,
 * in our own build against source we control. What arrives is a placeholder in
 * a known shape, and what leaves is the consumer's own alias.
 *
 * A namespace with no alias configured falls back to a relative path computed
 * from where the files actually land — so a project with no `tsconfig` paths at
 * all, or with `experiments.tsconfigPaths` off, still gets imports Metro can
 * resolve.
 */

export type TransformContext = {
	/** Absolute directory the file being written lands in. */
	fileDirectory: string;
	/** Absolute destination directory per namespace. */
	directories: Record<Namespace, string>;
	/** Import prefix per namespace. A namespace absent here falls back to relative. */
	aliases: Partial<Record<Namespace, string>>;
};

/**
 * Anchored on the surrounding quote or backtick.
 *
 * Every placeholder we emit is either a module specifier or a citation inside a
 * doc comment's backticks, so requiring the delimiter costs nothing and rules
 * out swallowing the full stop at the end of a sentence — `button.variants` and
 * `cn.` are not distinguishable without it.
 */
const PLACEHOLDER = new RegExp(`(["'\`])@registry/(${NAMESPACES.join("|")})/([^"'\`]+)\\1`, "g");

export function transformContent(content: string, context: TransformContext): string {
	return content.replace(PLACEHOLDER, (_match, delimiter: string, namespace: string, moduleId: string) => {
		const specifier = specifierFor(namespace as Namespace, moduleId, context);
		return `${delimiter}${specifier}${delimiter}`;
	});
}

function specifierFor(namespace: Namespace, moduleId: string, context: TransformContext): string {
	const alias = context.aliases[namespace];
	if (alias) return `${alias.replace(/\/+$/, "")}/${moduleId}`;

	const target = `${context.directories[namespace]}/${moduleId}`;
	const path = toPosix(relative(context.fileDirectory, target));

	// `relative` gives a bare name for a sibling, which resolves as a package.
	return path.startsWith(".") ? path : `./${path}`;
}

function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}
