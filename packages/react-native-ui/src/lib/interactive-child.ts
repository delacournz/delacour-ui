/**
 * A development warning for the one accessibility mistake a merged container makes silently.
 *
 * An `accessible` view is one element to a screen reader: VoiceOver and TalkBack read its children
 * as its label and never focus them. A `Pressable`, a link or a switch inside one is still drawn and
 * still answers a finger, but a screen-reader user cannot reach it at all. The house pattern for a
 * container that has to stay one stop — `Chip`, `Attachment`, `Badge` — is to hide the inner control
 * (`accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`) and offer it
 * as a named `accessibilityActions` entry on the container instead.
 *
 * `findInteractiveChild` walks the React element tree a container was handed — its `children` and
 * theirs, through fragments and arrays — and returns the first element that looks like a control: a
 * press or long-press handler, or a control role. A subtree hidden from assistive technology is
 * skipped, so the mirrored duplicate of an action does not trip it.
 *
 * It reads props, not the rendered tree, so a control a composite child renders internally (a
 * `Post.Votes` that draws its own buttons) is invisible to it. That is a deliberate limit: the
 * warning catches the common case — a caller composing a `Pressable` straight into the container —
 * at no render cost, and a false positive would be worse than a miss.
 *
 * Imports nothing from React Native, so the walk is unit-testable.
 */

import { isValidElement, type ReactNode } from "react";

/** The roles assistive technology treats as something to operate, not something to read. */
const CONTROL_ROLES: ReadonlySet<string> = new Set([
	"adjustable",
	"button",
	"checkbox",
	"combobox",
	"imagebutton",
	"link",
	"menuitem",
	"radio",
	"scrollbar",
	"slider",
	"spinbutton",
	"switch",
	"tab",
	"togglebutton",
]);

/** The handlers that make an element a control whatever its role. */
const CONTROL_HANDLERS = ["onPress", "onLongPress"] as const;

/** How far below the container the walk looks before giving up. */
const DEFAULT_MAX_DEPTH = 12;

/** The control found inside a container, named for a warning. */
export type InteractiveChild = {
	/** The element's `displayName`, its function name, or its host type. */
	name: string;
	/** Why it counts: the handler it carries, or `role <role>`. */
	reason: string;
};

type ElementProps = Record<string, unknown> & { children?: ReactNode };

function elementName(type: unknown): string {
	if (typeof type === "string") return type;
	if (typeof type === "function" || (typeof type === "object" && type !== null)) {
		const named = type as { displayName?: unknown; name?: unknown };
		if (typeof named.displayName === "string" && named.displayName.length > 0) return named.displayName;
		if (typeof named.name === "string" && named.name.length > 0) return named.name;
	}
	return "Unknown";
}

function isHiddenFromAssistiveTechnology(props: ElementProps): boolean {
	return (
		props.accessibilityElementsHidden === true ||
		props.importantForAccessibility === "no-hide-descendants" ||
		props["aria-hidden"] === true
	);
}

function controlReason(props: ElementProps): string | undefined {
	for (const handler of CONTROL_HANDLERS) {
		if (typeof props[handler] === "function") return handler;
	}
	const role = props.accessibilityRole ?? props.role;
	if (typeof role === "string" && CONTROL_ROLES.has(role)) return `role ${role}`;
	return undefined;
}

function walk(node: ReactNode, depth: number, maxDepth: number): InteractiveChild | undefined {
	if (depth > maxDepth || node === null || node === undefined || typeof node === "boolean") return undefined;
	if (Array.isArray(node)) {
		for (const child of node) {
			const found = walk(child as ReactNode, depth, maxDepth);
			if (found) return found;
		}
		return undefined;
	}
	if (!isValidElement(node)) return undefined;
	const props = (node.props ?? {}) as ElementProps;
	if (isHiddenFromAssistiveTechnology(props)) return undefined;
	const reason = controlReason(props);
	if (reason) return { name: elementName(node.type), reason };
	return walk(props.children, depth + 1, maxDepth);
}

/**
 * The first control inside `children` that a merged container would swallow, or `undefined`.
 *
 * Subtrees hidden from assistive technology are skipped and not descended into.
 */
export function findInteractiveChild(
	children: ReactNode,
	{ maxDepth = DEFAULT_MAX_DEPTH }: { maxDepth?: number } = {}
): InteractiveChild | undefined {
	return walk(children, 0, maxDepth);
}

const WARNED = new Set<string>();

function isDevelopment(): boolean {
	return typeof __DEV__ !== "undefined" && __DEV__;
}

/**
 * Warns, once per component and control, when an `accessible` container wraps a control a screen
 * reader cannot reach. Development only: in a production build it returns before walking anything.
 *
 * `isDev` and `warn` exist for tests; a component passes neither.
 */
export function warnInteractiveChildInAccessible({
	component,
	accessible,
	children,
	isDev = isDevelopment(),
	warn = console.warn,
}: {
	/** The container's public name, as the warning prints it: `Post`, `Message`. */
	component: string;
	/** Whether the container is one accessibility element. Nothing is checked when it is not. */
	accessible: boolean | undefined;
	children: ReactNode;
	isDev?: boolean;
	warn?: (message: string) => void;
}): void {
	if (!isDev || accessible !== true) return;
	const found = findInteractiveChild(children);
	if (!found) return;
	const key = `${component}:${found.name}:${found.reason}`;
	if (WARNED.has(key)) return;
	WARNED.add(key);
	warn(
		`[${component}] is one accessibility element, so a screen reader cannot reach the ${found.name} inside it (${found.reason}). ` +
			"Hide it from assistive technology and offer it as a named entry in the container's accessibilityActions instead."
	);
}
