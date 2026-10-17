import type { ReactElement } from "react";
import { View } from "react-native";
import { useCarouselOptionsPart } from "./carousel.context";
import type { CarouselSlotProps } from "./carousel.types";
import { carouselVariants } from "./carousel.variants";

export type CarouselControlsProps = CarouselSlotProps;

/**
 * A row for `Carousel.Previous` · `Carousel.Dots` · `Carousel.Next`, spread to the
 * ends — a column when the carousel is vertical. Layout only; it reads no state.
 */
export function CarouselControls({ className, ...props }: CarouselControlsProps): ReactElement {
	const { orientation, variant } = useCarouselOptionsPart("Carousel.Controls");
	return <View className={carouselVariants({ orientation, variant }).controls({ className })} {...props} />;
}
CarouselControls.displayName = "DelacourUI.Carousel.Controls";
