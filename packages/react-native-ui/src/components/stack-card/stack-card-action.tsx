import { type ReactElement, useCallback } from "react";
import { Button } from "../button";
import { Icon, type IconComponent } from "../icon";
import { useStackCardPart } from "./stack-card.context";
import type { StackCardDirection } from "./stack-card.variants";

export type StackCardActionProps = {
	/** Throw the top card this way, or bring the last one back. */
	action: StackCardDirection | "undo";
	icon: IconComponent;
	/**
	 * What a screen reader calls the button. Defaults to the deck's
	 * `directionLabels` for the direction, or "Undo".
	 */
	label?: string;
	/** Called before the deck acts. */
	onPress?: () => void;
	className?: string;
	testID?: string;
};

/**
 * A round button that answers for the top card without a drag.
 *
 * A direction throws the card exactly as a release would — `onSwipe`, then
 * `onIndexChange` — and `undo` brings the last one back. A direction's glyph is
 * tinted with the colour of the stamp answering for that direction, so the
 * button and the stamp read as one answer. `undo` is a quiet ghost button,
 * disabled while there is nothing to bring back; the directions disable once
 * the deck is empty.
 */
export function StackCardAction({
	action,
	icon,
	label,
	onPress,
	className,
	testID,
}: StackCardActionProps): ReactElement {
	const { swipe, undo, canUndo, index, count, isDisabled, labelFor, stampColors } =
		useStackCardPart("StackCard.Action");
	const isUndo = action === "undo";
	const isActionDisabled = isDisabled || (isUndo ? !canUndo : index >= count);
	const color = isUndo ? undefined : stampColors[action];

	const handlePress = useCallback(() => {
		onPress?.();
		if (action === "undo") undo();
		else swipe(action);
	}, [action, onPress, swipe, undo]);

	return (
		<Button
			accessibilityLabel={label ?? (action === "undo" ? "Undo" : labelFor(action))}
			className={className}
			isDisabled={isActionDisabled}
			onPress={handlePress}
			size="icon-lg"
			testID={testID}
			variant={isUndo ? "ghost" : "secondary"}
		>
			<Icon color={color} icon={icon} />
		</Button>
	);
}
StackCardAction.displayName = "DelacourUI.StackCard.Action";
