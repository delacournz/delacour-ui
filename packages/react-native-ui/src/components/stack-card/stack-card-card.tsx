import { type ReactElement, useCallback, useEffect, useMemo, useRef } from "react";
import {
	type AccessibilityActionEvent,
	type AccessibilityActionInfo,
	AccessibilityInfo,
	View,
	type ViewInstance,
	type ViewProps,
} from "react-native";
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
 *
 * When one of those actions throws or undoes, the card that held screen-reader
 * focus has gone, so the card now on top asks for it (unless the deck's
 * `announce` is `false`).
 */
export function StackCardCard({ className, children, ...props }: StackCardCardProps): ReactElement {
	const { directions, labelFor, swipeFromCard, undoFromCard, canUndo, focusToken } = useStackCardPart("StackCard.Card");
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

	// Asks for screen-reader focus when the card's own action moved the top card and this card is
	// now on top. The token is read at mount, so a card mounting later never focuses itself.
	const viewRef = useRef<ViewInstance>(null);
	const handledToken = useRef(focusToken);
	useEffect(() => {
		if (handledToken.current === focusToken) return;
		handledToken.current = focusToken;
		if (!isTop || viewRef.current === null) return;
		AccessibilityInfo.sendAccessibilityEvent(viewRef.current, "focus");
	}, [focusToken, isTop]);

	const handleAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const name = event.nativeEvent.actionName;
			if (name === UNDO_ACTION) {
				undoFromCard();
				return;
			}
			const direction = STACK_CARD_DIRECTIONS.find((candidate) => actionName(candidate) === name);
			if (direction) swipeFromCard(direction);
		},
		[swipeFromCard, undoFromCard]
	);

	return (
		<View
			accessibilityActions={isTop ? actions : undefined}
			accessible={isTop}
			className={stackCardVariants().card({ className })}
			onAccessibilityAction={isTop ? handleAction : undefined}
			ref={viewRef}
			{...props}
		>
			{children}
		</View>
	);
}
StackCardCard.displayName = "DelacourUI.StackCard.Card";
