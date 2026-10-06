import type { ReactElement } from "react";
import { IconChevronLeft, IconChevronTop } from "../../icons/central";
import { Button, type ButtonProps } from "../button";
import { Icon } from "../icon";
import { useCarouselOptionsPart, useCarouselPart } from "./carousel.context";
import type { CarouselArrowProps } from "./carousel.types";

/**
 * Moves back a slide: an icon `Button`, disabled at the start unless looping and
 * whenever the carousel is. Pressing it stops autoplay, as any touch does.
 *
 * Its chevron follows the axis — left when horizontal, up when vertical. Pass
 * children to draw your own; the label "Previous slide" stays unless you give one.
 */
export function CarouselPrevious({
	children,
	isDisabled,
	accessibilityLabel = "Previous slide",
	...props
}: CarouselArrowProps): ReactElement {
	const { canGoPrevious, previous } = useCarouselPart("Carousel.Previous");
	const { isDisabled: isCarouselDisabled, orientation } = useCarouselOptionsPart("Carousel.Previous");

	const buttonProps: ButtonProps = {
		accessibilityLabel,
		haptic: "selection",
		isDisabled: isDisabled || isCarouselDisabled || !canGoPrevious,
		size: "icon-sm",
		variant: "secondary",
		...props,
		onPress: previous,
	};

	return (
		<Button {...buttonProps}>
			{children ?? <Icon icon={orientation === "horizontal" ? IconChevronLeft : IconChevronTop} />}
		</Button>
	);
}
CarouselPrevious.displayName = "DelacourUI.Carousel.Previous";
