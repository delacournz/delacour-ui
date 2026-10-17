import type { ReactElement } from "react";
import { IconChevronBottom, IconChevronRight } from "../../icons/central";
import { Button, type ButtonProps } from "../button";
import { Icon } from "../icon";
import { useCarouselOptionsPart, useCarouselPart } from "./carousel.context";
import type { CarouselArrowProps } from "./carousel.types";

/**
 * Moves on a slide: an icon `Button`, disabled at the end unless looping and
 * whenever the carousel is. Pressing it stops autoplay, as any touch does.
 *
 * Its chevron follows the axis — right when horizontal, down when vertical. Pass
 * children to draw your own; the label "Next slide" stays unless you give one.
 */
export function CarouselNext({
	children,
	isDisabled,
	accessibilityLabel = "Next slide",
	...props
}: CarouselArrowProps): ReactElement {
	const { canGoNext, next } = useCarouselPart("Carousel.Next");
	const { isDisabled: isCarouselDisabled, orientation } = useCarouselOptionsPart("Carousel.Next");

	const buttonProps: ButtonProps = {
		accessibilityLabel,
		haptic: "selection",
		isDisabled: isDisabled || isCarouselDisabled || !canGoNext,
		size: "icon-sm",
		variant: "secondary",
		...props,
		onPress: next,
	};

	return (
		<Button {...buttonProps}>
			{children ?? <Icon icon={orientation === "horizontal" ? IconChevronRight : IconChevronBottom} />}
		</Button>
	);
}
CarouselNext.displayName = "DelacourUI.Carousel.Next";
