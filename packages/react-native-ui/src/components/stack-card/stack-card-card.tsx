import { type ReactElement, useCallback, useMemo } from "react";
import { type AccessibilityActionEvent, type AccessibilityActionInfo, View, type ViewProps } from "react-native";
import { useStackCardPart, useStackCardSlot } from "./stack-card.context";
import { STACK_CARD_DIRECTIONS, type StackCardDirection, stackCardVariants } from "./stack-card.variants";

export type StackCardCardProps = ViewProps & {
	className?: string;
};

const UNDO_ACTION = "undo";

/** The accessibility action name a direction is announced under. */
function actionName(direction: StackCardDirection): string {
	return `swipe-${direction}`;
}

/**
 * One card in the deck.
 *
 * A card's look — the card fill, a hairline and the card corner — absolutely
 * filling the pile, so every card occupies one box and only a transform tells
 * them apart. Its position, tilt and opacity are the deck's, applied by the slot
 * around it; the card itself holds no gesture.
 *
 * The top card is one `accessible` element whose custom actions are the deck's
 * allowed directions — named by `directionLabels`, or "Swipe left" and so on —
 * plus "Undo" while there is a card to bring back. A screen reader swipes the
 * deck from the actions rotor rather than by dragging. Because the card is one
 * element, a control inside it is not separately reachable: put the deck's
 * controls in `StackCard.Actions`, not on the card.
 */
export function StackCardCard({ className, children, ...props }: StackCardCardProps): ReactElement {
	const { directions, labelFor, swipe, undo, canUndo } = useStackCardPart("StackCard.Card");
	const slot = useStackCardSlot();
	const isTop = slot?.isTop ?? false;

	const actions = useMemo<AccessibilityActionInfo[]>(() => {
		const list: AccessibilityActionInfo[] = directions.map((direction) => ({
			label: labelFor(direction),
			name: actionName(direction),
		}));
		if (canUndo) list.push({ label: "Undo", name: UNDO_ACTION });
		return list;
	}, [canUndo, directions, labelFor]);

	const handleAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const name = event.nativeEvent.actionName;
			if (name === UNDO_ACTION) {
				undo();
				return;
			}
			const direction = STACK_CARD_DIRECTIONS.find((candidate) => actionName(candidate) === name);
			if (direction) swipe(direction);
		},
		[swipe, undo]
	);

	return (
		<View
			accessibilityActions={isTop ? actions : undefined}
			accessible={isTop}
			className={stackCardVariants().card({ className })}
			onAccessibilityAction={isTop ? handleAction : undefined}
			{...props}
		>
			{children}
		</View>
	);
}
StackCardCard.displayName = "DelacourUI.StackCard.Card";
