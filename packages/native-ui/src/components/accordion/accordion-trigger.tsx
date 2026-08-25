import { Children, isValidElement, type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { View } from "react-native";
import { type IconDefaults, IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useAccordionItemPart, useAccordionPart } from "./accordion.context";
import { ACCORDION_FOREGROUND_TOKEN, accordionVariants } from "./accordion.variants";
import { AccordionDescription } from "./accordion-description";
import { AccordionIndicator } from "./accordion-indicator";
import { AccordionTitle } from "./accordion-title";

export type AccordionTriggerProps = Omit<PressableProps, "children" | "disabled" | "onPress"> & {
	className?: string;
	children?: ReactNode;
};

/**
 * The row that opens and closes an item.
 *
 * A `Pressable`, so `feedback`, `haptic`, `pressedScale` and the rest come from
 * there rather than being restated here. Two defaults differ: `fade`, because a
 * full-bleed row that scales reads as the whole card flexing rather than as one
 * row responding — `ListGroup.Item`'s reason — and `haptic="selection"`, because
 * an item is a state toggle and the panel landing is the confirmation, which is
 * `Checkbox`'s and `Switch`'s. `haptic={false}` silences it.
 *
 * `onPress` is the one prop `Omit`ed rather than forwarded: the press **is** the
 * toggle, and a side effect belongs on the accordion's `onValueChange`. The trade
 * `Checkbox` already makes.
 *
 * It assembles its own row — titles and descriptions stack in a column, an
 * indicator is moved to the end, and one is composed in when the children hold
 * none — so the anatomy needs no wrapper part between a trigger and its text.
 *
 * `accessibilityState.expanded` is the only thing added to what `Pressable`
 * already announces. There is deliberately no separate heading element wrapping
 * it: state set in two places is state a screen reader reads out twice.
 */
export function AccordionTrigger({
	feedback = "fade",
	haptic = "selection",
	className,
	children,
	...props
}: AccordionTriggerProps): ReactElement {
	const { size, toggle } = useAccordionPart("Accordion.Trigger");
	const { isDisabled, isExpanded, value } = useAccordionItemPart("Accordion.Trigger");

	const slots = accordionVariants({ size });
	const columnClassName = slots.triggerContent();
	const glyphClassName = slots.glyph();

	const handlePress = useCallback(() => toggle(value), [toggle, value]);

	const content = useMemo(() => composeRow(children, columnClassName), [children, columnClassName]);

	const iconDefaults = useMemo<IconDefaults>(
		() => ({ className: glyphClassName, color: ACCORDION_FOREGROUND_TOKEN }),
		[glyphClassName]
	);

	return (
		<Pressable
			accessibilityState={{ expanded: isExpanded }}
			className={slots.trigger({ className })}
			disabled={isDisabled}
			feedback={feedback}
			haptic={haptic}
			onPress={handlePress}
			{...props}
		>
			<IconDefaultsProvider value={iconDefaults}>{content}</IconDefaultsProvider>
		</Pressable>
	);
}
AccordionTrigger.displayName = "DelacourUI.Accordion.Trigger";

/**
 * Arranges a trigger's children into the row the anatomy describes.
 *
 * Three things happen, and each has a call site it saves:
 *
 * - **Bare strings become a title.** React Native crashes on a raw string outside
 *   a `<Text>`, so `<Accordion.Trigger>Shipping</Accordion.Trigger>` would red-box.
 *   Consecutive strings collapse into one, because `Item {index}` is a single
 *   piece of text and wrapping the parts separately would stack them.
 * - **Titles and descriptions stack in a column.** They are the only children that
 *   belong on top of each other; anything else — a leading `Icon`, a `Badge` — is
 *   left where it was written, as a sibling on the row. That is what makes a
 *   `Accordion.TriggerContent` part unnecessary rather than merely absent.
 * - **The indicator goes last, and is composed in when there is none.** So a
 *   trigger reads as its content and still ends with the glyph that says it opens.
 *
 * Lives here rather than with the root: it is the trigger that arranges its own
 * children, and importing it from `./accordion` would close a cycle. See AGENTS.md.
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
		column.push(<AccordionTitle key={`title-${column.length}`}>{run.join("")}</AccordionTitle>);
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

		if (isValidElement(child) && child.type === AccordionIndicator) {
			hasIndicator = true;
			trailing.push(child);
			continue;
		}

		if (isValidElement(child) && (child.type === AccordionTitle || child.type === AccordionDescription)) {
			column.push(child);
			continue;
		}

		flushColumn();
		row.push(child);
	}

	flushRun();
	flushColumn();

	if (!hasIndicator) trailing.push(<AccordionIndicator key="indicator" />);

	return [...row, ...trailing];
}
