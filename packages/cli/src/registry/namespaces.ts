/**
 * The five destinations a registry file can land in, and the placeholder
 * scheme that keeps a file portable between them.
 *
 * A component in `native-ui` imports its neighbours by relative path —
 * `../../lib/cn`. That path is only correct for `native-ui`'s own layout, and
 * the whole point of the CLI is that the consumer picks their own. So the
 * registry builder rewrites every cross-directory import into a placeholder
 * (`@registry/lib/cn`) and the `add` command substitutes the consumer's alias
 * back in.
 *
 * Doing it this way means `add` is a string replacement rather than an AST
 * rewrite: the parsing happens once, in our build, against source we control.
 */

/** Where a file goes. Each maps to one alias in the consumer's `native-components.json`. */
export const NAMESPACES = ["ui", "lib", "hooks", "styles", "icons"] as const;

export type Namespace = (typeof NAMESPACES)[number];

/** The import prefix no real package uses, so a stray placeholder is obvious. */
export const PLACEHOLDER_PREFIX = "@registry";

/** `("lib", "cn")` → `"@registry/lib/cn"`. */
export function toPlaceholder(namespace: Namespace, moduleId: string): string {
	return `${PLACEHOLDER_PREFIX}/${namespace}/${moduleId}`;
}

export type ParsedPlaceholder = {
	namespace: Namespace;
	/** The part after the namespace — `"button/button.variants"`, `"cn"`. */
	moduleId: string;
};

/** Reads a placeholder back apart. Returns `null` for anything else. */
export function parsePlaceholder(specifier: string): ParsedPlaceholder | null {
	if (!specifier.startsWith(`${PLACEHOLDER_PREFIX}/`)) return null;

	const rest = specifier.slice(PLACEHOLDER_PREFIX.length + 1);
	const slash = rest.indexOf("/");
	if (slash === -1) return null;

	const namespace = rest.slice(0, slash);
	const moduleId = rest.slice(slash + 1);
	if (!isNamespace(namespace) || moduleId.length === 0) return null;

	return { namespace, moduleId };
}

export function isNamespace(value: string): value is Namespace {
	return (NAMESPACES as readonly string[]).includes(value);
}
