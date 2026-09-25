import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { View } from "react-native";
import { type IconDefaults, IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useCollapsiblePart } from "./collapsible.context";
import {
	COLLAPSIBLE_FOREGROUND_TOKEN,
	collapsibleVariants,
	resolveCollapsibleAccessibility,
} from "./collapsible.variants";
import { CollapsibleDescription } from "./collapsible-description";
import { CollapsibleIndicator } from "./collapsible-indicator";
import { CollapsibleTitle } from "./collapsible-title";

export type CollapsibleTriggerProps = Omit<PressableProps, "children" | "disabled" | "onPress"> & {
	className?: string;
	children?: ReactNode;
};

/**
 * The row that opens and closes the section.
 *
 * A `Pressable`, so `feedback`, `haptic` and the rest are inherited. Two defaults
 * differ, for `Accordion.Trigger`'s reasons: `fade`, because a full-bleed row that
 * scales reads as the whole card flexing, and `haptic="selection"`, because the
 * press is a state toggle.
 *
 * `onPress` is `Omit`ed rather than forwarded: the press **is** the toggle, and a
 * side effect belongs on the root's `onOpenChange`, which also hears a controlled
 * change the trigger never sees.
 *
 * It assembles its own row — titles and descriptions stack in a column, anything
 * else stays where it was written, an indicator moves to the end, and one is
 * composed in when the children hold none.
 */
export function CollapsibleTrigger({
	feedback = "fade",
	haptic = "selection",
	className,
	children,
	...props
}: CollapsibleTriggerProps): ReactElement {
	const { isDisabled, isOpen, size, toggle } = useCollapsiblePart("Collapsible.Trigger");
	const { trigger: a11y } = resolveCollapsibleAccessibility({ isDisabled, isOpen });

	const slots = collapsibleVariants({ size });
	const columnClassName = slots.triggerContent();
	const glyphClassName = slots.glyph();

	const content = useMemo(() => composeRow(children, columnClassName), [children, columnClassName]);

	const iconDefaults = useMemo<IconDefaults>(
		() => ({ className: glyphClassName, color: COLLAPSIBLE_FOREGROUND_TOKEN }),
		[glyphClassName]
	);

	return (
		<Pressable
			accessibilityState={{ expanded: a11y.expanded }}
			className={slots.trigger({ className })}
			disabled={a11y.disabled}
			feedback={feedback}
			haptic={haptic}
			onPress={toggle}
			{...props}
		>
			<IconDefaultsProvider value={iconDefaults}>{content}</IconDefaultsProvider>
		</Pressable>
	);
}
CollapsibleTrigger.displayName = "DelacourUI.Collapsible.Trigger";

/**
 * Arranges the trigger's children into its row.
 *
 * Bare strings become one `Collapsible.Title` (a raw string outside a `<Text>`
 * red-boxes), titles and descriptions stack in a column, anything else stays on
 * the row where it was written, and the indicator goes last — composed in when
 * there is none. `Accordion.Trigger`'s arrangement, rule for rule.
 */
function composeRow(children: ReactNode, columnClassName: string): ReactNode {
	const items = Children.toArray(children);
	const row: ReactNode[] = [];
	const trailing: ReactNode[] = [];
	let column: ReactNode[] = [];
	let run: (string | number)[] = [];
	let hasIndicator = false;

	const flushRun = () => {
		if (run.length === 0) return;
		column.push(<CollapsibleTitle key={`title-${column.length}`}>{run.join("")}</CollapsibleTitle>);
		run = [];
	};

	const flushColumn = () => {
		if (column.length === 0) return;
		row.push(
			<View className={columnClassName} key={`content-${row.length}`}>
				{column}
			</View>
		);
		column = [];
	};

	for (const child of items) {
		if (typeof child === "string" || typeof child === "number") {
			run.push(child);
			continue;
		}
		flushRun();

		if (isValidElement(child) && child.type === CollapsibleIndicator) {
			hasIndicator = true;
			trailing.push(child);
			continue;
		}

		if (isValidElement(child) && (child.type === CollapsibleTitle || child.type === CollapsibleDescription)) {
			column.push(child);
			continue;
		}

		flushColumn();
		row.push(child);
	}

	flushRun();
	flushColumn();

	if (!hasIndicator) trailing.push(<CollapsibleIndicator key="indicator" />);

	return [...row, ...trailing];
}
