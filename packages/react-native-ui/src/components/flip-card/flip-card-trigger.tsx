import type { ReactElement } from "react";
import { IconArrowRotateLeftRight } from "../../icons/central";
import { cn } from "../../lib/cn";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useFlipCardPart } from "./flip-card.context";
import {
	FLIP_CARD_ACTION_LABEL,
	type FlipCardFace,
	flipCardVariants,
	oppositeFace,
	resolveFlipCardTriggerHint,
} from "./flip-card.variants";

export type FlipCardTriggerProps = Omit<PressableProps, "onPress"> & {
	/** The face to turn to. Omitted, it toggles. */
	to?: FlipCardFace;
};

/**
 * A control that turns the card — the accessible alternative to a drag, and the
 * only way to turn a `trigger="manual"` card from inside it.
 *
 * A `Pressable`, so `feedback`, `haptic` and the rest are inherited; `onPress`
 * is the turn itself and is not forwarded. Works under every trigger. With no
 * children it draws a rotate glyph and is labelled "Flip card".
 *
 * Inside a face it is a nested gesture, and the deepest recogniser wins: a
 * trigger on a `trigger="press"` card turns the card once, not twice.
 */
export function FlipCardTriggerButton({
	to,
	disabled,
	className,
	children,
	accessibilityLabel,
	accessibilityHint,
	...props
}: FlipCardTriggerProps): ReactElement {
	const { face, flipTo, isDisabled } = useFlipCardPart("FlipCard.Trigger");
	const destination = to ?? oppositeFace(face);
	const isIconOnly = children === undefined;
	const isBlocked = Boolean(disabled) || isDisabled;

	return (
		<Pressable
			accessibilityHint={accessibilityHint ?? resolveFlipCardTriggerHint(destination)}
			accessibilityLabel={accessibilityLabel ?? (isIconOnly ? FLIP_CARD_ACTION_LABEL : undefined)}
			className={flipCardVariants({ isIconOnly }).trigger({ className: cn(isBlocked && "opacity-50", className) })}
			disabled={isBlocked}
			onPress={() => flipTo(destination)}
			{...props}
		>
			{isIconOnly ? <Icon icon={IconArrowRotateLeftRight} /> : children}
		</Pressable>
	);
}
FlipCardTriggerButton.displayName = "DelacourUI.FlipCard.Trigger";
